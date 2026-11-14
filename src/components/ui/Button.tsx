import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'soft' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer relative overflow-hidden group';

  const variants = {
    primary:
      'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white font-semibold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/30 border border-emerald-400/30 active:scale-[0.98]',
    secondary:
      'bg-white/60 hover:bg-white/90 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-sm hover:border-emerald-500/30 dark:hover:border-emerald-400/30 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-white/40 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-white/15 backdrop-blur-sm active:scale-[0.98]',
    soft:
      'bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-400/15 dark:hover:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-400/30 backdrop-blur-md active:scale-[0.98]',
    glass:
      'glass-card hover:bg-white/80 dark:hover:bg-white/10 text-slate-900 dark:text-white border-white/40 dark:border-white/10 active:scale-[0.98]',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-500/30 border border-rose-400/30 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-slate-200/40 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-xl',
    md: 'text-sm px-4 py-2 gap-2 rounded-xl',
    lg: 'text-base px-5 py-2.5 gap-2.5 rounded-2xl',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Specular sheen on top edge */}
      <span className="absolute inset-x-0 top-0 h-px bg-white/25 pointer-events-none" />
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
