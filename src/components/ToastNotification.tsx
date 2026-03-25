import { motion, AnimatePresence } from 'motion/react';

export function ToastNotification({ toast }: { toast: any }) {
  return (
    <div className="fixed bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-panel px-6 py-3 rounded-2xl border border-primary/40 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(255,231,146,0.2)] flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50"></div>
              <span className="material-symbols-outlined text-primary relative z-10">payments</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-label font-bold text-primary uppercase tracking-wider">Tip Received</span>
              <span className="font-bold text-sm text-on-surface"><span className="text-primary">{toast.username}</span> sent {toast.amount} tkns</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
