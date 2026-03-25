import { motion } from 'motion/react';

export function MissionPanel({ payload }: { payload: any }) {
  const progress = payload.mission?.progressPct || 0;
  const isNearComplete = progress >= 80 && progress < 100;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-3xl border border-tertiary/30 shadow-xl p-6 relative overflow-hidden"
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-tertiary/20 rounded-full blur-3xl"></div>
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="text-[10px] font-label font-bold text-tertiary uppercase tracking-widest">Current Mission</span>
          </div>
          <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">{payload.mission?.title}</h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-tertiary text-2xl">flag</span>
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between text-sm font-bold mb-3">
          <span className="text-on-surface-variant uppercase tracking-wider text-xs">Progress</span>
          <span className={`text-lg ${isNearComplete ? 'text-tertiary animate-pulse' : 'text-tertiary'}`}>{progress}%</span>
        </div>
        
        <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/50 relative shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            className="h-full bg-gradient-to-r from-tertiary/80 to-primary relative"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBsOCA4VjBIMHptOCAwSDB2OGw4LTh6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMjUpIi8+PC9zdmc+')] opacity-50 animate-[slide_1s_linear_infinite]"></div>
            {isNearComplete && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
          </motion.div>
        </div>
        
        <div className="flex justify-between text-xs text-on-surface-variant mt-3 font-bold tracking-wide">
          <span>{payload.mission?.current || 0} tkns</span>
          <span>{payload.mission?.target || 0} tkns</span>
        </div>
      </div>
    </motion.div>
  );
}
