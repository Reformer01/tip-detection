"""
vision.py — Screen capture, image preprocessing, OCR, and tip-event parsing.

Responsibilities:
  - Capture a specific screen zone using mss
  - Pre-process the raw image (upscale, grayscale, threshold, denoise)
    so OCR engines get the cleanest possible input
  - Run EasyOCR or Tesseract on the cleaned image
  - Parse raw OCR text into structured TipEvent / BalanceReading objects
"""

from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass, field
from typing import Optional

import cv2
import mss
import numpy as np

logger = logging.getLogger("vision")


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class Zone:
    """A rectangular region on screen to capture."""
    label: str
    x: int
    y: int
    w: int
    h: int
    enabled: bool = True

    def as_mss_region(self, monitor_offset: dict) -> dict:
        """Convert to the dict mss.grab() expects, adjusted for monitor origin."""
        return {
            "left":   self.x + monitor_offset.get("left", 0),
            "top":    self.y + monitor_offset.get("top",  0),
            "width":  self.w,
            "height": self.h,
        }


@dataclass
class BalanceReading:
    tokens: int
    captured_at: float = field(default_factory=time.time)
    raw_text: str = ""


@dataclass
class TipEvent:
    """A fully parsed tip event ready to ship to the backend."""
    username: str
    amount: int
    message: str = ""
    platform: str = "chaturbate"
    is_anon: bool = False
    captured_at: float = field(default_factory=time.time)
    source: str = "ocr_popup"   # "ocr_popup" | "balance_delta"
    raw_text: str = ""

    def to_dict(self) -> dict:
        import uuid
        return {
            "eventId":     str(uuid.uuid4()),
            "ts":          _iso(self.captured_at),
            "type":        "tip",
            "platform":    self.platform,
            "username":    self.username,
            "amount":      self.amount,
            "currency":    "tokens",
            "message":     self.message,
            "isAnon":      self.is_anon,
            "source":      self.source,
        }


def _iso(ts: float) -> str:
    import datetime
    return datetime.datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M:%S.000Z")


# ---------------------------------------------------------------------------
# Image preprocessor
# ---------------------------------------------------------------------------

class ImagePreprocessor:
    """
    Converts a raw mss screenshot (BGRA numpy array) into a clean
    high-contrast grayscale image that OCR engines can read reliably.
    """

    def __init__(self, upscale: int = 3, threshold: int = 145, denoise: bool = True):
        self.upscale   = upscale
        self.threshold = threshold
        self.denoise   = denoise

    def process(self, bgra: np.ndarray) -> np.ndarray:
        # Drop alpha, convert to greyscale
        gray = cv2.cvtColor(bgra, cv2.COLOR_BGRA2GRAY)

        # Upscale — OCR accuracy jumps significantly above 60px character height
        h, w = gray.shape
        if self.upscale > 1:
            gray = cv2.resize(
                gray, (w * self.upscale, h * self.upscale),
                interpolation=cv2.INTER_LANCZOS4
            )

        # Optional: denoise before thresholding
        if self.denoise:
            gray = cv2.fastNlMeansDenoising(gray, h=12, templateWindowSize=7, searchWindowSize=21)

        # Adaptive threshold + Otsu fallback
        _, binary = cv2.threshold(
            gray, self.threshold, 255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )

        # Dilate slightly to thicken thin stream-compressed characters
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary = cv2.dilate(binary, kernel, iterations=1)

        return binary

    def save_debug(self, img: np.ndarray, path: str) -> None:
        cv2.imwrite(path, img)


# ---------------------------------------------------------------------------
# OCR engine wrappers
# ---------------------------------------------------------------------------

class OCREngine:
    """Abstract base — subclass for EasyOCR or Tesseract."""

    def read(self, image: np.ndarray) -> str:
        raise NotImplementedError


class EasyOCREngine(OCREngine):
    def __init__(self, languages: list[str] = None):
        import easyocr  # lazy import — expensive to load once
        self._reader = easyocr.Reader(languages or ["en"], gpu=False, verbose=False)
        logger.info("EasyOCR engine loaded (languages=%s)", languages)

    def read(self, image: np.ndarray) -> str:
        results = self._reader.readtext(image, detail=0, paragraph=True)
        return " ".join(results).strip()


