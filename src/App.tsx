import { useEffect, useState, useRef } from 'react';
import { Crown, Unlock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { SideNav } from './components/SideNav';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { SpotlightPanel } from './components/SpotlightPanel';
import { UnlockPathPanel } from './components/UnlockPathPanel';
import { RulesPanel } from './components/RulesPanel';
import { MissionPanel } from './components/MissionPanel';
import { LiveActionPanel } from './components/LiveActionPanel';
import { ToastNotification } from './components/ToastNotification';
import { RotatingCubePanel } from './components/RotatingCubePanel';

const DEMO_PAYLOAD = {
  model: {
    stageName: "Carmen's Room",
    showTime: "Live for 2h 15m",
    languages: ["en", "es"]
  },
  room: {
    viewerCount: 1240,
    heat: {
      state: "hot",
      score: 85.5
    }
  },
  ui: {
    cycle: {
      faceSeconds: 8,
      faces: ["leaderboard", "spotlight", "mission", "rules"]
    }
  },
  leaderboard: {
    topFans: [
      { userId: "1", rank: 1, username: "BigSpender99", value: 5000, tier: "diamond", isWhale: true },
      { userId: "2", rank: 2, username: "CoolGuy22", value: 2500, tier: "gold", isWhale: false },
      { userId: "3", rank: 3, username: "Lurker101", value: 1000, tier: "silver", isWhale: false },
      { userId: "4", rank: 4, username: "FanBoy", value: 500, tier: "bronze", isWhale: false },
      { userId: "5", rank: 5, username: "Newbie", value: 100, tier: "bronze", isWhale: false }
    ]
  },
  events: {
    latestTip: {
      eventId: "evt_1",
      username: "BigSpender99",
      amount: 1000,
      message: "You look amazing today!"
    },
    recentContributors: [
      { username: "BigSpender99", amount: 1000 },
      { username: "CoolGuy22", amount: 500 },
      { username: "Lurker101", amount: 100 }
    ]
  },
  mission: {
    title: "New Outfit Goal",
    label: "Help me reach the goal!",
    progressPct: 65,
    current: 6500,
    target: 10000,
    phase: "BUILDING"
  },
  unlockLadder: {
    steps: [
      { label: "Stand Up", tokens: 1000, state: "unlocked" },
      { label: "Dance", tokens: 5000, state: "just_unlocked" },
      { label: "Special Request", tokens: 10000, state: "locked" }
    ]
  }
};

export default function App() {
  const [payload, setPayload] = useState<any>(null);
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [activeFaceIndex, setActiveFaceIndex] = useState(0);
  const [isDebug, setIsDebug] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const hasCelebrated = useRef(false);

  // Handle confetti celebration
  useEffect(() => {
    if (payload?.mission?.progressPct >= 100 && !hasCelebrated.current) {
      hasCelebrated.current = true;
      
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    } else if (payload?.mission?.progressPct < 100) {
      hasCelebrated.current = false;
    }
  }, [payload?.mission?.progressPct]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDemo = params.get('demo') === '1';
    const isDebugMode = params.get('debug') === '1';
    const wsUrlParam = params.get('ws');

    setIsDebug(isDebugMode);

    if (isDemo) {
      setPayload(DEMO_PAYLOAD);
      
      // Simulate incoming tips in demo mode
      const interval = setInterval(() => {
        setPayload((prev: any) => {
          if (!prev) return prev;
          const newAmount = Math.floor(Math.random() * 500) + 50;
          const newTip = {
            eventId: `evt_${Date.now()}`,
            username: `User${Math.floor(Math.random() * 1000)}`,
            amount: newAmount,
            message: "Random demo tip!"
          };
          
          setPulse(true);
          setToast(newTip);
          setTimeout(() => setPulse(false), 1000);
          setTimeout(() => setToast(null), 4000);
          
          return {
            ...prev,
            events: {
              ...prev.events,
              latestTip: newTip,
              recentContributors: [newTip, ...prev.events.recentContributors].slice(0, 3)
            },
            room: {
              ...prev.room,
              viewerCount: prev.room.viewerCount + Math.floor(Math.random() * 10) - 2
            }
          };
        });
      }, 15000); // New tip every 15 seconds
      
      return () => clearInterval(interval);
    }

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultWsUrl = `${protocol}//${window.location.host}`;
      const wsUrl = wsUrlParam || defaultWsUrl;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'STATE_UPDATE') {
            setPayload(data.payload);
          } else if (data.type === 'NEW_TIP') {
            setPulse(true);
            setToast(data.tip);
            setTimeout(() => setPulse(false), 1000);
            setTimeout(() => setToast(null), 4000);
          } else {
            // Fallback for legacy payload format
            setPayload((prevPayload: any) => {
              // Check if there's a new tip to trigger pulse and toast
              if (prevPayload && data.events?.latestTip && data.events.latestTip.eventId !== prevPayload.events?.latestTip?.eventId) {
                setPulse(true);
                setToast(data.events.latestTip);
                setTimeout(() => setPulse(false), 1000);
                setTimeout(() => setToast(null), 4000);
              }
              return data;
            });
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = () => {
        setTimeout(connect, 2000);
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  // Handle auto-rotation
  useEffect(() => {
    if (!payload) return;
    const faceSeconds = payload.ui?.cycle?.faceSeconds || 10;
    const facesCount = payload.ui?.cycle?.faces?.length || 4;
    
    const interval = setInterval(() => {
      setActiveFaceIndex(prev => (prev + 1) % facesCount);
    }, faceSeconds * 1000);
    
    return () => clearInterval(interval);
  }, [payload?.ui?.cycle?.faceSeconds, payload?.ui?.cycle?.faces?.length]);

  // Parallax effect
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20; // -10 to 10 deg
      const y = (e.clientY / window.innerHeight - 0.5) * -20;
      setParallax({ x: y, y: x });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: any[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.1
      });
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 210, 122, ${p.alpha})`;
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [payload]); 

  if (!payload) return null;

 
  const yRotations = [0, -90, -180, 90];
  const currentYRot = yRotations[activeFaceIndex] || 0;

  const heatClass = payload.room?.heat?.state === 'hot' ? 'heat-hot' : 
                    payload.room?.heat?.state === 'inferno' ? 'heat-inferno' : 'heat-warm';
                    
  const diamondClass = payload.leaderboard?.topFans?.some((f: any) => f.tier === 'diamond') ? 'diamond' : '';

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-surface text-on-surface font-body selection:bg-primary/20 selection:text-primary ${pulse ? 'pulse' : ''} ${heatClass} ${diamondClass}`}>
      <canvas ref={canvasRef} id="particles" className="absolute inset-0 z-0 pointer-events-none"></canvas>
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Deep navy base */}
          <div className="absolute inset-0 bg-[#0d0d1c]"></div>
          
          {/* Animated heat glows */}
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] heat-glow opacity-60 mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]"></div>
          <div className="absolute top-[40%] -right-[20%] w-[80%] h-[80%] heat-glow opacity-40 mix-blend-screen animate-[pulse_12s_ease-in-out_infinite_reverse]"></div>
          <div className="absolute -bottom-[30%] left-[10%] w-[60%] h-[60%] heat-glow opacity-50 mix-blend-screen animate-[pulse_10s_ease-in-out_infinite]"></div>
          
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTM5IDM5VjFoLTM4djM4aDM4eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-30 mix-blend-overlay"></div>
      </div>

      <Header payload={payload} />

      <SideNav activeFaceIndex={activeFaceIndex} setActiveFaceIndex={setActiveFaceIndex} />

      <main className="relative z-10 w-full h-screen flex flex-col lg:flex-row items-center justify-center p-4 sm:p-8 lg:p-20 pt-24 pointer-events-none overflow-y-auto lg:overflow-hidden">
          
          {/* Central Layout Container */}
          <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 pointer-events-auto h-auto lg:h-[70vh]">
              
              {/* Left Panel: 3D Rotating Cube */}
              <div className="w-full lg:flex-1 h-[400px] sm:h-[500px] lg:h-full shrink-0">
                <RotatingCubePanel activeFaceIndex={activeFaceIndex} payload={payload} />
              </div>

              {/* Right Panel: Dynamic Content (Mission / Spotlight) */}
              <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 pb-24 lg:pb-0">
                  
                  {/* Active Mission */}
                  <MissionPanel payload={payload} />

                  {/* Latest Action / Spotlight */}
                  <LiveActionPanel payload={payload} />

              </div>
          </div>
      </main>

      {/* Bottom Toast Notifications */}
      <ToastNotification toast={toast} />

      {isDebug && <OcrDebugger />}
    </div>
  );
}

