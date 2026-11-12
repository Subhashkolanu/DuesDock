import React from 'react';
import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@/types/database.types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'sky';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'emerald',
  size = 'md',
  ...props
}) => {
  const variants = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: PaymentStatus; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'verified':
      return <Badge variant="emerald" className={className}>Verified / Paid</Badge>;
    case 'submitted':
      return <Badge variant="sky" className={className}>Proof Submitted</Badge>;
    case 'pending':
      return <Badge variant="amber" className={className}>Pending Payment</Badge>;
    case 'rejected':
      return <Badge variant="rose" className={className}>Rejected / Recheck</Badge>;
    case 'overdue':
      return <Badge variant="rose" className={className}>Overdue</Badge>;
    default:
      return <Badge variant="slate" className={className}>{status}</Badge>;
  }
};
