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
        'rounded-2xl transition-all duration-300 relative overflow-hidden',
        flat ? 'glass-card-subtle' : 'glass-card',
        hoverEffect &&
          'hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-500/30 dark:hover:border-emerald-400/40',
        className
      )}
      {...props}
    >
      {/* Specular top-edge refraction highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/15 to-transparent pointer-events-none" />
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
        'px-6 py-4.5 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between',
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
        'font-heading font-semibold text-base text-slate-900 dark:text-white tracking-tight',
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
