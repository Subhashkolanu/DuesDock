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
      className={`relative inline-flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] bg-[#FFFFFF] dark:bg-[#171D23] border border-[#E5E9EF] dark:border-[#303943] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors focus:outline-none focus:ring-2 focus:ring-[#008F62]/20 dark:focus:ring-[#00C78A]/20 select-none cursor-pointer ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#F0B94B] transition-transform duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-[#667085] transition-transform duration-200" />
      )}
      {showLabel && (
        <span className="text-xs text-[#667085] dark:text-[#9AA6B2]">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
