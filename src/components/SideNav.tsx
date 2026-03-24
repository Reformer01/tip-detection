export function SideNav({ activeFaceIndex, setActiveFaceIndex }: { activeFaceIndex: number, setActiveFaceIndex: (index: number) => void }) {
  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 pointer-events-auto">
      <button onClick={() => setActiveFaceIndex(0)} className={`w-12 h-12 rounded-2xl glass-panel border flex items-center justify-center transition-all group relative ${activeFaceIndex === 0 ? 'border-primary/30 text-primary shadow-[0_0_15px_rgba(255,231,146,0.2)] scale-105' : 'border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/30'}`}>
        <span className="material-symbols-outlined">leaderboard</span>
        <span className="absolute left-14 bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant">Leaderboard</span>
      </button>
      <button onClick={() => setActiveFaceIndex(1)} className={`w-12 h-12 rounded-2xl glass-panel border flex items-center justify-center transition-all group relative ${activeFaceIndex === 1 ? 'border-primary/30 text-primary shadow-[0_0_15px_rgba(255,231,146,0.2)] scale-105' : 'border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/30'}`}>
        <span className="material-symbols-outlined">star</span>
        <span className="absolute left-14 bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant">Spotlight</span>
      </button>
      <button onClick={() => setActiveFaceIndex(2)} className={`w-12 h-12 rounded-2xl glass-panel border flex items-center justify-center transition-all group relative ${activeFaceIndex === 2 ? 'border-primary/30 text-primary shadow-[0_0_15px_rgba(255,231,146,0.2)] scale-105' : 'border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/30'}`}>
        <span className="material-symbols-outlined">route</span>
        <span className="absolute left-14 bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant">Unlock Path</span>
      </button>
      <button onClick={() => setActiveFaceIndex(3)} className={`w-12 h-12 rounded-2xl glass-panel border flex items-center justify-center transition-all group relative ${activeFaceIndex === 3 ? 'border-primary/30 text-primary shadow-[0_0_15px_rgba(255,231,146,0.2)] scale-105' : 'border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/30'}`}>
        <span className="material-symbols-outlined">gavel</span>
        <span className="absolute left-14 bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant">Rules</span>
      </button>
    </nav>
  );
}
