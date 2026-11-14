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
      'bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] border border-[#008F62]/20 dark:border-[#00C78A]/30',
    amber:
      'bg-[#D99A27]/10 dark:bg-[#F0B94B]/15 text-[#D99A27] dark:text-[#F0B94B] border border-[#D99A27]/20 dark:border-[#F0B94B]/30',
    rose:
      'bg-[#DC5252]/10 dark:bg-[#FF6666]/15 text-[#DC5252] dark:text-[#FF6666] border border-[#DC5252]/20 dark:border-[#FF6666]/30',
    slate:
      'bg-[#F1F4F6] dark:bg-[#202830] text-[#667085] dark:text-[#9AA6B2] border border-[#E5E9EF] dark:border-[#303943]',
    sky:
      'bg-[#0284C7]/10 dark:bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8] border border-[#0284C7]/20 dark:border-[#38BDF8]/30',
    purple:
      'bg-[#7E22CE]/10 dark:bg-[#C084FC]/15 text-[#7E22CE] dark:text-[#C084FC] border border-[#7E22CE]/20 dark:border-[#C084FC]/30',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
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
