import { motion } from 'motion/react';

export function RulesPanel({ payload }: { payload: any }) {
  const rules = [
    "Be respectful to everyone",
    "No spamming or self-promotion",
    "Tips directly support the stream"
  ];

  return (
    <>
      <div className="p-6 border-b border-outline-variant/50 flex justify-between items-end bg-surface-container-low/50">
        <div>
          <h2 className="font-headline font-bold text-2xl text-primary tracking-wide">ROOM RULES</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Guidelines & Info</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
        {rules.map((rule, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant flex items-center gap-5 hover:bg-surface-container-highest transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-headline font-bold text-xl shadow-inner">
              {index + 1}
            </div>
            <div className="font-medium text-on-surface text-lg">{rule}</div>
          </motion.div>
        ))}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rules.length * 0.15 + 0.2 }}
          className="mt-8"
        >
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Stream Status
          </h3>
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant flex justify-between items-center shadow-sm">
            <span className="text-on-surface font-bold text-lg">Current Phase</span>
            <span className="px-4 py-1.5 rounded-full bg-tertiary/20 text-tertiary text-sm font-bold border border-tertiary/30 uppercase tracking-widest shadow-sm">
              {payload.mission?.phase?.replace('_', ' ') || 'BUILDING'}
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
