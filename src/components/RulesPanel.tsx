export function RulesPanel({ payload }: { payload: any }) {
  return (
    <>
      <div className="p-6 border-b border-outline-variant/50 flex justify-between items-end bg-surface-container-low/50">
        <div>
          <h2 className="font-headline font-bold text-2xl text-primary tracking-wide">ROOM RULES</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Guidelines & Info</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold">1</div>
          <div className="font-medium text-on-surface text-lg">Be respectful to everyone</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold">2</div>
          <div className="font-medium text-on-surface text-lg">No spamming or self-promotion</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold">3</div>
          <div className="font-medium text-on-surface text-lg">Tips directly support the stream</div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Stream Status</h3>
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex justify-between items-center">
            <span className="text-on-surface font-medium">Current Phase</span>
            <span className="px-3 py-1 rounded-full bg-tertiary/20 text-tertiary text-xs font-bold border border-tertiary/30 uppercase tracking-wider">{payload.mission?.phase?.replace('_', ' ') || 'BUILDING'}</span>
          </div>
        </div>
      </div>
    </>
  );
}