function OcrDebugger() {
  const [balance, setBalance] = useState(1000);
  const [popupUsername, setPopupUsername] = useState('TestUser');
  const [popupAmount, setPopupAmount] = useState(100);
  
  const sendBalance = async () => {
    await fetch('/api/ocr-tick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance })
    });
  };

  const sendPopup = async () => {
    await fetch('/api/ocr-tick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        popup: { username: popupUsername, amount: popupAmount, message: 'Test tip!' }
      })
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#111', padding: 20, borderRadius: 8, border: '1px solid #333', color: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>OCR Debugger</h3>
      
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="number" value={balance} onChange={e => setBalance(Number(e.target.value))} style={{ width: 80, background: '#222', color: '#fff', border: '1px solid #444', padding: 4 }} />
        <button onClick={sendBalance} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Send Balance</button>
      </div>
      
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="text" value={popupUsername} onChange={e => setPopupUsername(e.target.value)} style={{ width: 80, background: '#222', color: '#fff', border: '1px solid #444', padding: 4 }} />
        <input type="number" value={popupAmount} onChange={e => setPopupAmount(Number(e.target.value))} style={{ width: 60, background: '#222', color: '#fff', border: '1px solid #444', padding: 4 }} />
        <button onClick={sendPopup} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Send Popup</button>
      </div>
      
      <div style={{ fontSize: 12, color: '#888', maxWidth: 250 }}>
        To test reconstruction: Send a popup, then send a balance that is higher by the popup amount.
      </div>
    </div>
  );
}
