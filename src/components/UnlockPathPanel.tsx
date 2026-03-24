export function UnlockPathPanel({ payload }: { payload: any }) {
  return (
    <>
      <div className="p-6 border-b border-outline-variant/50 flex justify-between items-end bg-surface-container-low/50">
        <div>
          <h2 className="font-headline font-bold text-2xl text-primary tracking-wide">UNLOCK PATH</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Milestones & Rewards</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
        {payload.unlockLadder?.steps?.map((step: any, i: number) => (
          <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${step.state === 'just_unlocked' ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(255,231,146,0.2)]' : step.state === 'unlocked' ? 'bg-surface-container-high border-outline-variant' : 'bg-surface-container-low/50 border-outline-variant/30 opacity-70'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.state === 'just_unlocked' || step.state === 'unlocked' ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-surface-container border-outline/50 text-on-surface-variant'}`}>
                <span className="material-symbols-outlined">{step.state === 'locked' ? 'lock' : 'lock_open'}</span>
              </div>
              <div>
                <div className={`font-bold text-lg ${step.state === 'locked' ? 'text-on-surface-variant' : 'text-on-surface'}`}>{step.label}</div>
                <div className="text-sm text-primary font-medium">{step.tokens} tkns</div>
              </div>
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${step.state === 'just_unlocked' ? 'bg-primary text-on-primary border-primary' : step.state === 'unlocked' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
              {step.state.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
