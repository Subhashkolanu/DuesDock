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
  ArrowUpDown,
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

  // Financial Calculations
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

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search filter
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchMerchant = t.merchant?.toLowerCase().includes(query);
          const matchNotes = t.notes?.toLowerCase().includes(query);
          const cat = categories.find((c) => c.id === t.category_id);
          const matchCat = cat?.name.toLowerCase().includes(query);
          if (!matchMerchant && !matchNotes && !matchCat) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false;

        // Date filter
        const txDate = new Date(t.transaction_date);
        const now = new Date();

        if (dateFilter === 'this_month') {
          return (
            txDate.getFullYear() === now.getFullYear() &&
            txDate.getMonth() === now.getMonth()
          );
        }

        if (dateFilter === 'last_month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return (
            txDate.getFullYear() === lastMonth.getFullYear() &&
            txDate.getMonth() === lastMonth.getMonth()
          );
        }

        if (dateFilter === 'last_30_days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return txDate >= thirtyDaysAgo;
        }

        if (dateFilter === 'this_year') {
          return txDate.getFullYear() === now.getFullYear();
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

  // Handlers
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
          <h1 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
            Transactions & Ledgers
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
            Record, categorize, and audit all personal income deposits and expenditures
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
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
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085] dark:text-[#9AA6B2]">
            <span>Total Inflow (Income)</span>
            <div className="p-2 rounded-lg bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#008F62] dark:text-[#00C78A] mt-3">
            {formatCurrency(totalIncome, currency)}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
            {transactions.filter((t) => t.type === 'income').length} deposits logged
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085] dark:text-[#9AA6B2]">
            <span>Total Outflow (Expenses)</span>
            <div className="p-2 rounded-lg bg-[#DC5252]/10 dark:bg-[#FF6666]/15 text-[#DC5252] dark:text-[#FF6666]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#DC5252] dark:text-[#FF6666] mt-3">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
            {transactions.filter((t) => t.type === 'expense').length} payments made
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085] dark:text-[#9AA6B2]">
            <span>Net Cash Flow</span>
            <div className="p-2 rounded-lg bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-mono font-bold mt-3 ${
              netCashFlow >= 0 ? 'text-[#008F62] dark:text-[#00C78A]' : 'text-[#DC5252] dark:text-[#FF6666]'
            }`}
          >
            {formatCurrency(netCashFlow, currency)}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
            {netCashFlow >= 0 ? 'Surplus savings cushion' : 'Expenditure exceeds income'}
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
              className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:border-[#008F62] dark:focus:border-[#00C78A] focus:outline-none"
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
              className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:border-[#008F62] dark:focus:border-[#00C78A] focus:outline-none"
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
              className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:border-[#008F62] dark:focus:border-[#00C78A] focus:outline-none"
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
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5E9EF] dark:border-[#303943] text-xs">
          <div className="flex items-center gap-2 text-[#667085] dark:text-[#9AA6B2]">
            <span>
              Showing <strong className="text-[#17212B] dark:text-[#F5F7FA] font-semibold">{filteredTransactions.length}</strong> of {transactions.length} items
            </span>
            {(search || typeFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-[#DC5252] dark:text-[#FF6666] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer ml-2"
              >
                <X className="w-3.5 h-3.5" /> Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[#17212B] dark:text-[#F5F7FA]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#008F62] dark:text-[#00C78A]" />
            <span className="text-xs text-[#667085] dark:text-[#9AA6B2]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-2 py-1 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:outline-none"
            >
              <option value="date_desc">Date: Newest</option>
              <option value="date_asc">Date: Oldest</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transaction Records List */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#008F62] dark:text-[#00C78A]" />
          <span>Loading transactions...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border border-dashed border-[#E5E9EF] dark:border-[#303943]">
          <div className="w-12 h-12 rounded-xl bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA]">
            No Transactions Match Your Filters
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] max-w-sm mx-auto">
            Try adjusting your search criteria, clearing active filters, or adding a new transaction.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] text-[11px] font-semibold text-[#667085] dark:text-[#9AA6B2]">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Merchant / Description</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Receipt</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9EF] dark:divide-[#303943]">
                {filteredTransactions.map((tx) => {
                  const category = categories.find((c) => c.id === tx.category_id);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#F1F4F6]/60 dark:hover:bg-[#202830]/60 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-mono text-[#667085] dark:text-[#9AA6B2] whitespace-nowrap">
                        {tx.transaction_date}
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <TransactionTypeBadge type={tx.type} />
                      </td>

                      <td className="py-3.5 px-6 font-medium text-[#17212B] dark:text-[#F5F7FA]">
                        <div>{tx.merchant || (isIncome ? 'Income Deposit' : 'Expense Payment')}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-[#667085] dark:text-[#9AA6B2] truncate max-w-xs font-normal">
                            {tx.notes}
                          </div>
                        )}
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

                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        {tx.receipt_path ? (
                          <button
                            onClick={() => setViewingTransaction(tx)}
                            className="inline-flex items-center text-[#008F62] dark:text-[#00C78A] hover:opacity-80 p-1 rounded-md"
                            title="View Attached Receipt"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[#667085]/40 dark:text-[#9AA6B2]/40">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingTransaction(tx)}
                            className="p-1.5 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors"
                            title="Audit Record Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#008F62] dark:hover:text-[#00C78A] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTransaction(tx)}
                            className="p-1.5 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#DC5252] dark:hover:text-[#FF6666] hover:bg-[#DC5252]/10 transition-colors"
                            title="Delete Transaction"
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

          {/* Mobile Stacked Card View */}
          <div className="md:hidden divide-y divide-[#E5E9EF] dark:divide-[#303943]">
            {filteredTransactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.category_id);
              const isIncome = tx.type === 'income';

              return (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-[#17212B] dark:text-[#F5F7FA]">
                        {tx.merchant || (isIncome ? 'Income Deposit' : 'Expense Payment')}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#667085] dark:text-[#9AA6B2]">
                        <span className="font-mono">{tx.transaction_date}</span>
                        <span>•</span>
                        <span>{category?.name || 'Uncategorized'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-base ${isIncome ? 'text-[#008F62] dark:text-[#00C78A]' : 'text-[#17212B] dark:text-[#F5F7FA]'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                      </div>
                      <TransactionTypeBadge type={tx.type} className="mt-1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E9EF]/60 dark:border-[#303943]/60 text-xs">
                    <PaymentMethodBadge method={tx.payment_method} />

                    <div className="flex items-center gap-1">
                      {tx.receipt_path && (
                        <button
                          onClick={() => setViewingTransaction(tx)}
                          className="p-1.5 rounded-md text-[#008F62] dark:text-[#00C78A]"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingTransaction(tx);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 rounded-md text-[#667085] dark:text-[#9AA6B2]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingTransaction(tx)}
                        className="p-1.5 rounded-md text-[#DC5252] dark:text-[#FF6666]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Transaction Add / Edit Modal */}
      {isAddModalOpen && (
        <TransactionModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
          userId={user?.id || ''}
          currency={currency}
          categories={categories}
          editingTransaction={editingTransaction}
          onTransactionSaved={loadData}
          onCategoryAdded={(newCat) => setCategories((prev) => [...prev, newCat])}
        />
      )}

      {/* Transaction Detail View Modal */}
      {viewingTransaction && (
        <TransactionDetailsModal
          isOpen={Boolean(viewingTransaction)}
          onClose={() => setViewingTransaction(null)}
          transaction={viewingTransaction}
          currency={currency}
          categories={categories}
          onEdit={(tx) => {
            setViewingTransaction(null);
            setEditingTransaction(tx);
            setIsAddModalOpen(true);
          }}
          onDelete={(tx) => {
            setViewingTransaction(null);
            setDeletingTransaction(tx);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTransaction && (
        <DeleteConfirmDialog
          isOpen={Boolean(deletingTransaction)}
          onClose={() => setDeletingTransaction(null)}
          transaction={deletingTransaction}
          currency={currency}
          onConfirmDelete={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};
