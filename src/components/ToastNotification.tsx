export function ToastNotification({ toast }: { toast: any }) {
  if (!toast) return null;
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="glass-panel px-6 py-3 rounded-2xl border border-primary/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-[slideUp_0.3s_ease-out]">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">payments</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-label font-bold text-primary uppercase tracking-wider">Tip Received</span>
          <span className="font-bold text-sm text-on-surface"><span className="text-primary">{toast.username}</span> sent {toast.amount} tkns</span>
        </div>
      </div>
    </div>
  );
}
