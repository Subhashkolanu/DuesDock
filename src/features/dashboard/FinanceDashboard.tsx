import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { transactionService } from '@/services/transactionService';
import { paymentService, PAYMENT_UPDATED_EVENT } from '@/services/paymentService';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/common/StatCard';
import { PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS, getCurrentMonthKey, getLastMonthKey, isDateWithinMonths, isDateInCurrentYear, TRANSACTION_UPDATED_EVENT } from '@/lib/utils';
import type { Transaction, Category, Payment, CurrencyCode } from '@/types/database.types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PieChart as PieIcon,
  ArrowUpRight,
  Plus,
  Receipt,
  Loader2,
  Clock,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export type DashboardPeriodFilter = 'this_month' | 'last_month' | 'last_3_months' | 'this_year';

export interface FinanceDashboardProps {
  onNavigateToTransactions: () => void;
  onNavigateToPayments?: () => void;
  onOpenAddTransaction: () => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  onNavigateToTransactions,
  onNavigateToPayments,
  onOpenAddTransaction,
}) => {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';
  const monthlyBudgetTarget = profile?.monthly_budget_target || 0;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Period filter
  const [period, setPeriod] = useState<DashboardPeriodFilter>('this_month');

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setFetchError(null);
      const [cats, txs, payList] = await Promise.all([
        transactionService.getCategories(user.id),
        transactionService.getTransactions(user.id),
        paymentService.getPayments(user.id),
      ]);
      setCategories(cats);
      setTransactions(txs);
      setPayments(payList);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch financial data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(TRANSACTION_UPDATED_EVENT, handleUpdate);
    window.addEventListener('duesdock_transaction_saved', handleUpdate);
    window.addEventListener(PAYMENT_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(TRANSACTION_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('duesdock_transaction_saved', handleUpdate);
      window.removeEventListener(PAYMENT_UPDATED_EVENT, handleUpdate);
    };
  }, [user]);

  // Filter transactions by selected period using robust calendar date logic
  const filteredTransactions = useMemo(() => {
    const currentMonthKey = getCurrentMonthKey();
    const lastMonthKey = getLastMonthKey();

    return transactions.filter((t) => {
      if (period === 'this_month') {
        return t.transaction_date.startsWith(currentMonthKey);
      }

      if (period === 'last_month') {
        return t.transaction_date.startsWith(lastMonthKey);
      }

      if (period === 'last_3_months') {
        return isDateWithinMonths(t.transaction_date, 3);
      }

      if (period === 'this_year') {
        return isDateInCurrentYear(t.transaction_date);
      }

      return true;
    });
  }, [transactions, period]);

  // Financial Metric Calculations
  const periodIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const periodExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const netCashFlow = periodIncome - periodExpenses;

  // Monthly Budget calculations (always benchmarked against the current month's actual expenses)
  const currentMonthExpenses = useMemo(() => {
    const currentMonthKey = getCurrentMonthKey();
    return transactions
      .filter((t) => t.type === 'expense' && t.transaction_date.startsWith(currentMonthKey))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const budgetRemaining = monthlyBudgetTarget - currentMonthExpenses;
  const budgetUsagePercent =
    monthlyBudgetTarget > 0 ? (currentMonthExpenses / monthlyBudgetTarget) * 100 : 0;

  // Payment Obligations Metrics
  const paymentMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let outstandingPayable = 0;
    let outstandingReceivable = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    payments.forEach((p) => {
      const remaining = Math.max(0, Number(p.total_amount) - Number(p.paid_amount));
      if (p.direction === 'payable') {
        outstandingPayable += remaining;
      } else {
        outstandingReceivable += remaining;
      }
      if (
        p.status === 'overdue' ||
        (p.due_date < today && p.status !== 'paid' && p.status !== 'cancelled')
      ) {
        overdueCount += 1;
        overdueAmount += remaining;
      }
    });

    return {
      outstandingPayable,
      outstandingReceivable,
      overdueCount,
      overdueAmount,
    };
  }, [payments]);

  // Category Analytics Breakdown
  const categorySpendingBreakdown = useMemo(() => {
    const map = new Map<string, { categoryId: string; name: string; color: string; total: number }>();

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.category_id);
        const catId = t.category_id || 'uncategorized';
        const catName = cat?.name || 'Uncategorized';
        const catColor = cat?.color || '#008F62';

        if (!map.has(catId)) {
          map.set(catId, { categoryId: catId, name: catName, color: catColor, total: 0 });
        }
        map.get(catId)!.total += Number(t.amount);
      });

    const list = Array.from(map.values())
      .map((item) => ({
        ...item,
        percentage: periodExpenses > 0 ? (item.total / periodExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return list;
  }, [filteredTransactions, categories, periodExpenses]);

  const highestSpendingCategory = categorySpendingBreakdown[0] || null;

  // Monthly Comparison Chart Data (Past 6 Months)
  const chartData = useMemo(() => {
    const buckets: { monthKey: string; label: string; Income: number; Expenses: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      buckets.push({ monthKey: key, label, Income: 0, Expenses: 0 });
    }

    transactions.forEach((tx) => {
      const txMonthKey = tx.transaction_date.substring(0, 7);
      const bucket = buckets.find((b) => b.monthKey === txMonthKey);
      if (bucket) {
        if (tx.type === 'income') {
          bucket.Income += Number(tx.amount);
        } else {
          bucket.Expenses += Number(tx.amount);
        }
      }
    });

    return buckets;
  }, [transactions]);

  // Recent 5 Transactions (ordered by transaction_date DESC, created_at DESC)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateDiff = b.transaction_date.localeCompare(a.transaction_date);
        if (dateDiff !== 0) return dateDiff;
        return (b.created_at || '').localeCompare(a.created_at || '');
      })
      .slice(0, 5);
  }, [transactions]);

  const formatPeriodLabel = (p: DashboardPeriodFilter) => {
    switch (p) {
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'last_3_months':
        return 'Last 3 Months';
      case 'this_year':
        return 'This Year';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time overview of your cash flow, expenditure, and savings
          </p>
        </div>

        {/* Period Selector Pills with Liquid Glass */}
        <div className="flex items-center gap-1.5 p-1 glass-card-subtle rounded-2xl border border-white/60 dark:border-white/10 text-xs shadow-xs">
          {(['this_month', 'last_month', 'last_3_months', 'this_year'] as DashboardPeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                period === p
                  ? 'liquid-pill-active text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              {formatPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span>Loading financial overview...</span>
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-2xl backdrop-blur-md">
          <p className="font-semibold">{fetchError}</p>
          <Button variant="outline" size="sm" onClick={loadData} className="mt-3">
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* 1. FINANCIAL SUMMARY METRIC CARDS (Net balance receives strongest emphasis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              prominent
              title="Net Cash Flow"
              value={formatCurrency(netCashFlow, currency)}
              subtitle={netCashFlow >= 0 ? 'Surplus savings cushion' : 'Deficit expenditure alert'}
              icon={<Wallet className="w-5 h-5" />}
              color={netCashFlow >= 0 ? 'emerald' : 'rose'}
              trend={{
                value: netCashFlow >= 0 ? 'Surplus' : 'Deficit',
                isPositive: netCashFlow >= 0,
              }}
            />

            <StatCard
              title={`Total Inflow (${formatPeriodLabel(period)})`}
              value={formatCurrency(periodIncome, currency)}
              subtitle={`${filteredTransactions.filter((t) => t.type === 'income').length} deposits recorded`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />

            <StatCard
              title={`Total Outflow (${formatPeriodLabel(period)})`}
              value={formatCurrency(periodExpenses, currency)}
              subtitle={`${filteredTransactions.filter((t) => t.type === 'expense').length} payments made`}
              icon={<TrendingDown className="w-5 h-5" />}
              color="rose"
            />

            <StatCard
              title="Monthly Budget Remaining"
              value={
                monthlyBudgetTarget > 0
                  ? formatCurrency(budgetRemaining, currency)
                  : 'No Target Set'
              }
              subtitle={
                monthlyBudgetTarget > 0
                  ? `${Math.round(budgetUsagePercent)}% of target limit used`
                  : 'Configure in Budgets'
              }
              icon={<PiggyBank className="w-5 h-5" />}
              color={budgetRemaining >= 0 ? 'emerald' : 'rose'}
            />
          </div>

          {/* Budget Utilization Overview Banner (if budget target set) */}
          {monthlyBudgetTarget > 0 && (
            <div className="p-5 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-white/70 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Monthly Budget Progress
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${
                      budgetUsagePercent >= 100
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                        : budgetUsagePercent >= 80
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {Math.round(budgetUsagePercent)}% Utilized
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatCurrency(currentMonthExpenses, currency)} spent of {formatCurrency(monthlyBudgetTarget, currency)} ceiling
                </p>
              </div>

              {/* Progress bar with glowing liquid gradient */}
              <div className="w-full sm:w-72 space-y-1.5">
                <div className="w-full bg-slate-200/60 dark:bg-white/10 rounded-full h-2.5 overflow-hidden backdrop-blur-xs">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetUsagePercent >= 100
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-xs shadow-rose-500/50'
                        : budgetUsagePercent >= 80
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-xs shadow-amber-500/50'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs shadow-emerald-500/50'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, budgetUsagePercent))}%` }}
                  />
                </div>
                {budgetUsagePercent >= 100 && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Budget ceiling exceeded
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Obligations Quick Overview */}
          <div className="p-5 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-white/70 dark:border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Active Payment Obligations
                </span>
                {paymentMetrics.overdueCount > 0 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{paymentMetrics.overdueCount} Overdue ({formatCurrency(paymentMetrics.overdueAmount, currency)})</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Deadlines on track
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Payables: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatCurrency(paymentMetrics.outstandingPayable, currency)}</strong>
                {' • '}
                Receivables: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(paymentMetrics.outstandingReceivable, currency)}</strong>
              </p>
            </div>

            {onNavigateToPayments && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToPayments}
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Track Payments & Dues
              </Button>
            )}
          </div>

          {/* Clean Empty Account State: When user has 0 total transactions */}
          {transactions.length === 0 ? (
            <Card className="p-12 text-center space-y-4 border border-dashed border-[#E5E9EF] dark:border-[#303943]">
              <div className="w-12 h-12 rounded-2xl bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-[#17212B] dark:text-[#F5F7FA]">
                  No Transactions Recorded Yet
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2] max-w-md mx-auto mt-1">
                  Record your first income deposit or daily expense to generate real-time financial charts and category breakdowns.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={onOpenAddTransaction}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record First Transaction
              </Button>
            </Card>
          ) : (
            <>
              {/* 2 & 3: CHARTS & CATEGORY ANALYTICS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Income vs Expense Chart (2 Cols) */}
                <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/5">
                    <div>
                      <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Income vs. Expenses
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Past 6 months comparison in {currency}
                      </p>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)'}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                          axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(203, 213, 225, 0.8)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                          axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(203, 213, 225, 0.8)' }}
                          tickLine={false}
                          tickFormatter={(v) => `${CURRENCY_SYMBOLS[currency]}${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                          contentStyle={{
                            backgroundColor: isDark ? 'rgba(10, 16, 25, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: '16px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.9)',
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontSize: '12px',
                            boxShadow: '0 12px 32px 0 rgba(0, 0, 0, 0.25)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                          iconType="circle"
                        />
                        <Bar
                          dataKey="Income"
                          fill={isDark ? '#00C78A' : '#059669'}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="Expenses"
                          fill={isDark ? '#FB7185' : '#F43F5E'}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Analytics (1 Col) */}
                <Card className="p-6 flex flex-col justify-between">
                  <div className="pb-4 border-b border-slate-200/60 dark:border-white/5">
                    <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Spending by Category
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Distribution for {formatPeriodLabel(period)}
                    </p>
                  </div>

                  {categorySpendingBreakdown.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">
                      No expense transactions logged for this period.
                    </div>
                  ) : (
                    <>
                      {/* Donut Chart with clean translucent center */}
                      <div className="h-44 w-full my-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categorySpendingBreakdown}
                              dataKey="total"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={72}
                              paddingAngle={3}
                              stroke={isDark ? '#070B10' : '#FFFFFF'}
                              strokeWidth={2}
                            >
                              {categorySpendingBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                              contentStyle={{
                                backgroundColor: isDark ? 'rgba(10, 16, 25, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '14px',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.9)',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Top Spending Category Callout */}
                      {highestSpendingCategory && (
                        <div className="p-3.5 rounded-2xl glass-card-subtle text-xs mb-3 flex items-center justify-between border border-white/40 dark:border-white/5">
                          <div>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
                              Top Spending Category
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {highestSpendingCategory.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(highestSpendingCategory.total, currency)} ({Math.round(highestSpendingCategory.percentage)}%)
                          </span>
                        </div>
                      )}

                      {/* Top Category List with Progress Bars */}
                      <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                        {categorySpendingBreakdown.slice(0, 4).map((cat) => (
                          <div key={cat.categoryId} className="text-xs space-y-1">
                            <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                              <span className="flex items-center gap-1.5 font-medium truncate max-w-[140px]">
                                <span
                                  className="w-2 h-2 rounded-full shadow-xs"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </span>
                              <span className="font-mono font-semibold">
                                {formatCurrency(cat.total, currency)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/60 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${cat.percentage}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* 4. RECENT TRANSACTIONS LEDGER (Latest 5) */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Recent Transactions
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Your latest 5 financial movements
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToTransactions}
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    View All
                  </Button>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-100/50 dark:bg-white/5 backdrop-blur-xs text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-3.5 px-6">Date</th>
                        <th className="py-3.5 px-6">Merchant / Description</th>
                        <th className="py-3.5 px-6">Category</th>
                        <th className="py-3.5 px-6">Method</th>
                        <th className="py-3.5 px-6 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                      {recentTransactions.map((tx) => {
                        const category = categories.find((c) => c.id === tx.category_id);
                        const isIncome = tx.type === 'income';

                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={onNavigateToTransactions}
                          >
                            <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(tx.transaction_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>

                            <td className="py-3.5 px-6 font-medium text-slate-900 dark:text-white">
                              {tx.merchant || (isIncome ? 'Income Deposit' : 'Expense Payment')}
                            </td>

                            <td className="py-3.5 px-6 whitespace-nowrap">
                              {category ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Uncategorized</span>
                              )}
                            </td>

                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <PaymentMethodBadge method={tx.payment_method} />
                            </td>

                            <td className="py-3.5 px-6 text-right font-mono font-semibold whitespace-nowrap text-sm">
                              <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                                {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};
