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
      'bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 dark:border-emerald-400/30 shadow-xs shadow-emerald-500/10',
    amber:
      'bg-amber-500/15 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 dark:border-amber-400/30 shadow-xs shadow-amber-500/10',
    rose:
      'bg-rose-500/15 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 dark:border-rose-400/30 shadow-xs shadow-rose-500/10',
    sky:
      'bg-sky-500/15 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300 border border-sky-500/25 dark:border-sky-400/30 shadow-xs shadow-sky-500/10',
  };

  return (
    <Card
      hoverEffect
      className={cn(
        'p-5 sm:p-6 flex flex-col justify-between transition-all duration-300',
        prominent &&
          'border-emerald-500/40 dark:border-emerald-400/40 bg-gradient-to-br from-white/90 via-emerald-500/[0.04] to-cyan-500/[0.04] dark:from-[#0E1724]/90 dark:via-emerald-500/[0.07] dark:to-cyan-500/[0.05] shadow-lg shadow-emerald-500/10'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block tracking-wide">
            {title}
          </span>
          {prominent && (
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 dark:border-emerald-400/30">
              Net Balance
            </span>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0 backdrop-blur-md', colorStyles[color])}>
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <div
          className={cn(
            'font-mono font-bold text-slate-900 dark:text-white tracking-tight',
            prominent ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
          )}
        >
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'font-medium px-2 py-0.5 rounded-full border backdrop-blur-xs',
                  trend.isPositive
                    ? 'bg-emerald-500/15 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/30'
                    : 'bg-rose-500/15 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-400/30'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
