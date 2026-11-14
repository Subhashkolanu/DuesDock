import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { paymentService, PAYMENT_UPDATED_EVENT } from '@/services/paymentService';
import { transactionService } from '@/services/transactionService';
import { formatCurrency, getCurrentMonthKey } from '@/lib/utils';
import type { Payment, Transaction, CurrencyCode } from '@/types/database.types';
import {
  Bell,
  AlertTriangle,
  Clock,
  PieChart,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'overdue' | 'upcoming' | 'budget_warning';
  title: string;
  message: string;
  actionTab?: 'payments' | 'budgets';
  severity: 'danger' | 'warning' | 'info';
}

export interface NotificationBellProps {
  onNavigateTab: (tab: any) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateTab }) => {
  const { user, profile } = useAuth();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';
  const monthlyBudget = profile?.monthly_budget_target || 0;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [payList, txList] = await Promise.all([
        paymentService.getPayments(user.id),
        transactionService.getTransactions(user.id),
      ]);
      setPayments(payList);
      setTransactions(txList);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(PAYMENT_UPDATED_EVENT, handleUpdate);
    window.addEventListener('duesdock_transaction_updated', handleUpdate);
    window.addEventListener('duesdock_transaction_saved', handleUpdate);

    return () => {
      window.removeEventListener(PAYMENT_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('duesdock_transaction_updated', handleUpdate);
      window.removeEventListener('duesdock_transaction_saved', handleUpdate);
    };
  }, [user]);

  // Outside click to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active notifications
  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 3 days from now
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    const threeDaysStr = threeDays.toISOString().split('T')[0];

    // 1. Check for overdue payments
    const overdueList = payments.filter(
      (p) =>
        p.status === 'overdue' ||
        (p.due_date < today && p.status !== 'paid' && p.status !== 'cancelled')
    );

    if (overdueList.length > 0) {
      const totalOverdue = overdueList.reduce(
        (sum, p) => sum + Math.max(0, Number(p.total_amount) - Number(p.paid_amount)),
        0
      );
      list.push({
        id: `overdue-${overdueList.length}-${Math.round(totalOverdue)}`,
        type: 'overdue',
        title: `${overdueList.length} Overdue Payment${overdueList.length > 1 ? 's' : ''}`,
        message: `Totaling ${formatCurrency(totalOverdue, currency)} past due date. Take action to clear pending dues.`,
        actionTab: 'payments',
        severity: 'danger',
      });
    }

    // 2. Check for upcoming deadlines within 3 days
    const upcomingList = payments.filter((p) => {
      if (p.status === 'paid' || p.status === 'cancelled') return false;
      return p.due_date >= today && p.due_date <= threeDaysStr;
    });

    if (upcomingList.length > 0) {
      const totalUpcoming = upcomingList.reduce(
        (sum, p) => sum + Math.max(0, Number(p.total_amount) - Number(p.paid_amount)),
        0
      );
      list.push({
        id: `upcoming-${upcomingList.length}`,
        type: 'upcoming',
        title: `${upcomingList.length} Upcoming Deadline${upcomingList.length > 1 ? 's' : ''}`,
        message: `${formatCurrency(totalUpcoming, currency)} due within the next 3 days.`,
        actionTab: 'payments',
        severity: 'warning',
      });
    }

    // 3. Check for monthly budget threshold
    if (monthlyBudget > 0) {
      const currentMonthKey = getCurrentMonthKey();
      const monthExpenses = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date.startsWith(currentMonthKey))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const usagePercent = (monthExpenses / monthlyBudget) * 100;
      if (usagePercent >= 100) {
        list.push({
          id: `budget-exceeded-${currentMonthKey}`,
          type: 'budget_warning',
          title: 'Monthly Budget Limit Exceeded',
          message: `You have spent ${formatCurrency(monthExpenses, currency)} of your ${formatCurrency(monthlyBudget, currency)} target (${Math.round(usagePercent)}%).`,
          actionTab: 'budgets',
          severity: 'danger',
        });
      } else if (usagePercent >= 80) {
        list.push({
          id: `budget-warning-${currentMonthKey}`,
          type: 'budget_warning',
          title: 'Approaching Monthly Budget Limit',
          message: `You have utilized ${Math.round(usagePercent)}% of your monthly budget limit.`,
          actionTab: 'budgets',
          severity: 'warning',
        });
      }
    }

    return list.filter((item) => !dismissedIds.includes(item.id));
  }, [payments, transactions, monthlyBudget, currency, dismissedIds]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center p-2 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 bg-white/70 dark:bg-white/5 border border-slate-300/70 dark:border-white/10 backdrop-blur-md hover:bg-white/90 dark:hover:bg-white/10 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-400/40 transition-all duration-200 select-none cursor-pointer"
        title="Notifications & Reminders"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#070B10] shadow-xs shadow-rose-500/50" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel p-3.5 z-50 animate-in fade-in zoom-in-95 space-y-2.5 shadow-2xl border border-white/60 dark:border-white/10">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10 px-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                In-App Reminders & Alerts
              </span>
              {notifications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/25">
                  {notifications.length}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => setDismissedIds(notifications.map((n) => n.id))}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
              >
                Dismiss All
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                All Clear!
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No pending overdue payments, urgent deadlines, or budget warnings.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {notifications.map((n) => {
                const isDanger = n.severity === 'danger';
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.actionTab) {
                        onNavigateTab(n.actionTab);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 relative group backdrop-blur-md ${
                      isDanger
                        ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 hover:border-rose-500/50 text-rose-900 dark:text-rose-100'
                        : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 hover:border-amber-500/50 text-amber-900 dark:text-amber-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isDanger ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        <span
                          className={`font-semibold text-xs ${
                            isDanger
                              ? 'text-rose-700 dark:text-rose-300'
                              : 'text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {n.title}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDismiss(n.id, e)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight pl-5">
                      {n.message}
                    </p>

                    {n.actionTab && (
                      <div className="pl-5 pt-1">
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
                          <span>View {n.actionTab === 'payments' ? 'Payments' : 'Budgets'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
