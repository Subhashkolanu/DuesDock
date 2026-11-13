import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { transactionService } from '@/services/transactionService';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/common/StatCard';
import { PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS } from '@/lib/utils';
import type { Transaction, Category, CurrencyCode } from '@/types/database.types';
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
  onOpenAddTransaction: () => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  onNavigateToTransactions,
  onOpenAddTransaction,
}) => {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';
  const monthlyBudgetTarget = profile?.monthly_budget_target || 0;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Period filter
  const [period, setPeriod] = useState<DashboardPeriodFilter>('this_month');

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setFetchError(null);
      const [cats, txs] = await Promise.all([
        transactionService.getCategories(user.id),
        transactionService.getTransactions(user.id),
      ]);
      setCategories(cats);
      setTransactions(txs);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch financial data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((t) => {
      const txDate = new Date(t.transaction_date);

      if (period === 'this_month') {
        return (
          txDate.getFullYear() === now.getFullYear() &&
          txDate.getMonth() === now.getMonth()
        );
      }

      if (period === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          txDate.getFullYear() === lastMonthDate.getFullYear() &&
          txDate.getMonth() === lastMonthDate.getMonth()
        );
      }

      if (period === 'last_3_months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return txDate >= threeMonthsAgo;
      }

      if (period === 'this_year') {
        return txDate.getFullYear() === now.getFullYear();
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

  // Monthly Budget calculations
  const budgetRemaining = monthlyBudgetTarget - periodExpenses;
  const budgetUsagePercent =
    monthlyBudgetTarget > 0 ? (periodExpenses / monthlyBudgetTarget) * 100 : 0;

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

  // Recent 5 Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
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
          <h1 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
            Real-time overview of your cash flow, expenditure, and savings
          </p>
        </div>

        {/* Period Selector Pills */}
        <div className="flex items-center gap-1 p-1 bg-[#F1F4F6] dark:bg-[#202830] rounded-xl border border-[#E5E9EF] dark:border-[#303943] text-xs">
          {(['this_month', 'last_month', 'last_3_months', 'this_year'] as DashboardPeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                period === p
                  ? 'bg-[#FFFFFF] dark:bg-[#171D23] text-[#008F62] dark:text-[#00C78A] shadow-xs font-semibold'
                  : 'text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA]'
              }`}
            >
              {formatPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#008F62] dark:text-[#00C78A]" />
          <span>Loading financial overview...</span>
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center text-xs text-[#DC5252] dark:text-[#FF6666] bg-[#DC5252]/10 border border-[#DC5252]/20 rounded-xl">
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
            <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] fintech-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#17212B] dark:text-[#F5F7FA]">
                    Monthly Budget Progress
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      budgetUsagePercent >= 100
                        ? 'bg-[#DC5252]/10 text-[#DC5252] dark:text-[#FF6666]'
                        : budgetUsagePercent >= 80
                        ? 'bg-[#D99A27]/10 text-[#D99A27] dark:text-[#F0B94B]'
                        : 'bg-[#008F62]/10 text-[#008F62] dark:text-[#00C78A]'
                    }`}
                  >
                    {Math.round(budgetUsagePercent)}% Utilized
                  </span>
                </div>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2]">
                  {formatCurrency(periodExpenses, currency)} spent of {formatCurrency(monthlyBudgetTarget, currency)} ceiling
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-72 space-y-1">
                <div className="w-full bg-[#F1F4F6] dark:bg-[#202830] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      budgetUsagePercent >= 100
                        ? 'bg-[#DC5252] dark:bg-[#FF6666]'
                        : budgetUsagePercent >= 80
                        ? 'bg-[#D99A27] dark:bg-[#F0B94B]'
                        : 'bg-[#008F62] dark:bg-[#00C78A]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, budgetUsagePercent))}%` }}
                  />
                </div>
                {budgetUsagePercent >= 100 && (
                  <p className="text-[11px] text-[#DC5252] dark:text-[#FF6666] font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Budget ceiling exceeded
                  </p>
                )}
              </div>
            </div>
          )}

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
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
                    <div>
                      <h2 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
                        Income vs. Expenses
                      </h2>
                      <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
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
                          stroke={isDark ? '#303943' : '#E5E9EF'}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: isDark ? '#9AA6B2' : '#667085', fontSize: 11 }}
                          axisLine={{ stroke: isDark ? '#303943' : '#E5E9EF' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: isDark ? '#9AA6B2' : '#667085', fontSize: 11 }}
                          axisLine={{ stroke: isDark ? '#303943' : '#E5E9EF' }}
                          tickLine={false}
                          tickFormatter={(v) => `${CURRENCY_SYMBOLS[currency]}${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                          contentStyle={{
                            backgroundColor: isDark ? '#171D23' : '#FFFFFF',
                            borderRadius: '8px',
                            border: `1px solid ${isDark ? '#303943' : '#E5E9EF'}`,
                            color: isDark ? '#F5F7FA' : '#17212B',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                          iconType="circle"
                        />
                        <Bar
                          dataKey="Income"
                          fill={isDark ? '#00C78A' : '#008F62'}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="Expenses"
                          fill={isDark ? '#FF6666' : '#DC5252'}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Analytics (1 Col) */}
                <Card className="p-6 flex flex-col justify-between">
                  <div className="pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
                    <h2 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
                      Spending by Category
                    </h2>
                    <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
                      Distribution for {formatPeriodLabel(period)}
                    </p>
                  </div>

                  {categorySpendingBreakdown.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[#667085] dark:text-[#9AA6B2]">
                      No expense transactions logged for this period.
                    </div>
                  ) : (
                    <>
                      {/* Donut Chart */}
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
                              stroke={isDark ? '#171D23' : '#FFFFFF'}
                              strokeWidth={2}
                            >
                              {categorySpendingBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                              contentStyle={{
                                backgroundColor: isDark ? '#171D23' : '#FFFFFF',
                                borderRadius: '8px',
                                border: `1px solid ${isDark ? '#303943' : '#E5E9EF'}`,
                                color: isDark ? '#F5F7FA' : '#17212B',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Top Spending Category Callout */}
                      {highestSpendingCategory && (
                        <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#101418] border border-[#E5E9EF] dark:border-[#303943] text-xs mb-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-medium text-[#667085] dark:text-[#9AA6B2] block">
                              Top Spending Category
                            </span>
                            <span className="font-semibold text-[#17212B] dark:text-[#F5F7FA]">
                              {highestSpendingCategory.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#DC5252] dark:text-[#FF6666]">
                            {formatCurrency(highestSpendingCategory.total, currency)} ({Math.round(highestSpendingCategory.percentage)}%)
                          </span>
                        </div>
                      )}

                      {/* Top Category List with Progress Bars */}
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {categorySpendingBreakdown.slice(0, 4).map((cat) => (
                          <div key={cat.categoryId} className="text-xs space-y-1">
                            <div className="flex justify-between items-center text-[#17212B] dark:text-[#F5F7FA]">
                              <span className="flex items-center gap-1.5 font-medium truncate max-w-[140px]">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </span>
                              <span className="font-mono font-semibold">
                                {formatCurrency(cat.total, currency)}
                              </span>
                            </div>
                            <div className="w-full bg-[#F1F4F6] dark:bg-[#202830] rounded-full h-1.5 overflow-hidden">
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
                      <Clock className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
                      Recent Transactions
                    </CardTitle>
                    <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
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
                      <tr className="border-b border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] text-[11px] font-semibold text-[#667085] dark:text-[#9AA6B2]">
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Merchant / Description</th>
                        <th className="py-3 px-6">Category</th>
                        <th className="py-3 px-6">Method</th>
                        <th className="py-3 px-6 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E9EF] dark:divide-[#303943]">
                      {recentTransactions.map((tx) => {
                        const category = categories.find((c) => c.id === tx.category_id);
                        const isIncome = tx.type === 'income';

                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-[#F1F4F6]/60 dark:hover:bg-[#202830]/60 transition-colors cursor-pointer"
                            onClick={onNavigateToTransactions}
                          >
                            <td className="py-3.5 px-6 text-[#667085] dark:text-[#9AA6B2] whitespace-nowrap">
                              {new Date(tx.transaction_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>

                            <td className="py-3.5 px-6 font-medium text-[#17212B] dark:text-[#F5F7FA]">
                              {tx.merchant || (isIncome ? 'Income Deposit' : 'Expense Payment')}
                            </td>

                            <td className="py-3.5 px-6 whitespace-nowrap">
                              {category ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-[#17212B] dark:text-[#F5F7FA]">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </span>
                              ) : (
                                <span className="text-[#667085] dark:text-[#9AA6B2] italic">Uncategorized</span>
                              )}
                            </td>

                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <PaymentMethodBadge method={tx.payment_method} />
                            </td>

                            <td className="py-3.5 px-6 text-right font-mono font-semibold whitespace-nowrap text-sm">
                              <span className={isIncome ? 'text-[#008F62] dark:text-[#00C78A]' : 'text-[#17212B] dark:text-[#F5F7FA]'}>
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
