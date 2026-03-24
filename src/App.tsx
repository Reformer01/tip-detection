import { useEffect, useState, useRef } from 'react';
import { Crown, Unlock } from 'lucide-react';
import confetti from 'canvas-confetti';

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
    const wsUrlParam = params.get('ws');

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
  }, [payload]); // Re-run when payload changes (i.e. when canvas is mounted)

  if (!payload) return null;

  // Calculate rotation based on active face
  // 0: front (0deg), 1: right (-90deg), 2: back (-180deg), 3: left (90deg)
  const yRotations = [0, -90, -180, 90];
  const currentYRot = yRotations[activeFaceIndex] || 0;

  const heatClass = payload.room?.heat?.state === 'hot' ? 'heat-hot' : 
                    payload.room?.heat?.state === 'inferno' ? 'heat-inferno' : 'heat-warm';
                    
  const diamondClass = payload.leaderboard?.topFans?.some((f: any) => f.tier === 'diamond') ? 'diamond' : '';

  return (
    <div className={`stage ${pulse ? 'pulse' : ''} ${heatClass} ${diamondClass}`}>
      <canvas ref={canvasRef} id="particles"></canvas>
      
      {/* HUD Top */}
      <div className="hudTop">
        <div className="brand">
          <img src="https://picsum.photos/seed/carmen/100/100" alt="Avatar" referrerPolicy="no-referrer" />
          <div>
            <div className="hTitle">{payload.model?.stageName || 'Model'}</div>
            <div className="hSub">{payload.model?.showTime || 'Live Now'}</div>
          </div>
        </div>
        <div className="langs">
          {payload.model?.languages?.map((l: string, i: number) => (
            <div key={l} className={`lang ${i === 0 ? 'active' : ''}`}>{l.toUpperCase()}</div>
          ))}
        </div>
        <div className="stats" style={{ display: 'flex', gap: '15px' }}>
          <div className="line"><span className="lbl">Viewers</span><span className="big">{payload.room?.viewerCount || 0}</span></div>
          <div className="line"><span className="lbl">Heat</span><span className="big">{payload.room?.heat?.score?.toFixed(2) || '0.00'}</span></div>
        </div>
      </div>

      <div className="groundGlow"></div>

      <div className="float">
        <div className="scene">
          <div 
            className="rig" 
            style={{ 
              '--camX': '-10deg', 
              '--camY': `${currentYRot}deg`,
              '--parX': `${parallax.x}deg`,
              '--parY': `${parallax.y}deg`
            } as any}
          >
            <div className="cube">
              {/* Leaderboard (Front) */}
              <div className={`face front ${activeFaceIndex === 0 ? 'active' : ''}`}>
                <div className="faceBase"></div>
                <div className="sweep"></div>
                <div className="pad">
                  <div className="title">Top Fans</div>
                  <div className="rows">
                    {payload.leaderboard?.topFans?.slice(0, 5).map((fan: any, i: number) => (
                      <div key={fan.userId} className={`row tier-${fan.tier} ${i === 0 ? 'latest' : ''}`}>
                        <div className="rank">{fan.rank}</div>
                        <div className="name">{fan.username}</div>
                        <div className="val">{fan.value}</div>
                        {fan.isWhale && <div className="crown"><Crown size={12} /></div>}
                      </div>
                    ))}
                    {(!payload.leaderboard?.topFans || payload.leaderboard.topFans.length === 0) && (
                      <div className="sub" style={{ textAlign: 'center', marginTop: '20px' }}>No tips yet. Be the first!</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Spotlight (Right) */}
              <div className={`face right ${activeFaceIndex === 1 ? 'active' : ''}`}>
                <div className="faceBase"></div>
                <div className="sweep"></div>
                <div className="pad">
                  <div className="title">Spotlight</div>
                  {payload.events?.latestTip ? (
                    <div className="spot">
                      <div className="spotTop">
                        <div className="badgeTier gold">LATEST TIP</div>
                      </div>
                      <div className="spotName">{payload.events.latestTip.username}</div>
                      <div className="spotMeta">
                        <span>Tipped <b>{payload.events.latestTip.amount}</b> tokens</span>
                      </div>
                      <div className="spotMsg">"{payload.events.latestTip.message || 'Thanks for the tip!'}"</div>
                    </div>
                  ) : (
                    <div className="sub" style={{ textAlign: 'center', marginTop: '20px' }}>Waiting for a tip...</div>
                  )}
                  
                  <div className="title" style={{ marginTop: '15px' }}>Recent</div>
                  <div className="pushList">
                    {payload.events?.recentContributors?.slice(0, 3).map((c: any, i: number) => (
                      <div key={i} className="pushItem">
                        <span className="u">{c.username}</span>
                        <span className="t">{c.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unlock Path (Back) */}
              <div className={`face back ${activeFaceIndex === 2 ? 'active' : ''}`}>
                <div className="faceBase"></div>
                <div className="sweep"></div>
                <div className="pad">
                  <div className="title">Unlock Path</div>
                  <div className="missionWrap">
                    <div className="mTitle">{payload.mission?.title}</div>
                    <div className="mLabel">{payload.mission?.label}</div>
                    <div className="barOuter">
                      <div className="barFill" style={{ width: `${payload.mission?.progressPct || 0}%` }}></div>
                    </div>
                    <div className="mNums">
                      <span>Current: <b>{payload.mission?.current || 0}</b></span>
                      <span>Target: <b>{payload.mission?.target || 0}</b></span>
                    </div>
                  </div>
                  
                  <div className="actList" style={{ marginTop: '15px' }}>
                    {payload.unlockLadder?.steps?.map((step: any, i: number) => (
                      <div key={i} className={`actItem ${step.state === 'just_unlocked' ? 'just_unlocked' : ''}`}>
                        <div className="actLeft">
                          <div className="actIcon"><Unlock size={16} /></div>
                          <div className="actText">
                            <div className="actName">{step.label}</div>
                            <div className="actNeed">{step.tokens} tokens</div>
                          </div>
                        </div>
                        <div className="actRight">
                          <div className={`actState ${step.state}`}>{step.state.replace('_', ' ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rules (Left) */}
              <div className={`face left ${activeFaceIndex === 3 ? 'active' : ''}`}>
                <div className="faceBase"></div>
                <div className="sweep"></div>
                <div className="pad">
                  <div className="rulesTitle">Room Rules</div>
                  <div className="ruleRow">
                    <div className="badge silver">Rule 1</div>
                    <div className="ruleTxt">Be respectful</div>
                  </div>
                  <div className="ruleRow">
                    <div className="badge gold">Rule 2</div>
                    <div className="ruleTxt">No spamming</div>
                  </div>
                  <div className="ruleRow">
                    <div className="badge diamond">Rule 3</div>
                    <div className="ruleTxt">Tips = Rewards</div>
                  </div>
                  
                  <div className="rulesTitle" style={{ marginTop: '15px' }}>Active Goal</div>
                  <div className="card">
                    <div className="line">
                      <span className="lbl">Status</span>
                      <span className="activePill"><div className="dot"></div> ACTIVE</span>
                    </div>
                    <div className="line" style={{ marginTop: '10px' }}>
                      <span className="lbl">Phase</span>
                      <span className="big">{payload.mission?.phase?.replace('_', ' ') || 'BUILDING'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className="toastWrap">
        <div className={`toast ${toast ? 'show' : ''}`}>
          <div className="l">
            <div className="k">NEW TIP</div>
            <div className="m">{toast?.username} sent {toast?.amount} tokens!</div>
          </div>
          <div className="v">+{toast?.amount}</div>
        </div>
      </div>
    </div>
  );
}
