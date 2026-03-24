import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint for the OCR agent
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // State Management
  let currentBalance = 0;
  let prevTotalsByUser = new Map<string, number>();
  
  // Tip Reconstruction State
  let pendingPopups: Array<{ username: string, amount?: number, message?: string, ts: number }> = [];
  let pendingDeltas: Array<{ amount: number, ts: number }> = [];
  
  // Base payload structure
  let payload = {
    "schema": "lbc.overlay.leaderboard.v1",
    "ts": new Date().toISOString(),
    "source": {
      "platform": "chaturbate",
      "roomId": "carmenruiz",
      "streamId": "cb_9b7f1e",
      "adapter": "cb_websocket_v3",
      "region": "us-east-1"
    },
    "model": {
      "id": "lbc_model_001",
      "stageName": "Carmen Ruiz",
      "accentColor": "#d4af37",
      "showTime": "1:00 PM – 4:00 PM",
      "status": "active",
      "languages": ["en", "es", "fr"],
      "currency": { "unit": "tokens", "tokenName": "tokens", "tokenToUsd": 0.05 }
    },
    "room": {
      "viewerCount": 214,
      "uniqueViewersSession": 1820,
      "followers": 9201,
      "likes": 120,
      "chatRatePerMin": 46,
      "tipRatePerMin": 7,
      "avgTip": 38,
      "topTipLast10m": 250,
      "urgencyScore": 0.62,
      "heat": {
        "state": "hot",
        "score": 0.74,
        "trend": "rising",
        "reason": ["tip_spike", "viewer_growth", "chat_surge"]
      }
    },
    "leaderboard": {
      "metric": "session_tokens",
      "window": "session",
      "updatedMs": 1000,
      "topFans": []
    },
    "events": {
      "latestTip": null,
      "recentContributors": []
    },
    "mission": {
      "goalId": "goal_001",
      "state": "ACTIVE_GOAL",
      "type": "unlock_show",
      "title": "🔥 NEXT SHOW UNLOCK",
      "label": "Foot Fetish Show",
      "current": 0,
      "target": 1000,
      "progressPct": 0,
      "phase": "BUILDING_MOMENTUM",
      "finalPushThresholdPct": 88,
      "whaleOverride": {
        "enabled": true,
        "active": false,
        "minWhaleAmount": 250,
        "whaleUserId": "",
        "message": "👑 VIP MOMENT ACTIVE — next tip decides bonus reward"
      }
    },
    "unlockLadder": {
      "metric": "mission_tokens",
      "steps": [
        { "tokens": 250, "label": "Warmup Tease", "state": "locked" },
        { "tokens": 500, "label": "Oil Tease", "state": "locked" },
        { "tokens": 750, "label": "Foot Fetish Show", "state": "locked" },
        { "tokens": 1000, "label": "Private Bonus", "state": "locked" }
      ],
      "justUnlocked": {
        "active": false,
        "label": "",
        "icon": "unlock"
      }
    },
    "ui": {
      "cycle": {
        "faceSeconds": 30,
        "langSeconds": 10,
        "faces": ["leaderboard", "spotlight", "unlock_path", "rules"]
      },
      "scroll": {
        "enabled": true,
        "mode": "active_face_pingpong",
        "speed": 0.18,
        "pauseAfterUserMs": 3000,
        "edgePauseMs": 1200
      },
      "effects": {
        "pulseOnTip": true,
        "flashRowOnTip": true,
        "toastOnTip": true,
        "diamondGlowThreshold": 1000
      }
    },
    "debug": { "pollMs": 1000, "notes": "Unified overlay payload for any platform adapter" }
  };

  // Broadcast to all clients
  function broadcast() {
    payload.ts = new Date().toISOString();
    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Handle new WebSocket connections
  wss.on('connection', (ws) => {
    // Send initial payload
    ws.send(JSON.stringify(payload));
  });

  // API Endpoint for OCR Agent Config
  app.get('/api/ocr-config', (req, res) => {
    res.json({
      platform: "chaturbate",
      captureRegions: {
        balance: { x: 100, y: 50, width: 200, height: 40 },
        popup: { x: 800, y: 600, width: 400, height: 150 }
      },
      parsingRules: {
        balanceRegex: "^(?:\\s*\\d{1,3}(?:,\\d{3})*|\\d+)\\s*tokens?$",
        popupRegex: "^(?<username>[a-zA-Z0-9_]+)\\s+tipped\\s+(?<amount>\\d+)\\s*tokens?(?:\\s*:\\s*(?<message>.*))?$"
      },
      pollIntervalMs: 500
    });
  });

  // API Endpoint for OCR Agent
  app.post('/api/ocr-tick', (req, res) => {
    const { balance, popup, type, amount, username, message, eventId, ts, platform, isAnon, source } = req.body;
    
    // Legacy direct tip support
    if (type === 'tip' && amount > 0) {
      processTip(username || 'Anonymous', amount, message || 'Tip received!', platform, source, eventId, ts);
      return res.json({ success: true, tipDetected: true, tipAmount: amount, tipper: username || 'Anonymous' });
    }

    let tipOccurred = false;
    let tipAmount = 0;
    let tipUser = 'Anonymous';

    // 1. Check if we received a popup
    if (popup) {
      tipOccurred = true;
      tipAmount = popup.amount;
      tipUser = popup.username;
    } 
    // 2. Or if we just received a balance increase without a popup
    else if (balance !== undefined && balance > currentBalance) {
      tipOccurred = true;
      tipAmount = balance - currentBalance;
    }

    // Update current balance
    if (balance !== undefined) {
      currentBalance = balance;
    }

    if (tipOccurred) {
      processTip(tipUser, tipAmount, popup?.message || 'Thanks for the tip!', platform || 'chaturbate', 'ocr');
    }

    res.json({ success: true, currentBalance, tipOccurred });
  });

  function processTip(tipper: string, tipAmount: number, message: string, platform: string = "chaturbate", source: string = "unknown", eventId?: string, ts?: string) {
    // Update leaderboard
    let userTotal = prevTotalsByUser.get(tipper) || 0;
    userTotal += tipAmount;
    prevTotalsByUser.set(tipper, userTotal);

    // Rebuild topFans
    const topFans = Array.from(prevTotalsByUser.entries()).map(([uName, value]) => ({
      userId: `u_${uName}`,
      username: uName,
      displayName: uName,
      rank: 0,
      value,
      tier: value >= 1000 ? "diamond" : value >= 500 ? "gold" : "silver",
      badges: [],
      isWhale: tipAmount >= 250,
      lastTipTs: new Date().toISOString(),
      lastTipAmount: tipAmount,
      deltaSinceLastPoll: tipAmount,
      platform: { platform: platform || "chaturbate", userRef: uName }
    })).sort((a, b) => b.value - a.value);

    topFans.forEach((fan, idx) => fan.rank = idx + 1);
    payload.leaderboard.topFans = topFans as any;

    // Update events
    const tipEvent = {
      eventId: eventId || `evt_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      ts: ts || new Date().toISOString(),
      type: "tip",
      platform: platform || "chaturbate",
      userId: `u_${tipper}`,
      username: tipper,
      amount: tipAmount,
      currency: "tokens",
      message: message || "Tip received!",
      isAnon: tipper === 'Anonymous',
      meta: { rawEventType: "tip", txRef: "", device: "unknown", ipHash: "", source: source || "unknown" }
    };
    
    payload.events.latestTip = tipEvent as any;
    payload.events.recentContributors.unshift({
      ts: tipEvent.ts,
      username: tipper,
      amount: tipAmount,
      platform: platform || "chaturbate"
    } as any);
    if (payload.events.recentContributors.length > 5) {
      payload.events.recentContributors.pop();
    }

    // Update mission
    payload.mission.current += tipAmount;
    payload.mission.progressPct = Math.min(100, Math.round((payload.mission.current / payload.mission.target) * 100));

    // Update unlock ladder
    let justUnlocked = null;
    payload.unlockLadder.steps.forEach((step: any) => {
      if (payload.mission.current >= step.tokens && step.state === "locked") {
        step.state = "just_unlocked";
        justUnlocked = step;
      } else if (payload.mission.current >= step.tokens && step.state === "just_unlocked") {
        step.state = "complete";
      }
    });

    if (justUnlocked) {
      payload.unlockLadder.justUnlocked = {
        active: true,
        label: `Goal ${(justUnlocked as any).label} unlocked`,
        icon: "unlock"
      };
    } else {
      payload.unlockLadder.justUnlocked.active = false;
    }

    broadcast();
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
