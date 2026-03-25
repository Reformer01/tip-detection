import { motion } from 'motion/react';

export function SideNav({ activeFaceIndex, setActiveFaceIndex }: { activeFaceIndex: number, setActiveFaceIndex: (index: number) => void }) {
  const navItems = [
    { icon: 'leaderboard', label: 'Leaderboard' },
    { icon: 'star', label: 'Spotlight' },
    { icon: 'route', label: 'Unlock Path' },
    { icon: 'gavel', label: 'Rules' }
  ];

  return (
    <nav className="fixed lg:left-6 bottom-6 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 left-1/2 -translate-x-1/2 lg:translate-x-0 z-40 flex flex-row lg:flex-col gap-2 lg:gap-3 pointer-events-auto bg-surface-container-low/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-2 lg:p-0 rounded-2xl lg:rounded-none border border-outline-variant/30 lg:border-none shadow-lg lg:shadow-none">
      {navItems.map((item, index) => (
        <motion.button 
          key={index}
          initial={{ opacity: 0, scale: 0.5, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveFaceIndex(index)} 
          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl glass-panel border flex items-center justify-center transition-all group relative ${activeFaceIndex === index ? 'border-primary/30 text-primary shadow-[0_0_15px_rgba(255,231,146,0.2)] scale-110' : 'border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/30'}`}
        >
          <span className="material-symbols-outlined text-sm lg:text-base">{item.icon}</span>
          <span className="absolute lg:left-14 bottom-12 lg:bottom-auto bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant shadow-lg pointer-events-none">
            {item.label}
          </span>
        </motion.button>
      ))}
    </nav>
  );
}
