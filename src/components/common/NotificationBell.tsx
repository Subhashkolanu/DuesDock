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
        className="relative p-2 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors cursor-pointer"
        title="Notifications & Reminders"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC5252] dark:bg-[#FF6666] ring-2 ring-[#FFFFFF] dark:ring-[#171D23]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FFFFFF] dark:bg-[#171D23] border border-[#E5E9EF] dark:border-[#303943] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E9EF] dark:border-[#303943] px-1">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-xs text-[#17212B] dark:text-[#F5F7FA]">
                In-App Reminders & Alerts
              </span>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] text-[10px] font-bold">
                  {notifications.length}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => setDismissedIds(notifications.map((n) => n.id))}
                className="text-[11px] text-[#667085] dark:text-[#9AA6B2] hover:underline cursor-pointer"
              >
                Dismiss All
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#17212B] dark:text-[#F5F7FA]">
                All Clear!
              </p>
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2]">
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
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 relative group ${
                      isDanger
                        ? 'bg-[#DC5252]/5 dark:bg-[#DC5252]/10 border-[#DC5252]/20 hover:border-[#DC5252]/40'
                        : 'bg-[#D99A27]/5 dark:bg-[#D99A27]/10 border-[#D99A27]/20 hover:border-[#D99A27]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isDanger ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#DC5252] dark:text-[#FF6666] shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-[#D99A27] dark:text-[#F0B94B] shrink-0" />
                        )}
                        <span
                          className={`font-semibold text-xs ${
                            isDanger
                              ? 'text-[#DC5252] dark:text-[#FF6666]'
                              : 'text-[#D99A27] dark:text-[#F0B94B]'
                          }`}
                        >
                          {n.title}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDismiss(n.id, e)}
                        className="text-[#667085] hover:text-[#17212B] dark:text-[#9AA6B2] dark:hover:text-[#F5F7FA] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2] leading-tight pl-5">
                      {n.message}
                    </p>

                    {n.actionTab && (
                      <div className="pl-5 pt-1">
                        <span className="text-[10px] font-semibold text-[#008F62] dark:text-[#00C78A] flex items-center gap-1 group-hover:underline">
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
