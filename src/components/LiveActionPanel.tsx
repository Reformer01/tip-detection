import { motion, AnimatePresence } from 'motion/react';
import { ThreeDCoin } from './ThreeDCoin';

export function LiveActionPanel({ payload }: { payload: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 glass-panel rounded-3xl border border-secondary/20 shadow-xl p-6 flex flex-col relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none"></div>
      
      {/* 3D Coin Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <ThreeDCoin />
      </div>

      <div className="flex items-center gap-2 mb-6 relative z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping absolute opacity-75"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-secondary relative"></span>
        <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-widest">Live Action</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <AnimatePresence mode="wait">
          {payload.events?.latestTip ? (
            <motion.div
              key={payload.events.latestTip.eventId || payload.events.latestTip.username}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-surface-container border border-secondary/40 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(0,238,252,0.2)] relative">
                <span className="material-symbols-outlined text-5xl text-secondary">rocket_launch</span>
                <div className="absolute -top-3 -right-3 bg-primary text-on-primary text-[11px] font-bold px-3 py-1 rounded-full border-2 border-surface shadow-lg animate-bounce">NEW</div>
              </div>
              <h4 className="font-headline font-bold text-3xl text-on-surface mb-2 tracking-tight">Mega Tip!</h4>
              <p className="text-base text-on-surface-variant mb-5">User <span className="font-bold text-primary text-lg">{payload.events.latestTip.username}</span> just dropped a massive tip!</p>
              <div className="font-headline font-bold text-5xl text-secondary glow-text-cyan drop-shadow-lg">+{payload.events.latestTip.amount} tkns</div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-on-surface-variant flex flex-col items-center gap-4"
            >
              <span className="material-symbols-outlined text-5xl opacity-40">hourglass_empty</span>
              <p className="text-lg font-medium">Waiting for the next big moment...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
