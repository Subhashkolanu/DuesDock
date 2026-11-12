import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { transactionService } from '@/services/transactionService';
import { budgetService } from '@/services/budgetService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TransactionTypeBadge, PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS, getCurrentMonthKey } from '@/lib/utils';
import type { Transaction, Category, Budget, CurrencyCode } from '@/types/database.types';
import Papa from 'papaparse';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Calendar,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Loader2,
  FileText,
  PieChart,
  Check,
  ArrowRight,
} from 'lucide-react';

export type ReportPeriod = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all_time';

export const ReportsManager: React.FC = () => {
  const { user, profile } = useAuth();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';
  const monthlyBudgetTarget = profile?.monthly_budget_target || 0;

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<ReportPeriod>('this_month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Success Feedback
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setFetchError(null);
      const [tData, cData, bData] = await Promise.all([
        transactionService.getTransactions(user.id),
        transactionService.getCategories(user.id),
        budgetService.getBudgets(user.id, getCurrentMonthKey()),
      ]);
      setTransactions(tData);
      setCategories(cData);
      setBudgets(bData);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Format Period Range Label
  const getPeriodLabel = (p: ReportPeriod) => {
    switch (p) {
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'last_3_months':
        return 'Last 3 Months';
      case 'this_year':
        return 'This Year';
      case 'all_time':
        return 'All Time';
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((t) => {
      const txDate = new Date(t.transaction_date);

      // Period filter
      if (period === 'this_month') {
        if (
          txDate.getFullYear() !== now.getFullYear() ||
          txDate.getMonth() !== now.getMonth()
        ) {
          return false;
        }
      } else if (period === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (
          txDate.getFullYear() !== lastMonthDate.getFullYear() ||
          txDate.getMonth() !== lastMonthDate.getMonth()
        ) {
          return false;
        }
      } else if (period === 'last_3_months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        if (txDate < threeMonthsAgo) return false;
      } else if (period === 'this_year') {
        if (txDate.getFullYear() !== now.getFullYear()) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, period, typeFilter, categoryFilter]);

  // Financial Calculations for Report
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

  const netCashFlow = totalIncome - totalExpenses;

  // Category Breakdown for the report
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; type: string; total: number }>();

    filteredTransactions.forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const catId = t.category_id || 'uncategorized';
      const catName = cat?.name || 'Uncategorized';

      if (!map.has(catId)) {
        map.set(catId, { name: catName, type: t.type, total: 0 });
      }
      map.get(catId)!.total += Number(t.amount);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories]);

  // 1. CSV Export Handler
  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions match the selected filters to export.');
      return;
    }

    const csvData = filteredTransactions.map((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return {
        Date: t.transaction_date,
        Type: t.type.toUpperCase(),
        Amount: Number(t.amount).toFixed(2),
        Currency: currency,
        Category: cat ? cat.name : 'Uncategorized',
        'Merchant / Payee': t.merchant || 'N/A',
        'Payment Method': t.payment_method.replace('_', ' ').toUpperCase(),
        Notes: t.notes || '',
      };
    });

    const csvString = Papa.unparse(csvData, {
      quotes: true,
      header: true,
    });

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `DuesDock_Financial_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 2500);
  };

  // 2. Printable PDF Statement Handler
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Financial Reports & Export
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate audit-ready CSV ledgers and printable executive financial statements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            leftIcon={
              csvDownloaded ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )
            }
          >
            <span>{csvDownloaded ? 'CSV Downloaded!' : 'Export CSV'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrintPdf}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Filter Toolbar (Hidden during print) */}
      <Card className="p-4 space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Period Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Reporting Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Transaction Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Types (Income & Expenses)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Selected: <strong className="text-slate-800">{filteredTransactions.length}</strong> transactions matching filters.
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Authenticated User RLS Scope
          </span>
        </div>
      </Card>

      {/* 3. PRINTABLE FINANCIAL STATEMENT (Optimized for Screen & Browser Print/PDF) */}
      <div className="print-page bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-10 space-y-6">
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-extrabold flex items-center justify-center text-sm">
                DD
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                DuesDock
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Personal Financial Statement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Period: <span className="font-bold text-slate-800">{getPeriodLabel(period)}</span> • Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="sm:text-right text-xs text-slate-600 space-y-0.5">
            <div>
              <span className="text-slate-400">Account Owner:</span>{' '}
              <strong className="text-slate-900">{profile?.full_name || 'Personal User'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Email:</span>{' '}
              <span className="font-mono">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400">Base Currency:</span>{' '}
              <strong className="text-emerald-700">{currency} ({CURRENCY_SYMBOLS[currency]})</strong>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            1. Executive Cash Flow Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-emerald-800 block">Total Inflow (Income)</span>
              <span className="text-xl font-mono font-black text-emerald-700 mt-1 block">
                {formatCurrency(totalIncome, currency)}
              </span>
              <span className="text-[11px] text-slate-500">
                {filteredTransactions.filter((t) => t.type === 'income').length} deposits
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-rose-800 block">Total Outflow (Expenses)</span>
              <span className="text-xl font-mono font-black text-rose-700 mt-1 block">
                {formatCurrency(totalExpenses, currency)}
              </span>
              <span className="text-[11px] text-slate-500">
                {filteredTransactions.filter((t) => t.type === 'expense').length} payments
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 block">Net Cash Flow (Savings)</span>
              <span
                className={`text-xl font-mono font-black mt-1 block ${
                  netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatCurrency(netCashFlow, currency)}
              </span>
              <span className="text-[11px] text-slate-500">
                {netCashFlow >= 0 ? 'Surplus balance' : 'Deficit balance'}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        {categoryBreakdown.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              2. Spending Breakdown by Category
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-4">Category Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Total Amount</th>
                    <th className="py-2.5 px-4 text-right">% of Spending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryBreakdown.map((cat, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-4 font-semibold text-slate-800">{cat.name}</td>
                      <td className="py-2 px-4 capitalize text-slate-500">{cat.type}</td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(cat.total, currency)}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-600 font-mono">
                        {totalExpenses > 0 && cat.type === 'expense'
                          ? `${Math.round((cat.total / totalExpenses) * 100)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Itemized Transaction Ledger */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            3. Itemized Transaction Ledger ({filteredTransactions.length} items)
          </h3>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No transactions recorded for the selected period and filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Merchant / Description</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.category_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                          {tx.transaction_date}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {tx.merchant || (isIncome ? 'Income' : 'Expense')}
                          {tx.notes && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {tx.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                          {cat?.name || 'Uncategorized'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap capitalize">
                          {tx.payment_method.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold whitespace-nowrap">
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
          )}
        </div>

        {/* Statement Footer */}
        <div className="pt-6 border-t border-slate-200 text-slate-400 text-[11px] flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>DuesDock Personal Finance • Generated securely from authenticated records</span>
          <span>End of Statement</span>
        </div>
      </div>
    </div>
  );
};
