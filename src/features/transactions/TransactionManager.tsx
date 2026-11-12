import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { transactionService } from '@/services/transactionService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TransactionTypeBadge, PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS } from '@/lib/utils';
import { TransactionModal } from './TransactionModal';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Transaction, Category, TransactionType, PaymentMethod } from '@/types/database.types';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Calendar,
  Paperclip,
  Trash2,
  Edit2,
  Eye,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Loader2,
  X,
} from 'lucide-react';

export const TransactionManager: React.FC = () => {
  const { user, profile } = useAuth();
  const currency = profile?.preferred_currency || 'USD';

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'last_30_days' | 'this_year'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setFetchError(err.message || 'Failed to load transaction data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Financial Calculations (Calculated dynamically using the user's preferred currency)
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const netCashFlow = totalIncome - totalExpenses;

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search filter (merchant, notes, category name)
        const cat = categories.find((c) => c.id === t.category_id);
        const searchTarget = `${t.merchant || ''} ${t.notes || ''} ${cat?.name || ''}`.toLowerCase();
        if (search && !searchTarget.includes(search.toLowerCase())) {
          return false;
        }

        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && t.category_id !== categoryFilter) {
          return false;
        }

        // Date range filter
        if (dateFilter !== 'all') {
          const txDate = new Date(t.transaction_date);
          const now = new Date();

          if (dateFilter === 'this_month') {
            if (
              txDate.getFullYear() !== now.getFullYear() ||
              txDate.getMonth() !== now.getMonth()
            ) {
              return false;
            }
          } else if (dateFilter === 'last_month') {
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            if (
              txDate.getFullYear() !== lastMonthDate.getFullYear() ||
              txDate.getMonth() !== lastMonthDate.getMonth()
            ) {
              return false;
            }
          } else if (dateFilter === 'last_30_days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            if (txDate < thirtyDaysAgo) return false;
          } else if (dateFilter === 'this_year') {
            if (txDate.getFullYear() !== now.getFullYear()) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
        }
        if (sortBy === 'amount_desc') {
          return Number(b.amount) - Number(a.amount);
        }
        if (sortBy === 'amount_asc') {
          return Number(a.amount) - Number(b.amount);
        }
        return 0;
      });
  }, [transactions, categories, search, typeFilter, categoryFilter, dateFilter, sortBy]);

  const handleDeleteConfirm = async (id: string) => {
    if (!user) return;
    try {
      setIsDeleting(true);
      await transactionService.deleteTransaction(user.id, id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setDeletingTransaction(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setSortBy('date_desc');
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Transactions & Cash Flow
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record, categorize, and audit all personal income deposits and expenses.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Transaction
        </Button>
      </div>

      {/* Cash Flow Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Total Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2 font-mono">
            {formatCurrency(totalIncome, currency)}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            {transactions.filter((t) => t.type === 'income').length} deposits recorded
          </p>
        </Card>

        <Card className="p-4 border-rose-100 bg-rose-50/40">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
            <span>Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-2 font-mono">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <p className="text-[11px] text-rose-700 mt-1">
            {transactions.filter((t) => t.type === 'expense').length} payments made
          </p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Net Cash Flow</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-2xl font-black mt-2 font-mono ${
              netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netCashFlow, currency)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {netCashFlow >= 0 ? 'Positive savings cushion' : 'Expenditure exceeds income'}
          </p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search merchant, notes, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftElement={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Dates</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        </div>

        {/* Sub-toolbar: Active Filter Tags & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>
              Showing {filteredTransactions.length} of {transactions.length} records
            </span>
            {(search || typeFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="date_desc">Date: Newest to Oldest</option>
              <option value="date_asc">Date: Oldest to Newest</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Transactions Table & Card View */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Loading transactions...</span>
          </div>
        ) : fetchError ? (
          <div className="p-8 text-center text-xs text-rose-600">
            <p className="font-semibold">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={loadData} className="mt-3">
              Retry
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          /* Clean Empty State: User has 0 total transactions */
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No Transactions Recorded Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your financial ledger is completely empty. Record your first salary deposit, grocery run, or subscription.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add First Transaction
            </Button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          /* Filter Empty State: Results filtered out */
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              No transactions match your search or filter criteria.
            </p>
            <p className="text-xs text-slate-400">
              Try adjusting your date range, type, or search query.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Merchant / Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const category = categories.find((c) => c.id === tx.category_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setViewingTransaction(tx)}
                      >
                        <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {tx.merchant || (isIncome ? 'Income Deposit' : 'Expense Payment')}
                          </div>
                          {tx.notes && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {tx.notes}
                            </div>
                          )}
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

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {tx.receipt_path ? (
                            <span
                              className="inline-flex items-center text-emerald-600 bg-emerald-50 p-1 rounded-md"
                              title="Receipt Attached"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingTransaction(tx)}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingTransaction(tx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.category_id);
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className="p-4 space-y-2 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    onClick={() => setViewingTransaction(tx)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {tx.merchant || (isIncome ? 'Income Deposit' : 'Expense Payment')}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(tx.transaction_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isIncome ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {category && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border"
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
                        )}
                        <PaymentMethodBadge method={tx.payment_method} />
                        {tx.receipt_path && (
                          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-0.5">
                            <Paperclip className="w-3 h-3" /> Receipt
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {user && (
        <>
          <TransactionModal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingTransaction(null);
            }}
            userId={user.id}
            currency={currency}
            categories={categories}
            editingTransaction={editingTransaction}
            onTransactionSaved={loadData}
            onCategoryAdded={(newCat) => setCategories((prev) => [...prev, newCat])}
          />

          <TransactionDetailsModal
            isOpen={Boolean(viewingTransaction)}
            onClose={() => setViewingTransaction(null)}
            transaction={viewingTransaction}
            currency={currency}
            categories={categories}
            onEdit={(tx) => {
              setEditingTransaction(tx);
              setIsAddModalOpen(true);
            }}
            onDelete={(tx) => setDeletingTransaction(tx)}
          />

          <DeleteConfirmDialog
            isOpen={Boolean(deletingTransaction)}
            onClose={() => setDeletingTransaction(null)}
            transaction={deletingTransaction}
            currency={currency}
            onConfirmDelete={handleDeleteConfirm}
            isDeleting={isDeleting}
          />
        </>
      )}
    </div>
  );
};
