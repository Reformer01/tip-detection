"""
main.py — LBC OCR Agent entry point.

Orchestrates:
  1. Config loading & validation
  2. Screen capturer + OCR engine initialisation
  3. Tight capture loop (balance zone + popup zone)
  4. Delta-based tip reconstruction (self-healing fallback)
  5. HTTP dispatch to the backend event server
  6. CLI calibration helper

Run modes
---------
  python main.py              → start the agent (demo mode if backend is down)
  python main.py --calibrate  → interactive zone calibration tool
  python main.py --test-ocr   → single-frame OCR test, prints result and exits
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Optional

import requests
from requests.adapters import HTTPAdapter, Retry

from vision import (
    BalanceReading,
    EasyOCREngine,
    ImagePreprocessor,
    ScreenCapturer,
    TipEvent,
    TipPopupParser,
    Zone,
    build_ocr_engine,
    parse_balance,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("agent")

# ---------------------------------------------------------------------------
# Config loader
# ---------------------------------------------------------------------------

CONFIG_PATH = Path(__file__).parent / "config.json"


def load_config(path: Path = CONFIG_PATH) -> dict:
    if not path.exists():
        logger.error("config.json not found at %s", path)
        sys.exit(1)
    with open(path) as f:
        cfg = json.load(f)
    logger.info("Config loaded from %s", path)
    return cfg


def zones_from_config(cfg: dict) -> dict[str, Zone]:
    zones = {}
    for name, z in cfg.get("zones", {}).items():
        if z.get("enabled", True):
            zones[name] = Zone(
                label=z.get("label", name),
                x=z["x"], y=z["y"],
                w=z["w"], h=z["h"],
            )
    return zones


# ---------------------------------------------------------------------------
# HTTP dispatcher (with retry)
# ---------------------------------------------------------------------------

def build_session(cfg: dict) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=cfg["backend"].get("retry_attempts", 3),
        backoff_factor=0.4,
        status_forcelist=[500, 502, 503, 504],
    )
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def dispatch_tip(event: TipEvent, cfg: dict, session: requests.Session) -> bool:
    """POST the tip event to the backend. Returns True on success."""
    endpoint = cfg["backend"]["event_endpoint"]
    timeout  = cfg["backend"].get("timeout_s", 2)
    payload  = event.to_dict()
    try:
        r = session.post(endpoint, json=payload, timeout=timeout)
        r.raise_for_status()
        logger.info("✅ Dispatched tip — %s +%d tokens [%s]",
                    event.username, event.amount, event.source)
        return True
    except requests.exceptions.ConnectionError:
        logger.warning("⚠️  Backend unreachable — tip queued locally: %s +%d",
                       event.username, event.amount)
    except requests.exceptions.HTTPError as e:
        logger.error("Backend HTTP error: %s", e)
    except Exception as e:
        logger.error("Dispatch error: %s", e)
    return False


def check_backend_health(cfg: dict, session: requests.Session) -> bool:
    try:
        r = session.get(
            cfg["backend"]["health_endpoint"],
            timeout=cfg["backend"].get("timeout_s", 2)
        )
        return r.status_code == 200
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Delta-based tip reconstruction (self-healing fallback)
# ---------------------------------------------------------------------------

class BalanceDeltaDetector:
    """
    Watches the token balance zone frame-by-frame.
    If the balance jumps UP by more than `min_delta` tokens and there was
    no corresponding popup-parsed event, synthesises an anonymous tip event.

    This handles the case where a popup fades before OCR can read it.
    """

    MIN_DELTA = 1        # ignore jitter below this
    MAX_DELTA = 50_000   # reject obviously bogus readings

    def __init__(self, platform: str = "chaturbate"):
        self._last: Optional[BalanceReading] = None
        self._platform = platform

    def update(self, reading: BalanceReading, popup_event_this_frame: bool) -> Optional[TipEvent]:
        """
        Call once per frame with the latest balance reading.
        Returns a synthetic TipEvent if a delta is detected and no popup fired.
        """
        if self._last is None:
            self._last = reading
            return None

        delta = reading.tokens - self._last.tokens
        self._last = reading

        if delta < self.MIN_DELTA or delta > self.MAX_DELTA:
            return None

        if popup_event_this_frame:
            # Popup parser already handled this tip — don't double-count
            return None

        logger.info("🔍 Balance delta detected: +%d tokens (no popup captured — synthesising)", delta)
        return TipEvent(
            username="Anonymous",
            amount=delta,
            message="",
            platform=self._platform,
            is_anon=True,
            source="balance_delta",
            raw_text=f"delta:{delta}",
        )

    def reset(self) -> None:
        self._last = None


# ---------------------------------------------------------------------------
# Debug frame saver
# ---------------------------------------------------------------------------

def maybe_save_frame(img, zone_label: str, cfg: dict) -> None:
    if not cfg["debug"].get("save_frames"):
        return
    import cv2
    frames_dir = Path(cfg["debug"].get("frames_dir", "./debug_frames"))
    frames_dir.mkdir(parents=True, exist_ok=True)
    ts = int(time.time() * 1000)
    path = frames_dir / f"{zone_label}_{ts}.png"
    cv2.imwrite(str(path), img)


# ---------------------------------------------------------------------------
# Main capture loop
# ---------------------------------------------------------------------------

class OCRAgent:
    def __init__(self, cfg: dict):
        self.cfg       = cfg
        self.zones     = zones_from_config(cfg)
        self.capturer  = ScreenCapturer(cfg["capture"].get("monitor_index", 1))
        self.pre       = ImagePreprocessor(
            upscale=cfg["ocr"].get("upscale_factor", 3),
            threshold=cfg["ocr"].get("threshold_value", 145),
            denoise=cfg["ocr"].get("denoise", True),
        )
        self.ocr       = build_ocr_engine(cfg["ocr"])
        self.parser    = TipPopupParser(
            patterns=cfg.get("popup_patterns", {}),
            platform=cfg["backend"].get("platform", "chaturbate"),
        )
        self.delta_det = BalanceDeltaDetector(
            platform=cfg["backend"].get("platform", "chaturbate")
        )
        self.session   = build_session(cfg)
        self._fps      = cfg["capture"].get("fps", 4)
        self._frame_s  = 1.0 / self._fps
        # Dedupe: track the last popup hash so we don't fire the same popup twice
        self._last_popup_hash: Optional[str] = None
        self._popup_ttl = cfg["capture"].get("tip_popup_ttl_ms", 8000) / 1000

    # ------------------------------------------------------------------

    def run(self) -> None:
        logger.info("=" * 60)
        logger.info("LBC OCR Agent starting — %d fps, zones: %s",
                    self._fps, list(self.zones.keys()))
        logger.info("=" * 60)

        if not check_backend_health(self.cfg, self.session):
            logger.warning("Backend not reachable — running in local-log mode")

        while True:
            loop_start = time.monotonic()
            self._tick()
            elapsed = time.monotonic() - loop_start
            sleep_for = max(0.0, self._frame_s - elapsed)
            time.sleep(sleep_for)

    # ------------------------------------------------------------------

    def _tick(self) -> None:
        popup_fired_this_frame = False

        # 1. Read tip popup zone
        popup_zone = self.zones.get("tip_popup")
        if popup_zone:
            raw_frame = self.capturer.capture_zone(popup_zone)
            clean     = self.pre.process(raw_frame)
            maybe_save_frame(clean, "popup", self.cfg)
            text = self.ocr.read(clean)

            if text:
                logger.debug("Popup OCR raw: %r", text)
                popup_hash = text.strip().lower()

                # Only process if this is a NEW popup text
                if popup_hash != self._last_popup_hash:
                    self._last_popup_hash = popup_hash
                    event = self.parser.parse(text)
                    if event:
                        popup_fired_this_frame = True
                        dispatch_tip(event, self.cfg, self.session)
                    else:
                        logger.debug("Popup text didn't match any tip pattern: %r", text)
            else:
                # Popup cleared — reset hash so next tip can fire
                self._last_popup_hash = None

        # 2. Read balance zone
        balance_zone = self.zones.get("token_balance")
        if balance_zone:
            raw_frame = self.capturer.capture_zone(balance_zone)
            clean     = self.pre.process(raw_frame)
            maybe_save_frame(clean, "balance", self.cfg)
            text = self.ocr.read(clean)

            if text:
                logger.debug("Balance OCR raw: %r", text)
                tokens = parse_balance(text)
                if tokens is not None:
                    reading = BalanceReading(tokens=tokens, raw_text=text)
                    fallback = self.delta_det.update(reading, popup_fired_this_frame)
                    if fallback:
                        dispatch_tip(fallback, self.cfg, self.session)

        # 3. (optional) viewer count — logged only, no event
        viewer_zone = self.zones.get("viewer_count")
        if viewer_zone:
            raw_frame = self.capturer.capture_zone(viewer_zone)
            clean     = self.pre.process(raw_frame)
            text = self.ocr.read(clean)
            if text:
                logger.debug("Viewers OCR raw: %r", text)


# ---------------------------------------------------------------------------
# CLI: Calibration helper
# ---------------------------------------------------------------------------

def run_calibration(cfg: dict) -> None:
    """
    Interactive calibration tool.
    Displays each zone's captured + processed frame in a window
    so you can verify coordinates visually before going live.
    """
    import cv2

    capturer = ScreenCapturer(cfg["capture"].get("monitor_index", 1))
    pre      = ImagePreprocessor(
        upscale=cfg["ocr"].get("upscale_factor", 3),
        threshold=cfg["ocr"].get("threshold_value", 145),
        denoise=cfg["ocr"].get("denoise", True),
    )
    ocr = build_ocr_engine(cfg["ocr"])
    zones = zones_from_config(cfg)

    print("\n=== CALIBRATION MODE ===")
    print("Each zone will show a preview window.")
    print("Press any key to advance to the next zone.")
    print("Adjust x/y/w/h in config.json until the text you want is cleanly captured.\n")

    for name, zone in zones.items():
        print(f"  Zone: [{name}]  ({zone.x},{zone.y}) {zone.w}x{zone.h}")
        raw   = capturer.capture_zone(zone)
        clean = pre.process(raw)
        text  = ocr.read(clean)
        print(f"  OCR result: {text!r}\n")
        cv2.imshow(f"RAW  [{name}]", raw)
        cv2.imshow(f"CLEAN [{name}]", clean)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    print("Calibration complete. Update config.json with final coordinates.")


# ---------------------------------------------------------------------------
# CLI: Single-frame test
# ---------------------------------------------------------------------------

def run_test_ocr(cfg: dict) -> None:
    capturer = ScreenCapturer(cfg["capture"].get("monitor_index", 1))
    pre      = ImagePreprocessor(
        upscale=cfg["ocr"].get("upscale_factor", 3),
        threshold=cfg["ocr"].get("threshold_value", 145),
        denoise=cfg["ocr"].get("denoise", True),
    )
    ocr    = build_ocr_engine(cfg["ocr"])
    parser = TipPopupParser(
        patterns=cfg.get("popup_patterns", {}),
        platform=cfg["backend"].get("platform", "chaturbate"),
    )
    zones = zones_from_config(cfg)

    print("\n=== SINGLE-FRAME OCR TEST ===\n")
    for name, zone in zones.items():
        raw   = capturer.capture_zone(zone)
        clean = pre.process(raw)
        text  = ocr.read(clean)
        print(f"Zone [{name}]:")
        print(f"  Raw OCR:  {text!r}")
        if name == "tip_popup":
            event = parser.parse(text)
            print(f"  Parsed:   {event}")
        elif name == "token_balance":
            tokens = parse_balance(text)
            print(f"  Balance:  {tokens} tokens")
        print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description="LBC OCR Agent")
    ap.add_argument("--config", default=str(CONFIG_PATH), help="Path to config.json")
    ap.add_argument("--calibrate", action="store_true", help="Run interactive zone calibration")
    ap.add_argument("--test-ocr",  action="store_true", help="Run single-frame OCR test and exit")
    ap.add_argument("--monitor",   type=int, default=None, help="Override monitor index")
    ap.add_argument("--fps",       type=int, default=None, help="Override capture FPS")
    ap.add_argument("--debug",     action="store_true", help="Set log level to DEBUG")
    args = ap.parse_args()

    cfg = load_config(Path(args.config))

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        cfg["debug"]["log_level"] = "DEBUG"

    if args.monitor is not None:
        cfg["capture"]["monitor_index"] = args.monitor
    if args.fps is not None:
        cfg["capture"]["fps"] = args.fps

    if args.calibrate:
        run_calibration(cfg)
        return

    if args.test_ocr:
        run_test_ocr(cfg)
        return

    agent = OCRAgent(cfg)
    try:
        agent.run()
    except KeyboardInterrupt:
        logger.info("Agent stopped by user.")


if __name__ == "__main__":
    main()
