import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: 'emerald' | 'amber' | 'rose' | 'sky';
  prominent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'emerald',
  prominent = false,
}) => {
  const colorStyles = {
    emerald:
      'bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] border border-[#008F62]/20 dark:border-[#00C78A]/30',
    amber:
      'bg-[#D99A27]/10 dark:bg-[#F0B94B]/15 text-[#D99A27] dark:text-[#F0B94B] border border-[#D99A27]/20 dark:border-[#F0B94B]/30',
    rose:
      'bg-[#DC5252]/10 dark:bg-[#FF6666]/15 text-[#DC5252] dark:text-[#FF6666] border border-[#DC5252]/20 dark:border-[#FF6666]/30',
    sky:
      'bg-[#0284C7]/10 dark:bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8] border border-[#0284C7]/20 dark:border-[#38BDF8]/30',
  };

  return (
    <Card
      hoverEffect
      className={cn(
        'p-5 sm:p-6 flex flex-col justify-between transition-all duration-200',
        prominent &&
          'border-[#008F62]/40 dark:border-[#00C78A]/40 bg-gradient-to-br from-[#FFFFFF] to-[#008F62]/[0.03] dark:from-[#171D23] dark:to-[#00C78A]/[0.05] fintech-elevated-shadow ring-1 ring-[#008F62]/20 dark:ring-[#00C78A]/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-[#667085] dark:text-[#9AA6B2] block">
            {title}
          </span>
          {prominent && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] text-[10px] font-semibold">
              Net Balance
            </span>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0', colorStyles[color])}>
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <div
          className={cn(
            'font-mono font-bold text-[#17212B] dark:text-[#F5F7FA] tracking-tight',
            prominent ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
          )}
        >
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'font-medium px-2 py-0.5 rounded-full border',
                  trend.isPositive
                    ? 'bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] border-[#008F62]/20 dark:border-[#00C78A]/30'
                    : 'bg-[#DC5252]/10 dark:bg-[#FF6666]/15 text-[#DC5252] dark:text-[#FF6666] border-[#DC5252]/20 dark:border-[#FF6666]/30'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-[#667085] dark:text-[#9AA6B2] truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
