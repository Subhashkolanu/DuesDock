import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { transactionService } from '@/services/transactionService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/common/StatCard';
import { formatCurrency, CURRENCY_SYMBOLS } from '@/lib/utils';
import type { Transaction, Category, CurrencyCode } from '@/types/database.types';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  Percent,
  CreditCard,
  Building,
  Loader2,
  Calendar,
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

export type AnalyticsPeriod = 'this_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'all_time';

export const AnalyticsManager: React.FC = () => {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<AnalyticsPeriod>('last_6_months');

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([
      transactionService.getTransactions(user.id),
      transactionService.getCategories(user.id),
    ])
      .then(([txs, cats]) => {
        setTransactions(txs);
        setCategories(cats);
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  // Filter transactions by period
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
      if (period === 'last_3_months') {
        const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return txDate >= d;
      }
      if (period === 'last_6_months') {
        const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return txDate >= d;
      }
      if (period === 'this_year') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true; // all_time
    });
  }, [transactions, period]);

  // Key Metrics
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Largest Single Expense
  const largestExpense = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return null;
    return expenses.reduce((max, t) => (Number(t.amount) > Number(max.amount) ? t : max), expenses[0]);
  }, [filteredTransactions]);

  // Category Distribution
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number }>();
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.category_id);
        const catId = t.category_id || 'uncategorized';
        const name = cat?.name || 'Uncategorized';
        const color = cat?.color || '#008F62';

        if (!map.has(catId)) {
          map.set(catId, { name, color, total: 0 });
        }
        map.get(catId)!.total += Number(t.amount);
      });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories, totalExpenses]);

  // Top Merchants / Payees
  const topMerchants = useMemo(() => {
    const map = new Map<string, { merchant: string; count: number; total: number }>();
    filteredTransactions
      .filter((t) => t.type === 'expense' && t.merchant)
      .forEach((t) => {
        const m = t.merchant!.trim();
        if (!map.has(m)) {
          map.set(m, { merchant: m, count: 0, total: 0 });
        }
        const item = map.get(m)!;
        item.count += 1;
        item.total += Number(t.amount);
      });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredTransactions]);

  // 6-Month Comparison Trend
  const monthlyTrendData = useMemo(() => {
    const buckets: { monthKey: string; label: string; Income: number; Expenses: number; Net: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      buckets.push({ monthKey: key, label, Income: 0, Expenses: 0, Net: 0 });
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
        bucket.Net = bucket.Income - bucket.Expenses;
      }
    });

    return buckets;
  }, [transactions]);

  const periodOptions: Array<{ id: AnalyticsPeriod; label: string }> = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_3_months', label: '3 Months' },
    { id: 'last_6_months', label: '6 Months' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all_time', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
            Financial Analytics & Insights
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
            Deep performance metrics, spending velocity, and cash flow trends
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F1F4F6] dark:bg-[#202830] rounded-xl border border-[#E5E9EF] dark:border-[#303943] text-xs">
          {periodOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                period === opt.id
                  ? 'bg-[#FFFFFF] dark:bg-[#171D23] text-[#008F62] dark:text-[#00C78A] shadow-xs font-semibold'
                  : 'text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#008F62] dark:text-[#00C78A]" />
          <span>Analyzing financial records...</span>
        </div>
      ) : (
        <>
          {/* 1. Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              prominent
              title="Net Cash Flow"
              value={formatCurrency(netSavings, currency)}
              subtitle={netSavings >= 0 ? 'Net positive accumulation' : 'Net expenditure deficit'}
              icon={<TrendingUp className="w-5 h-5" />}
              color={netSavings >= 0 ? 'emerald' : 'rose'}
              trend={{
                value: netSavings >= 0 ? 'Surplus' : 'Deficit',
                isPositive: netSavings >= 0,
              }}
            />

            <StatCard
              title="Savings Rate"
              value={totalIncome > 0 ? `${Math.max(0, Math.round(savingsRate))}%` : '0%'}
              subtitle={
                savingsRate >= 20
                  ? 'Target rate achieved (≥20%)'
                  : 'Recommended baseline: 20%'
              }
              icon={<Percent className="w-5 h-5" />}
              color={savingsRate >= 20 ? 'emerald' : 'amber'}
            />

            <StatCard
              title="Total Outflow"
              value={formatCurrency(totalExpenses, currency)}
              subtitle={`${filteredTransactions.filter((t) => t.type === 'expense').length} payments`}
              icon={<TrendingDown className="w-5 h-5" />}
              color="rose"
            />

            <StatCard
              title="Largest Single Outflow"
              value={largestExpense ? formatCurrency(Number(largestExpense.amount), currency) : '—'}
              subtitle={largestExpense?.merchant || largestExpense?.notes || 'No expenses recorded'}
              icon={<CreditCard className="w-5 h-5" />}
              color="sky"
            />
          </div>

          {/* 2. Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Inflow vs Outflow Trend */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div className="pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
                <h3 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
                  Monthly Cash Flow Trends
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
                  Comparative performance over the past 6 months
                </p>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
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

            {/* Category Distribution Donut */}
            <Card className="p-6 flex flex-col justify-between">
              <div className="pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
                <h3 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
                  Spending by Category
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
                  Proportionate expense distribution
                </p>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#667085] dark:text-[#9AA6B2]">
                  No expense records found for this period.
                </div>
              ) : (
                <>
                  <div className="h-44 w-full my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
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
                          {categoryBreakdown.map((entry, index) => (
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

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {categoryBreakdown.slice(0, 5).map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate max-w-[150px]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-[#17212B] dark:text-[#F5F7FA] truncate font-medium">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[#17212B] dark:text-[#F5F7FA] font-semibold">
                            {formatCurrency(cat.total, currency)}
                          </span>
                          <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px]">
                            ({Math.round(cat.percentage)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* 3. Top Spending Merchants & Payees */}
          {topMerchants.length > 0 && (
            <Card className="p-6">
              <div className="pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
                <h3 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
                  Top Payees & Merchants
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
                  Entities receiving the highest transaction volume
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
                {topMerchants.map((m, i) => (
                  <div
                    key={m.merchant}
                    className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#008F62] dark:text-[#00C78A]">
                        #{i + 1} Merchant
                      </span>
                      <span className="text-[10px] text-[#667085] dark:text-[#9AA6B2]">
                        {m.count} payments
                      </span>
                    </div>
                    <p className="font-medium text-sm text-[#17212B] dark:text-[#F5F7FA] truncate">
                      {m.merchant}
                    </p>
                    <p className="font-mono font-bold text-xs text-[#17212B] dark:text-[#F5F7FA]">
                      {formatCurrency(m.total, currency)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
