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
          <div className="p-6 rounded-2xl bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/30 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-widest">Latest Tip</span>
              </div>
              <div className="font-headline font-bold text-2xl text-on-surface">{payload.events.latestTip.username}</div>
              <div className="font-headline font-bold text-3xl text-secondary glow-text-cyan my-2">{payload.events.latestTip.amount} tkns</div>
              <div className="text-sm text-on-surface-variant italic">"{payload.events.latestTip.message || 'Thanks for the tip!'}"</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-on-surface-variant mt-10">Waiting for a tip...</div>
        )}

        <div>
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Recent Contributors</h3>
          <div className="flex flex-col gap-3">
            {payload.events?.recentContributors?.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-surface-container-high/50 border border-outline-variant flex justify-between items-center">
                <span className="font-bold text-on-surface">{c.username}</span>
                <span className="font-headline font-bold text-primary">{c.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
