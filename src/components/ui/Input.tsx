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
            className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#667085] dark:text-[#9AA6B2]">
              {leftElement}
            </div>
          )}
          <input
            id={generatedId}
            ref={ref}
            className={cn(
              'block w-full rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3.5 py-2 text-sm text-[#17212B] dark:text-[#F5F7FA] placeholder:text-[#667085]/60 dark:placeholder:text-[#9AA6B2]/60',
              'focus:border-[#008F62] dark:focus:border-[#00C78A] focus:ring-2 focus:ring-[#008F62]/15 dark:focus:ring-[#00C78A]/20 focus:outline-none transition-all duration-150',
              leftElement && 'pl-9',
              error && 'border-[#DC5252] dark:border-[#FF6666] focus:border-[#DC5252]',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-[#DC5252] dark:text-[#FF6666]">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
