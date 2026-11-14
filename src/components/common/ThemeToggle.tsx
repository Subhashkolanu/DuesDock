import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 bg-white/70 dark:bg-white/5 border border-slate-300/70 dark:border-white/10 backdrop-blur-md hover:bg-white/90 dark:hover:bg-white/10 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-400/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 select-none cursor-pointer ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-sky-600 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
