import React from 'react';
import { cn } from '@/lib/utils';
import type { TransactionType, PaymentMethod } from '@/types/database.types';

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
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
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

export const TransactionTypeBadge: React.FC<{ type: TransactionType; className?: string }> = ({
  type,
  className,
}) => {
  if (type === 'income') {
    return <Badge variant="emerald" className={className}>Income</Badge>;
  }
  return <Badge variant="rose" className={className}>Expense</Badge>;
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
    upi: { label: 'UPI', variant: 'emerald' },
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
