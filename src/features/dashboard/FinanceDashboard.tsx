import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { transactionService } from '@/services/transactionService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/common/StatCard';
import { TransactionTypeBadge, PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS } from '@/lib/utils';
import type { Transaction, Category, CurrencyCode } from '@/types/database.types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PieChart as PieIcon,
  Calendar,
  ArrowUpRight,
  Plus,
  Receipt,
  Loader2,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
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

  // Monthly Budget calculations (compared against monthly target)
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
        const catColor = cat?.color || '#94A3B8';

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

  // Monthly Comparison Chart Data (Income vs Expense over past months)
  const chartData = useMemo(() => {
    // Generate buckets for past 6 months
    const buckets: { monthKey: string; label: string; Income: number; Expenses: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      buckets.push({ monthKey, label, Income: 0, Expenses: 0 });
    }

    transactions.forEach((t) => {
      const txMonthKey = t.transaction_date.slice(0, 7);
      const bucket = buckets.find((b) => b.monthKey === txMonthKey);
      if (bucket) {
        if (t.type === 'income') {
          bucket.Income += Number(t.amount);
        } else {
          bucket.Expenses += Number(t.amount);
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
      {/* Top Bar: Title & Filter Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Financial Overview & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cash flow, category distributions, and monthly comparisons.
          </p>
        </div>

        {/* Dashboard Period Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
          {(['this_month', 'last_month', 'last_3_months', 'this_year'] as DashboardPeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                period === p
                  ? 'bg-emerald-600 text-white shadow-emerald shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {formatPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Calculating financial indicators...</span>
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl">
          <p className="font-semibold">{fetchError}</p>
          <Button variant="outline" size="sm" onClick={loadData} className="mt-3">
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* 1. FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={`Income (${formatPeriodLabel(period)})`}
              value={formatCurrency(periodIncome, currency)}
              subtitle={`${filteredTransactions.filter((t) => t.type === 'income').length} deposits`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />

            <StatCard
              title={`Expenses (${formatPeriodLabel(period)})`}
              value={formatCurrency(periodExpenses, currency)}
              subtitle={`${filteredTransactions.filter((t) => t.type === 'expense').length} payments`}
              icon={<TrendingDown className="w-5 h-5" />}
              color="rose"
            />

            <StatCard
              title="Net Cash Flow"
              value={formatCurrency(netCashFlow, currency)}
              subtitle={netCashFlow >= 0 ? 'Surplus savings' : 'Deficit spending'}
              icon={<Wallet className="w-5 h-5" />}
              color={netCashFlow >= 0 ? 'emerald' : 'rose'}
            />

            <StatCard
              title="Monthly Budget Remaining"
              value={
                monthlyBudgetTarget > 0
                  ? formatCurrency(budgetRemaining, currency)
                  : 'No Budget Set'
              }
              subtitle={
                monthlyBudgetTarget > 0
                  ? `${Math.round(budgetUsagePercent)}% of target used`
                  : 'Configure in settings'
              }
              icon={<PiggyBank className="w-5 h-5" />}
              color={budgetRemaining >= 0 ? 'emerald' : 'rose'}
            />
          </div>

          {/* Clean Empty Account State: When user has 0 total transactions */}
          {transactions.length === 0 ? (
            <Card className="p-10 text-center space-y-3 bg-white border-dashed border-2 border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Welcome to DuesDock Personal Finance
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No financial transactions have been recorded yet. Click below to add your first income deposit or daily expense to generate charts.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddTransaction}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Your First Transaction
              </Button>
            </Card>
          ) : (
            <>
              {/* 2 & 3: CHARTS & CATEGORY ANALYTICS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Income vs Expense Chart (2 Cols) */}
                <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Income vs. Expenses Trend
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        6-month comparative cash flow breakdown in {currency}
                      </p>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#64748B', fontSize: 11 }}
                          axisLine={{ stroke: '#E2E8F0' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#64748B', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${CURRENCY_SYMBOLS[currency]}${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                          iconType="circle"
                        />
                        <Bar
                          dataKey="Income"
                          fill="#059669"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                        <Bar
                          dataKey="Expenses"
                          fill="#E11D48"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Analytics & Donut (1 Col) */}
                <Card className="p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-600" />
                      Spending by Category
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Expense breakdown for {formatPeriodLabel(period)}
                    </p>
                  </div>

                  {categorySpendingBreakdown.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
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
                              outerRadius={68}
                              paddingAngle={3}
                            >
                              {categorySpendingBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                              contentStyle={{
                                backgroundColor: '#0F172A',
                                borderRadius: '10px',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Highest Spending Category Callout */}
                      {highestSpendingCategory && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Top Expense Category
                            </span>
                            <span className="font-bold text-slate-900">
                              {highestSpendingCategory.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-rose-600">
                            {formatCurrency(highestSpendingCategory.total, currency)} ({Math.round(highestSpendingCategory.percentage)}%)
                          </span>
                        </div>
                      )}

                      {/* Top Category List */}
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {categorySpendingBreakdown.slice(0, 4).map((cat) => (
                          <div key={cat.categoryId} className="text-xs space-y-1">
                            <div className="flex justify-between items-center text-slate-700">
                              <span className="flex items-center gap-1.5 font-medium truncate max-w-[140px]">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </span>
                              <span className="font-mono font-semibold">
                                {formatCurrency(cat.total, currency)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full"
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

              {/* 4. RECENT TRANSACTIONS (Latest 5) */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Recent Transactions
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your latest 5 financial activities
                    </p>
                  </div>

                  <Button
                    variant="soft"
                    size="sm"
                    onClick={onNavigateToTransactions}
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    View All Transactions
                  </Button>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Merchant / Description</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentTransactions.map((tx) => {
                        const category = categories.find((c) => c.id === tx.category_id);
                        const isIncome = tx.type === 'income';

                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                            onClick={onNavigateToTransactions}
                          >
                            <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                              {new Date(tx.transaction_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>

                            <td className="py-3 px-4 font-bold text-slate-900">
                              {tx.merchant || (isIncome ? 'Income Deposit' : 'Expense Payment')}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {category ? (
                                <span
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border"
                                  style={{
                                    backgroundColor: `${category.color}15`,
                                    color: category.color,
                                    borderColor: `${category.color}30`,
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Uncategorized</span>
                              )}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <PaymentMethodBadge method={tx.payment_method} />
                            </td>

                            <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-sm">
                              <span className={isIncome ? 'text-emerald-700' : 'text-slate-900'}>
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
