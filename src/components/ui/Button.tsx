import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'soft';
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
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#008F62]/30 dark:focus:ring-[#00C78A]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-[#008F62] hover:bg-[#007A53] dark:bg-[#00C78A] dark:hover:bg-[#00B37C] text-white dark:text-[#101418] shadow-xs hover:shadow font-semibold',
    secondary:
      'bg-[#F1F4F6] hover:bg-[#E5E9EF] dark:bg-[#202830] dark:hover:bg-[#28323C] text-[#17212B] dark:text-[#F5F7FA] border border-[#E5E9EF] dark:border-[#303943]',
    outline:
      'bg-transparent hover:bg-[#F1F4F6] dark:hover:bg-[#202830] text-[#17212B] dark:text-[#F5F7FA] border border-[#E5E9EF] dark:border-[#303943]',
    soft:
      'bg-[#008F62]/10 hover:bg-[#008F62]/15 dark:bg-[#00C78A]/15 dark:hover:bg-[#00C78A]/20 text-[#008F62] dark:text-[#00C78A] border border-[#008F62]/20 dark:border-[#00C78A]/30',
    danger:
      'bg-[#DC5252] hover:bg-[#C94545] dark:bg-[#FF6666] dark:hover:bg-[#E65555] text-white dark:text-[#101418] shadow-xs hover:shadow font-semibold',
    ghost:
      'bg-transparent hover:bg-[#F1F4F6] dark:hover:bg-[#202830] text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md',
    md: 'text-sm px-4 py-2 gap-2 rounded-lg',
    lg: 'text-base px-5 py-2.5 gap-2.5 rounded-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
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
