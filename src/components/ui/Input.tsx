import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftElement, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftElement}
            </div>
          )}
          <input
            id={generatedId}
            ref={ref}
            className={cn(
              'block w-full rounded-xl border border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-[#0B1118]/70 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400/80 dark:placeholder:text-slate-500 backdrop-blur-md',
              'focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/20 focus:outline-none transition-all duration-200',
              leftElement && 'pl-10',
              error && 'border-rose-500 dark:border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
