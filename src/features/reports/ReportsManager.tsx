import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { transactionService } from '@/services/transactionService';
import { budgetService } from '@/services/budgetService';
import { paymentService, PAYMENT_UPDATED_EVENT } from '@/services/paymentService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, CURRENCY_SYMBOLS, getCurrentMonthKey, getLastMonthKey, isDateWithinMonths, isDateInCurrentYear, TRANSACTION_UPDATED_EVENT } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';
import type { Transaction, Category, Payment, CurrencyCode } from '@/types/database.types';
import Papa from 'papaparse';
import {
  Printer,
  Download,
  ShieldCheck,
  Check,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';

export type ReportPeriod = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all_time';

export const ReportsManager: React.FC = () => {
  const { user, profile } = useAuth();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<ReportPeriod>('this_month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Success Feedback
  const [csvDownloaded, setCsvDownloaded] = useState(false);
  const [paymentsCsvDownloaded, setPaymentsCsvDownloaded] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setFetchError(null);
      const [tData, cData, pData] = await Promise.all([
        transactionService.getTransactions(user.id),
        transactionService.getCategories(user.id),
        paymentService.getPayments(user.id),
        budgetService.getBudgets(user.id, getCurrentMonthKey()),
      ]);
      setTransactions(tData);
      setCategories(cData);
      setPayments(pData);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load report data');
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

  // Filtered Transactions (using robust calendar date logic immune to UTC offsets)
  const filteredTransactions = useMemo(() => {
    const currentMonthKey = getCurrentMonthKey();
    const lastMonthKey = getLastMonthKey();

    return transactions.filter((t) => {
      // Period filter
      if (period === 'this_month') {
        if (!t.transaction_date.startsWith(currentMonthKey)) return false;
      } else if (period === 'last_month') {
        if (!t.transaction_date.startsWith(lastMonthKey)) return false;
      } else if (period === 'last_3_months') {
        if (!isDateWithinMonths(t.transaction_date, 3)) return false;
      } else if (period === 'this_year') {
        if (!isDateInCurrentYear(t.transaction_date)) return false;
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
    const filename = `DuesDock_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 2500);
  };

  // 2. Payments CSV Export Handler
  const handleExportPaymentsCsv = () => {
    if (payments.length === 0) {
      alert('No payment obligations available to export.');
      return;
    }

    const csvData = payments.map((p) => {
      const cat = categories.find((c) => c.id === p.category_id);
      const remaining = Math.max(0, Number(p.total_amount) - Number(p.paid_amount));
      return {
        Title: p.title,
        Counterparty: p.party_name,
        Direction: p.direction.toUpperCase(),
        'Due Date': p.due_date,
        'Total Amount': Number(p.total_amount).toFixed(2),
        'Paid Amount': Number(p.paid_amount).toFixed(2),
        'Remaining Balance': remaining.toFixed(2),
        Currency: currency,
        Category: cat ? cat.name : 'General',
        Status: p.status.toUpperCase(),
        Notes: p.notes || '',
      };
    });

    const csvString = Papa.unparse(csvData, { quotes: true, header: true });
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DuesDock_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setPaymentsCsvDownloaded(true);
    setTimeout(() => setPaymentsCsvDownloaded(false), 2500);
  };

  // 3. Printable PDF Statement Handler
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
            Financial Statements & Export
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
            Generate audit-ready CSV ledgers and executive printable financial reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            leftIcon={
              csvDownloaded ? (
                <Check className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
              ) : (
                <Download className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
              )
            }
          >
            <span>{csvDownloaded ? 'Ledger CSV Saved' : 'Transactions CSV'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPaymentsCsv}
            disabled={payments.length === 0}
            leftIcon={
              paymentsCsvDownloaded ? (
                <Check className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
              ) : (
                <Download className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              )
            }
          >
            <span>{paymentsCsvDownloaded ? 'Payments CSV Saved' : 'Payments CSV'}</span>
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
      <Card className="p-4 space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Period Selector */}
          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
              Reporting Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="w-full h-10 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:border-emerald-500/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
              Transaction Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:border-emerald-500/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="all">All Types (Income + Expenses)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:border-emerald-500/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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

        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-white/[0.08] text-xs text-[#667085] dark:text-[#9AA6B2]">
          <span>
            Selected: <strong className="text-[#17212B] dark:text-[#F5F7FA] font-medium">{filteredTransactions.length}</strong> transactions matching filters.
          </span>
          <span className="flex items-center gap-1.5 text-[#008F62] dark:text-[#00C78A] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Authenticated RLS isolation
          </span>
        </div>
      </Card>

      {/* 3. PRINTABLE FINANCIAL STATEMENT (Optimized for Screen & Browser Print/PDF) */}
      <div className="print-page bg-[#FFFFFF] dark:bg-[#171D23] print:bg-white print:text-black rounded-2xl border border-[#E5E9EF] dark:border-[#303943] print:border print:border-gray-300 fintech-card-shadow print:shadow-none p-6 sm:p-10 space-y-8">
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-white/[0.08] print:border-gray-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Logo size="sm" showText={false} />
              <span className="font-heading font-bold text-xl text-[#17212B] dark:text-[#F5F7FA] print:text-black">
                DuesDock
              </span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] print:text-black tracking-tight">
              Personal Financial Statement
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#9AA6B2] print:text-gray-600 mt-1">
              Period: <strong className="text-[#17212B] dark:text-[#F5F7FA] print:text-black font-semibold">{getPeriodLabel(period)}</strong> • Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className="sm:text-right text-xs text-[#667085] dark:text-[#9AA6B2] print:text-gray-700 space-y-1">
            <div>
              <span className="text-[11px] block opacity-80">Account Owner</span>
              <strong className="text-[#17212B] dark:text-[#F5F7FA] print:text-black text-sm">{profile?.full_name || 'Personal Account'}</strong>
            </div>
            <div>
              <span className="text-[11px] block opacity-80">Account Email</span>
              <span className="font-mono text-[#17212B] dark:text-[#F5F7FA] print:text-black">{user?.email}</span>
            </div>
            <div>
              <span className="text-[11px] block opacity-80">Base Currency</span>
              <strong className="text-[#008F62] dark:text-[#00C78A] print:text-black font-semibold">{currency} ({CURRENCY_SYMBOLS[currency]})</strong>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9AA6B2] print:text-black mb-3">
            1. Executive Cash Flow Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm print:bg-gray-50 border border-slate-200/60 dark:border-white/[0.08] print:border-gray-300 shadow-xs">
              <span className="text-xs font-medium text-[#008F62] dark:text-[#00C78A] print:text-black block">
                Total Inflow (Income)
              </span>
              <span className="font-mono font-bold text-2xl text-[#008F62] dark:text-[#00C78A] print:text-black mt-1 block">
                {formatCurrency(totalIncome, currency)}
              </span>
              <span className="text-[11px] text-[#667085] dark:text-[#9AA6B2] print:text-gray-600 block mt-1">
                {filteredTransactions.filter((t) => t.type === 'income').length} verified deposits
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm print:bg-gray-50 border border-slate-200/60 dark:border-white/[0.08] print:border-gray-300 shadow-xs">
              <span className="text-xs font-medium text-[#DC5252] dark:text-[#FF6666] print:text-black block">
                Total Outflow (Expenses)
              </span>
              <span className="font-mono font-bold text-2xl text-[#DC5252] dark:text-[#FF6666] print:text-black mt-1 block">
                {formatCurrency(totalExpenses, currency)}
              </span>
              <span className="text-[11px] text-[#667085] dark:text-[#9AA6B2] print:text-gray-600 block mt-1">
                {filteredTransactions.filter((t) => t.type === 'expense').length} recorded payments
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm print:bg-gray-50 border border-slate-200/60 dark:border-white/[0.08] print:border-gray-300 shadow-xs">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9AA6B2] print:text-black block">
                Net Cash Flow
              </span>
              <span
                className={`font-mono font-bold text-2xl mt-1 block ${
                  netCashFlow >= 0
                    ? 'text-[#008F62] dark:text-[#00C78A] print:text-black'
                    : 'text-[#DC5252] dark:text-[#FF6666] print:text-black'
                }`}
              >
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow, currency)}
              </span>
              <span className="text-[11px] text-[#667085] dark:text-[#9AA6B2] print:text-gray-600 block mt-1">
                {netCashFlow >= 0 ? 'Surplus balance' : 'Deficit balance'}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        {categoryBreakdown.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9AA6B2] print:text-black mb-3">
              2. Spending Breakdown by Category
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/[0.08] print:border-gray-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-900/50 backdrop-blur-md print:bg-gray-100 font-semibold text-[11px] text-slate-500 dark:text-slate-400 print:text-black border-b border-slate-200/70 dark:border-white/10 print:border-gray-300">
                    <th className="py-3 px-6">Category Name</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6 text-right">Total Amount</th>
                    <th className="py-3 px-6 text-right">% of Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06] print:divide-gray-200">
                  {categoryBreakdown.map((cat, i) => (
                    <tr key={i} className="hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-400/[0.05] print:hover:bg-transparent transition-colors">
                      <td className="py-3 px-6 font-medium text-[#17212B] dark:text-[#F5F7FA] print:text-black">
                        {cat.name}
                      </td>
                      <td className="py-3 px-6 capitalize text-[#667085] dark:text-[#9AA6B2] print:text-gray-700">
                        {cat.type}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-[#17212B] dark:text-[#F5F7FA] print:text-black">
                        {formatCurrency(cat.total, currency)}
                      </td>
                      <td className="py-3 px-6 text-right text-[#667085] dark:text-[#9AA6B2] print:text-gray-700 font-mono">
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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9AA6B2] print:text-black mb-3">
            3. Itemized Ledger ({filteredTransactions.length} items)
          </h3>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#667085] dark:text-[#9AA6B2] bg-[#F7F8FA] dark:bg-[#101418] print:bg-gray-50 rounded-xl border border-slate-200/60 dark:border-white/[0.08] print:border-gray-300">
              No transactions recorded for the selected period and filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/[0.08] print:border-gray-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-900/50 backdrop-blur-md print:bg-gray-100 font-semibold text-[11px] text-slate-500 dark:text-slate-400 print:text-black border-b border-slate-200/70 dark:border-white/10 print:border-gray-300">
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Merchant / Description</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Method</th>
                    <th className="py-3 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06] print:divide-gray-200">
                  {filteredTransactions.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.category_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <tr key={tx.id} className="hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-400/[0.05] print:hover:bg-transparent transition-colors">
                        <td className="py-3 px-6 font-mono text-[#667085] dark:text-[#9AA6B2] print:text-gray-700 whitespace-nowrap">
                          {tx.transaction_date}
                        </td>
                        <td className="py-3 px-6 font-medium text-[#17212B] dark:text-[#F5F7FA] print:text-black">
                          {tx.merchant || (isIncome ? 'Income' : 'Expense')}
                          {tx.notes && (
                            <span className="block text-[11px] text-[#667085] dark:text-[#9AA6B2] print:text-gray-600 font-normal mt-0.5">
                              {tx.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-[#667085] dark:text-[#9AA6B2] print:text-gray-700 whitespace-nowrap">
                          {cat?.name || 'Uncategorized'}
                        </td>
                        <td className="py-3 px-6 text-[#667085] dark:text-[#9AA6B2] print:text-gray-700 whitespace-nowrap capitalize">
                          {tx.payment_method.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-6 text-right font-mono font-semibold whitespace-nowrap">
                          <span className={isIncome ? 'text-[#008F62] dark:text-[#00C78A] print:text-black' : 'text-[#17212B] dark:text-[#F5F7FA] print:text-black'}>
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

        {/* 4. Payment Obligations & Dues Ledger */}
        {payments.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9AA6B2] print:text-black mb-3">
              4. Payment Obligations & Pending Dues ({payments.length} items)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/[0.08] print:border-gray-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-900/50 backdrop-blur-md print:bg-gray-100 font-semibold text-[11px] text-slate-500 dark:text-slate-400 print:text-black border-b border-slate-200/70 dark:border-white/10 print:border-gray-300">
                    <th className="py-3 px-6">Due Date</th>
                    <th className="py-3 px-6">Title & Counterparty</th>
                    <th className="py-3 px-6">Direction</th>
                    <th className="py-3 px-6 text-right">Total Amount</th>
                    <th className="py-3 px-6 text-right">Remaining Balance</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06] print:divide-gray-200">
                  {payments.map((p) => {
                    const remaining = Math.max(0, Number(p.total_amount) - Number(p.paid_amount));
                    return (
                      <tr key={p.id} className="hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-400/[0.05] print:hover:bg-transparent transition-colors">
                        <td className="py-3 px-6 font-mono text-[#667085] dark:text-[#9AA6B2] print:text-gray-700 whitespace-nowrap">
                          {p.due_date}
                        </td>
                        <td className="py-3 px-6 font-medium text-[#17212B] dark:text-[#F5F7FA] print:text-black">
                          {p.title}
                          <span className="block text-[11px] text-[#667085] dark:text-[#9AA6B2] print:text-gray-600 font-normal mt-0.5">
                            {p.party_name}
                          </span>
                        </td>
                        <td className="py-3 px-6 capitalize text-[#667085] dark:text-[#9AA6B2] print:text-gray-700">
                          {p.direction}
                        </td>
                        <td className="py-3 px-6 text-right font-mono text-[#17212B] dark:text-[#F5F7FA] print:text-black">
                          {formatCurrency(p.total_amount, currency)}
                        </td>
                        <td className="py-3 px-6 text-right font-mono font-semibold text-[#DC5252] dark:text-[#FF6666] print:text-black">
                          {formatCurrency(remaining, currency)}
                        </td>
                        <td className="py-3 px-6 capitalize font-medium text-[#667085] dark:text-[#9AA6B2] print:text-gray-700">
                          {p.status.replace('_', ' ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statement Footer */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-white/[0.08] print:border-gray-300 text-xs text-[#667085] dark:text-[#9AA6B2] print:text-black flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>DuesDock Personal Finance • Cryptographically secure records</span>
          <span>End of Statement</span>
        </div>
      </div>
    </div>
  );
};
