import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { LeaderboardPanel } from './LeaderboardPanel';
import { SpotlightPanel } from './SpotlightPanel';
import { UnlockPathPanel } from './UnlockPathPanel';
import { RulesPanel } from './RulesPanel';

export function RotatingCubePanel({ activeFaceIndex, payload }: { activeFaceIndex: number, payload: any }) {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // Calculate rotation based on active face
  // 0: front (0deg), 1: right (-90deg), 2: back (-180deg), 3: left (90deg)
  const yRotations = [0, -90, -180, 90];
  let targetRotation = yRotations[activeFaceIndex] || 0;

  // Handle shortest path rotation to avoid spinning all the way around
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setRotation((prev) => {
      const diff = ((targetRotation - prev + 540) % 360) - 180;
      return prev + diff;
    });
  }, [targetRotation]);

  // Dynamically calculate scale based on container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // The cube is 480x560. We add some padding (e.g., 40px) to ensure it doesn't touch the edges.
        const scaleX = width / (480 + 40);
        const scaleY = height / (560 + 40);
        setScale(Math.min(1, scaleX, scaleY));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const offset = 240; // Half of the width (480px)

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center" 
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `scale(${scale})`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        <motion.div
          className="relative w-[480px] h-[560px]"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ 
            rotateY: rotation,
            rotateX: hovered ? -2 : 0,
            z: hovered ? 20 : 0
          }}
          transition={{ 
            type: "spring", 
            stiffness: 40, 
            damping: 15,
            mass: 1.5
          }}
        >
          {/* Front Face: Leaderboard */}
          <div 
            className="absolute inset-0 w-[480px] h-[560px] pointer-events-auto glass-panel rounded-3xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden"
            style={{ transform: `translateZ(${offset}px)` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            <LeaderboardPanel payload={payload} />
          </div>
          
          {/* Right Face: Spotlight */}
          <div 
            className="absolute inset-0 w-[480px] h-[560px] pointer-events-auto glass-panel rounded-3xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden"
            style={{ transform: `rotateY(90deg) translateZ(${offset}px)` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            <SpotlightPanel payload={payload} />
          </div>
          
          {/* Back Face: Unlock Path */}
          <div 
            className="absolute inset-0 w-[480px] h-[560px] pointer-events-auto glass-panel rounded-3xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden"
            style={{ transform: `rotateY(180deg) translateZ(${offset}px)` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            <UnlockPathPanel payload={payload} />
          </div>
          
          {/* Left Face: Rules */}
          <div 
            className="absolute inset-0 w-[480px] h-[560px] pointer-events-auto glass-panel rounded-3xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden"
            style={{ transform: `rotateY(-90deg) translateZ(${offset}px)` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            <RulesPanel payload={payload} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
