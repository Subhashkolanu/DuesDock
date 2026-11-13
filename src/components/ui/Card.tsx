import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  flat?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  flat = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-[#FFFFFF] dark:bg-[#171D23] rounded-xl border border-[#E5E9EF] dark:border-[#303943] transition-all duration-200',
        !flat && 'fintech-card-shadow',
        hoverEffect && 'hover:border-[#008F62]/30 dark:hover:border-[#00C78A]/30 hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-[#E5E9EF] dark:border-[#303943] flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn(
        'font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};
