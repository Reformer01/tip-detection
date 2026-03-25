import { motion } from 'motion/react';

export function SpotlightPanel({ payload }: { payload: any }) {
  return (
    <>
      <div className="p-6 border-b border-outline-variant/50 flex justify-between items-end bg-surface-container-low/50">
        <div>
          <h2 className="font-headline font-bold text-2xl text-primary tracking-wide">SPOTLIGHT</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Recent Activity</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
        {payload.events?.latestTip ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-secondary/20 via-secondary/5 to-transparent border border-secondary/40 relative overflow-hidden shadow-[0_0_30px_rgba(0,238,252,0.1)]"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping absolute opacity-75"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary relative"></span>
                <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-widest">Latest Tip</span>
              </div>
              <div className="font-headline font-bold text-3xl text-on-surface tracking-tight">{payload.events.latestTip.username}</div>
              <div className="font-headline font-bold text-4xl text-secondary glow-text-cyan my-3 drop-shadow-md">{payload.events.latestTip.amount} tkns</div>
              <div className="text-base text-on-surface-variant italic border-l-2 border-secondary/50 pl-3 py-1 bg-surface-container/30 rounded-r-lg">"{payload.events.latestTip.message || 'Thanks for the tip!'}"</div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center text-on-surface-variant mt-10">Waiting for a tip...</div>
        )}

        <div className="mt-2">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">history</span>
            Recent Contributors
          </h3>
          <div className="flex flex-col gap-3">
            {payload.events?.recentContributors?.map((c: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="p-4 rounded-xl bg-surface-container-high/60 border border-outline-variant flex justify-between items-center hover:bg-surface-container-highest transition-colors"
              >
                <span className="font-bold text-on-surface text-lg">{c.username}</span>
                <span className="font-headline font-bold text-xl text-primary">{c.amount}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
