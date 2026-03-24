export function MissionPanel({ payload }: { payload: any }) {
  return (
    <div className="glass-panel rounded-3xl border border-tertiary/30 shadow-xl p-6 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-tertiary/20 rounded-full blur-2xl"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="text-[10px] font-label font-bold text-tertiary uppercase tracking-widest mb-1">Current Mission</div>
          <h3 className="font-headline font-bold text-xl text-on-surface">{payload.mission?.title}</h3>
        </div>
        <span className="material-symbols-outlined text-tertiary text-3xl">flag</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between text-sm font-bold mb-2">
          <span className="text-on-surface">Progress</span>
          <span className="text-tertiary">{payload.mission?.progressPct || 0}%</span>
        </div>
        <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant">
          <div className="h-full bg-gradient-to-r from-tertiary to-primary relative transition-all duration-700 ease-out" style={{ width: `${payload.mission?.progressPct || 0}%` }}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBsOCA4VjBIMHptOCAwSDB2OGw4LTh6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMikiLz48L3N2Zz4=')] opacity-50 animate-[slide_1s_linear_infinite]"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-on-surface-variant mt-2 font-medium">
          <span>{payload.mission?.current || 0} tkns</span>
          <span>{payload.mission?.target || 0} tkns</span>
        </div>
      </div>
    </div>
  );
}