class TesseractEngine(OCREngine):
    def __init__(self):
        import pytesseract
        self._tess = pytesseract
        # Single-line, digits + alpha + punctuation
        self._config = "--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 :,.-+!@#"
        logger.info("Tesseract engine loaded")

    def read(self, image: np.ndarray) -> str:
        return self._tess.image_to_string(image, config=self._config).strip()


def build_ocr_engine(cfg: dict) -> OCREngine:
    engine_name = cfg.get("engine", "easyocr").lower()
    langs = cfg.get("languages", ["en"])
    if engine_name == "easyocr":
        return EasyOCREngine(langs)
    elif engine_name == "tesseract":
        return TesseractEngine()
    else:
        raise ValueError(f"Unknown OCR engine: {engine_name!r}")


# ---------------------------------------------------------------------------
# Tip popup parser
# ---------------------------------------------------------------------------

class TipPopupParser:
    """
    Parses raw OCR text from the CB tip popup into a structured TipEvent.

    CB popup text examples:
      "EliteKing tipped 150 tokens: for you 🔥"
      "GoldenLion tipped 80 tokens"
      "Anonymous tipped 25 tokens"
      "SilverFox 420 tokens"           ← simplified format seen on some CB builds
    """

    def __init__(self, patterns: dict, platform: str = "chaturbate"):
        self._platform = platform
        self._patterns = {
            name: re.compile(pat, re.IGNORECASE)
            for name, pat in patterns.items()
        }

    def parse(self, raw: str) -> Optional[TipEvent]:
        if not raw or len(raw) < 4:
            return None

        # Try each pattern in preference order
        for name, rx in self._patterns.items():
            m = rx.match(raw.strip())
            if not m:
                continue

            groups = m.groups()
            username = groups[0].strip()
            try:
                amount = int(groups[1].replace(",", "").replace(".", ""))
            except (ValueError, IndexError):
                continue

            message = groups[2].strip() if len(groups) > 2 and groups[2] else ""
            is_anon = username.lower() in ("anonymous", "someone", "anon")

            logger.debug("Parsed tip via pattern %r: %s +%d", name, username, amount)
            return TipEvent(
                username=username,
                amount=amount,
                message=message,
                platform=self._platform,
                is_anon=is_anon,
                raw_text=raw,
                source="ocr_popup",
            )

        logger.debug("No popup pattern matched for: %r", raw)
        return None


# ---------------------------------------------------------------------------
# Balance reader (for delta-based fallback tip detection)
# ---------------------------------------------------------------------------

_DIGIT_STRIP = re.compile(r"[^\d]")

def parse_balance(raw: str) -> Optional[int]:
    """Extract a plain integer token count from OCR text like '1,250 tokens'."""
    digits = _DIGIT_STRIP.sub("", raw)
    if not digits:
        return None
    val = int(digits)
    # Sanity check: CB balances are typically 0–9,999,999
    return val if 0 <= val <= 9_999_999 else None


# ---------------------------------------------------------------------------
# Screen capturer
# ---------------------------------------------------------------------------

class ScreenCapturer:
    """
    Wraps mss to take fast partial-screen screenshots of one or more zones.
    Caches the monitor offset so we don't recalculate on every frame.
    """

    def __init__(self, monitor_index: int = 1):
        self._mon_index = monitor_index
        self._sct = mss.mss()
        self._monitor = self._sct.monitors[monitor_index]
        logger.info(
            "Screen capturer ready — monitor %d: %dx%d at (%d,%d)",
            monitor_index,
            self._monitor["width"], self._monitor["height"],
            self._monitor["left"],  self._monitor["top"],
        )

    def capture_zone(self, zone: Zone) -> np.ndarray:
        """Returns a BGRA numpy array for the given Zone."""
        region = zone.as_mss_region(self._monitor)
        screenshot = self._sct.grab(region)
        return np.array(screenshot)  # BGRA, dtype uint8

    def list_monitors(self) -> list[dict]:
        return self._sct.monitors
