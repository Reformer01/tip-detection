import { motion } from 'motion/react';

export function LeaderboardPanel({ payload }: { payload: any }) {
  return (
    <>
      <div className="p-6 border-b border-outline-variant/50 flex justify-between items-end bg-surface-container-low/50">
        <div>
          <h2 className="font-headline font-bold text-2xl text-primary tracking-wide">TOP TIPPERS</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Current Session Leaders</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/20 text-xs font-bold text-primary border border-primary/30 glow-border-gold">Session</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {payload.leaderboard?.topFans?.map((fan: any, i: number) => {
          if (i === 0) {
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={fan.userId} 
                className="relative p-4 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/40 flex items-center gap-4 group-hover:border-primary/60 transition-colors shadow-[0_0_15px_rgba(255,231,146,0.15)]"
              >
                <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse"></div>
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 border border-primary/50 flex items-center justify-center font-headline font-bold text-xl text-on-primary shadow-[0_0_15px_rgba(255,231,146,0.5)]">
                  <span className="material-symbols-outlined text-2xl">crown</span>
                </div>
                <div className="relative flex-1">
                  <div className="font-bold text-xl text-on-surface flex items-center gap-2">
                    {fan.username}
                    {fan.isWhale && <span className="material-symbols-outlined text-[18px] text-primary drop-shadow-[0_0_5px_rgba(255,231,146,0.8)]" title="VIP">workspace_premium</span>}
                  </div>
                  <div className="text-xs text-primary font-bold tracking-wide uppercase mt-0.5">{fan.tier} Tier</div>
                </div>
                <div className="relative font-headline font-bold text-3xl text-primary glow-text-cyan drop-shadow-md">{fan.value}</div>
              </motion.div>
            );
          }
          return (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={fan.userId} 
              className={`p-4 rounded-2xl border flex items-center gap-4 transition-colors ${i < 3 ? 'bg-surface-container-high/60 border-outline-variant hover:bg-surface-container-high hover:border-primary/30' : 'bg-surface-container-low/30 border-outline-variant/50 opacity-80 hover:opacity-100'}`}
            >
              <div className={`rounded-xl bg-surface-container border flex items-center justify-center font-headline font-bold text-on-surface-variant ${i < 3 ? 'w-10 h-10 text-lg border-outline shadow-sm' : 'w-8 h-8 text-sm border-outline/50'}`}>
                {fan.rank}
              </div>
              <div className="flex-1">
                <div className={`font-bold text-on-surface ${i < 3 ? 'text-lg' : 'text-base font-medium'}`}>{fan.username}</div>
                {i < 3 && <div className="text-[10px] text-on-surface-variant font-bold tracking-wider uppercase mt-0.5">{fan.tier} Tier</div>}
              </div>
              <div className={`font-headline font-bold ${i < 3 ? 'text-2xl text-on-surface' : 'text-xl text-on-surface-variant'}`}>{fan.value}</div>
            </motion.div>
          );
        })}
        {(!payload.leaderboard?.topFans || payload.leaderboard.topFans.length === 0) && (
          <div className="text-center text-on-surface-variant mt-10">No tips yet. Be the first!</div>
        )}
      </div>
    </>
  );
}
