import React from 'react';
import { cn } from '@/lib/utils';
import type { TransactionType, PaymentMethod, PaymentDirection, PaymentStatus } from '@/types/database.types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'sky' | 'purple';
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
    emerald:
      'bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-400/30 shadow-xs shadow-emerald-500/10',
    amber:
      'bg-amber-500/15 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30 shadow-xs shadow-amber-500/10',
    rose:
      'bg-rose-500/15 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 dark:border-rose-400/30 shadow-xs shadow-rose-500/10',
    slate:
      'bg-slate-500/10 dark:bg-slate-400/10 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10 shadow-xs',
    sky:
      'bg-sky-500/15 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 dark:border-sky-400/30 shadow-xs shadow-sky-500/10',
    purple:
      'bg-purple-500/15 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 dark:border-purple-400/30 shadow-xs shadow-purple-500/10',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium select-none backdrop-blur-md',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-80" />
      <span>{children}</span>
    </span>
  );
};

export const TransactionTypeBadge: React.FC<{ type: TransactionType; className?: string }> = ({
  type,
  className,
}) => {
  if (type === 'income') {
    return <Badge variant="emerald" className={className}>+ Income</Badge>;
  }
  return <Badge variant="rose" className={className}>- Expense</Badge>;
};

export const PaymentMethodBadge: React.FC<{ method: PaymentMethod; className?: string }> = ({
  method,
  className,
}) => {
  const labels: Record<PaymentMethod, { label: string; variant: BadgeProps['variant'] }> = {
    credit_card: { label: 'Credit Card', variant: 'purple' },
    debit_card: { label: 'Debit Card', variant: 'sky' },
    cash: { label: 'Cash', variant: 'slate' },
    bank_transfer: { label: 'Bank Transfer', variant: 'slate' },
    upi: { label: 'UPI / Mobile', variant: 'emerald' },
    other: { label: 'Other', variant: 'slate' },
  };

  const item = labels[method] || labels.other;
  return <Badge variant={item.variant} size="sm" className={className}>{item.label}</Badge>;
};

export const BudgetStatusBadge: React.FC<{ percentage: number; className?: string }> = ({
  percentage,
  className,
}) => {
  if (percentage >= 100) {
    return <Badge variant="rose" size="sm" className={className}>Exceeded ({Math.round(percentage)}%)</Badge>;
  }
  if (percentage >= 80) {
    return <Badge variant="amber" size="sm" className={className}>Near Limit ({Math.round(percentage)}%)</Badge>;
  }
  return <Badge variant="emerald" size="sm" className={className}>On Track ({Math.round(percentage)}%)</Badge>;
};

export const PaymentDirectionBadge: React.FC<{ direction: PaymentDirection; className?: string }> = ({
  direction,
  className,
}) => {
  if (direction === 'receivable') {
    return <Badge variant="emerald" size="sm" className={className}>Receivable (In)</Badge>;
  }
  return <Badge variant="rose" size="sm" className={className}>Payable (Out)</Badge>;
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'paid':
      return <Badge variant="emerald" size="sm" className={className}>Paid</Badge>;
    case 'partially_paid':
      return <Badge variant="amber" size="sm" className={className}>Partially Paid</Badge>;
    case 'overdue':
      return <Badge variant="rose" size="sm" className={className}>Overdue</Badge>;
    case 'cancelled':
      return <Badge variant="slate" size="sm" className={className}>Cancelled</Badge>;
    case 'pending':
    default:
      return <Badge variant="sky" size="sm" className={className}>Pending</Badge>;
  }
};
