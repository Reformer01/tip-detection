import { ThreeDCoin } from './ThreeDCoin';

export function LiveActionPanel({ payload }: { payload: any }) {
  return (
    <div className="flex-1 glass-panel rounded-3xl border border-secondary/20 shadow-xl p-6 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none"></div>
      
      {/* 3D Coin Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <ThreeDCoin />
      </div>

      <div className="flex items-center gap-2 mb-6 relative z-10">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
        <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-widest">Live Action</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {payload.events?.latestTip ? (
          <>
            <div className="w-20 h-20 rounded-2xl bg-surface-container border border-secondary/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,238,252,0.15)] relative">
              <span className="material-symbols-outlined text-4xl text-secondary">rocket_launch</span>
              <div className="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-surface">NEW</div>
            </div>
            <h4 className="font-headline font-bold text-2xl text-on-surface mb-1">Mega Tip!</h4>
            <p className="text-sm text-on-surface-variant mb-4">User <span className="font-bold text-primary">{payload.events.latestTip.username}</span> just dropped a massive tip!</p>
            <div className="font-headline font-bold text-3xl text-secondary glow-text-cyan">+{payload.events.latestTip.amount} tkns</div>
          </>
        ) : (
          <div className="text-on-surface-variant flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl opacity-50">hourglass_empty</span>
            <p>Waiting for the next big moment...</p>
          </div>
        )}
      </div>
    </div>
  );
}
