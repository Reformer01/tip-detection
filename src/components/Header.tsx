export function Header({ payload }: { payload: any }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-auto min-h-[5rem] p-4 lg:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-none bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      {/* Left: Avatar & Model Info */}
      <div className="flex items-center gap-3 lg:gap-4 pointer-events-auto">
        <div className="relative group cursor-pointer shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-tertiary rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
          <img alt="Avatar" className="relative w-10 h-10 lg:w-14 lg:h-14 rounded-2xl object-cover border-2 border-primary/30 shadow-lg" src="https://picsum.photos/seed/carmen/100/100" referrerPolicy="no-referrer" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-surface shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
        </div>
        <div className="flex flex-col">
          <h1 className="font-headline font-bold text-lg lg:text-xl text-primary tracking-wide glow-text-cyan uppercase truncate max-w-[150px] sm:max-w-xs">{payload.model?.stageName || 'Model'}</h1>
          <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 text-xs lg:text-sm text-on-surface-variant font-medium">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] lg:text-[16px] text-secondary">visibility</span> {payload.room?.viewerCount || 0}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant hidden sm:block"></span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] lg:text-[16px] text-tertiary">local_fire_department</span> {payload.room?.heat?.score?.toFixed(1) || '0.0'}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant hidden sm:block"></span>
            <span className="flex items-center gap-1 text-[10px] lg:text-xs truncate">{payload.model?.showTime || 'Live Now'}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Stats & Controls */}
      <div className="flex items-center gap-2 lg:gap-4 pointer-events-auto self-end sm:self-auto">
        <div className="glass-panel px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl border border-primary/20 flex items-center gap-2 lg:gap-3 shadow-lg">
          <div className="flex flex-col items-end">
            <span className="text-[8px] lg:text-[10px] font-label font-bold text-primary uppercase tracking-wider">Session Goal</span>
            <span className="font-headline font-bold text-base lg:text-lg text-on-surface">{payload.mission?.target || 0} <span className="text-primary text-xs lg:text-sm">tkns</span></span>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant shrink-0">
            <span className="material-symbols-outlined text-primary text-sm lg:text-base">target</span>
          </div>
        </div>
        <button className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl glass-panel border border-primary/20 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary/50 transition-colors shadow-lg shrink-0">
          <span className="material-symbols-outlined text-sm lg:text-base">settings</span>
        </button>
      </div>
    </header>
  );
}
