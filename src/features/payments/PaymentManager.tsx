import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { paymentService, PAYMENT_UPDATED_EVENT } from '@/services/paymentService';
import { transactionService } from '@/services/transactionService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PaymentDirectionBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS, getCurrentMonthKey } from '@/lib/utils';
import { PaymentModal } from './PaymentModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import type { Payment, Category, PaymentDirection, PaymentStatus, CurrencyCode } from '@/types/database.types';
import {
  Search,
  Plus,
  ArrowUpDown,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Building,
  Loader2,
  X,
  CreditCard,
  Calendar,
} from 'lucide-react';

export const PaymentManager: React.FC = () => {
  const { user, profile } = useAuth();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';

  // Data State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | PaymentDirection>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'overdue' | 'due_7_days' | 'due_month'>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'amount_desc' | 'remaining_desc'>('date_asc');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [recordingPayment, setRecordingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setFetchError(null);
      const [payList, catList] = await Promise.all([
        paymentService.getPayments(user.id),
        transactionService.getCategories(user.id),
      ]);
      setPayments(payList);
      setCategories(catList);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(PAYMENT_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(PAYMENT_UPDATED_EVENT, handleUpdate);
    };
  }, [user]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let totalPayableObligation = 0;
    let payablePaid = 0;
    let totalReceivableObligation = 0;
    let receivablePaid = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    payments.forEach((p) => {
      const total = Number(p.total_amount);
      const paid = Number(p.paid_amount);
      const remaining = Math.max(0, total - paid);

      if (p.direction === 'payable') {
        totalPayableObligation += total;
        payablePaid += paid;
      } else {
        totalReceivableObligation += total;
        receivablePaid += paid;
      }

      if (p.status === 'overdue' || (p.due_date < today && p.status !== 'paid' && p.status !== 'cancelled')) {
        overdueCount += 1;
        overdueAmount += remaining;
      }
    });

    const outstandingPayable = Math.max(0, totalPayableObligation - payablePaid);
    const outstandingReceivable = Math.max(0, totalReceivableObligation - receivablePaid);
    const netOutstanding = outstandingReceivable - outstandingPayable;

    return {
      outstandingPayable,
      payablePaid,
      outstandingReceivable,
      receivablePaid,
      netOutstanding,
      overdueCount,
      overdueAmount,
    };
  }, [payments]);

  // Filtered and Sorted Payments
  const filteredPayments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];
    const currentMonthKey = getCurrentMonthKey();

    return payments
      .filter((p) => {
        // Search
        if (search.trim()) {
          const query = search.trim().toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(query);
          const matchParty = p.party_name.toLowerCase().includes(query);
          const matchNotes = p.notes?.toLowerCase().includes(query);
          const matchAmount = String(p.total_amount).includes(query);
          if (!matchTitle && !matchParty && !matchNotes && !matchAmount) return false;
        }

        // Direction
        if (directionFilter !== 'all' && p.direction !== directionFilter) return false;

        // Status
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;

        // Deadline
        if (deadlineFilter === 'overdue') {
          if (p.status !== 'overdue' && !(p.due_date < today && p.status !== 'paid' && p.status !== 'cancelled')) {
            return false;
          }
        } else if (deadlineFilter === 'due_7_days') {
          if (p.due_date < today || p.due_date > sevenDaysStr || p.status === 'paid' || p.status === 'cancelled') {
            return false;
          }
        } else if (deadlineFilter === 'due_month') {
          if (!p.due_date.startsWith(currentMonthKey)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') {
          return a.due_date.localeCompare(b.due_date);
        }
        if (sortBy === 'date_desc') {
          return b.due_date.localeCompare(a.due_date);
        }
        if (sortBy === 'amount_desc') {
          return Number(b.total_amount) - Number(a.total_amount);
        }
        if (sortBy === 'remaining_desc') {
          const remA = Number(a.total_amount) - Number(a.paid_amount);
          const remB = Number(b.total_amount) - Number(b.paid_amount);
          return remB - remA;
        }
        return 0;
      });
  }, [payments, search, directionFilter, statusFilter, deadlineFilter, sortBy]);

  const handleDeleteConfirm = async (id: string) => {
    if (!user || isDeleting) return;
    try {
      setIsDeleting(true);
      await paymentService.deletePayment(user.id, id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      setDeletingPayment(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDirectionFilter('all');
    setStatusFilter('all');
    setDeadlineFilter('all');
    setSortBy('date_asc');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
            Payments & Dues Tracker
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
            Manage upcoming obligations, receivables, installment settlements, and payment deadlines
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingPayment(null);
            setIsCreateModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Payment Obligation
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Payable */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085] dark:text-[#9AA6B2]">
            <span>Outstanding Payables</span>
            <div className="p-2 rounded-lg bg-[#DC5252]/10 dark:bg-[#FF6666]/15 text-[#DC5252] dark:text-[#FF6666]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#DC5252] dark:text-[#FF6666] mt-3">
            {formatCurrency(metrics.outstandingPayable, currency)}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
            Settled: {formatCurrency(metrics.payablePaid, currency)}
          </p>
        </Card>

        {/* Outstanding Receivable */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085] dark:text-[#9AA6B2]">
            <span>Expected Receivables</span>
            <div className="p-2 rounded-lg bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#008F62] dark:text-[#00C78A] mt-3">
            {formatCurrency(metrics.outstandingReceivable, currency)}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
            Collected: {formatCurrency(metrics.receivablePaid, currency)}
          </p>
        </Card>

        {/* Net Outstanding Balance */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#667085] dark:text-[#9AA6B2]">
            <span>Net Pending Balance</span>
            <div className="p-2 rounded-lg bg-[#0284C7]/10 dark:bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-mono font-bold mt-3 ${
              metrics.netOutstanding >= 0
                ? 'text-[#008F62] dark:text-[#00C78A]'
                : 'text-[#DC5252] dark:text-[#FF6666]'
            }`}
          >
            {metrics.netOutstanding >= 0 ? '+' : ''}
            {formatCurrency(metrics.netOutstanding, currency)}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
            {metrics.netOutstanding >= 0 ? 'Net positive inflow expected' : 'Net obligations exceed receivables'}
          </p>
        </Card>

        {/* Overdue Alert Card */}
        <Card className={`p-5 ${metrics.overdueCount > 0 ? 'border-[#DC5252]/40 bg-[#DC5252]/5 dark:bg-[#DC5252]/10' : ''}`}>
          <div className="flex items-center justify-between text-xs font-medium text-[#667085] dark:text-[#9AA6B2]">
            <span>Overdue Obligations</span>
            <div className={`p-2 rounded-lg ${metrics.overdueCount > 0 ? 'bg-[#DC5252]/20 text-[#DC5252] dark:text-[#FF6666]' : 'bg-[#F1F4F6] dark:bg-[#202830] text-[#667085]'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#DC5252] dark:text-[#FF6666] mt-3">
            {metrics.overdueCount}
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
            {metrics.overdueCount > 0
              ? `${formatCurrency(metrics.overdueAmount, currency)} past deadline`
              : 'All obligations on track'}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search title, party, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftElement={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Direction Filter */}
          <div>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:border-emerald-500/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            >
              <option value="all">All Directions</option>
              <option value="payable">Payable (Money to Pay)</option>
              <option value="receivable">Receivable (Money to Receive)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:border-emerald-500/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Deadline Filter */}
          <div>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:border-emerald-500/60 dark:focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            >
              <option value="all">All Deadlines</option>
              <option value="overdue">Overdue Only</option>
              <option value="due_7_days">Due Next 7 Days</option>
              <option value="due_month">Due This Month</option>
            </select>
          </div>
        </div>

        {/* Sub-toolbar: Active Filter Tags & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-white/[0.08] text-xs">
          <div className="flex items-center gap-2 text-[#667085] dark:text-[#9AA6B2]">
            <span>
              Showing <strong className="text-[#17212B] dark:text-[#F5F7FA] font-semibold">{filteredPayments.length}</strong> of {payments.length} obligations
            </span>
            {(search || directionFilter !== 'all' || statusFilter !== 'all' || deadlineFilter !== 'all') && (
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
              className="h-8 rounded-lg border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:border-emerald-500/60 focus:outline-none transition-all"
            >
              <option value="date_asc">Deadline: Earliest First</option>
              <option value="date_desc">Deadline: Latest First</option>
              <option value="remaining_desc">Remaining: High to Low</option>
              <option value="amount_desc">Total Amount: High to Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-[#DC5252]/10 border border-[#DC5252]/20 text-xs text-[#DC5252] dark:text-[#FF6666] flex items-center justify-between">
          <span>{fetchError}</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* Payment Obligations List */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#008F62] dark:text-[#00C78A]" />
          <span>Loading payment obligations...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border border-dashed border-slate-200/70 dark:border-white/15">
          <div className="w-12 h-12 rounded-xl bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA]">
            No Payment Obligations Found
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] max-w-sm mx-auto">
            {payments.length === 0
              ? 'Start tracking payables, client invoices, and debt repayments to keep your cash flow healthy.'
              : 'Try adjusting your search criteria or resetting active filters.'}
          </p>
          <div className="pt-2">
            {payments.length === 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Your First Obligation
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/70 dark:border-white/10 bg-slate-100/60 dark:bg-slate-900/50 backdrop-blur-md text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Title & Counterparty</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Remaining</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                {filteredPayments.map((p) => {
                  const total = Number(p.total_amount);
                  const paid = Number(p.paid_amount);
                  const remaining = Math.max(0, total - paid);
                  const percentPaid = total > 0 ? (paid / total) * 100 : 0;
                  const isPayable = p.direction === 'payable';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-400/[0.05] transition-colors group cursor-pointer"
                      onClick={() => setViewingPayment(p)}
                    >
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-[#17212B] dark:text-[#F5F7FA]">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2] flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            <span>{p.party_name}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <PaymentDirectionBadge direction={p.direction} />
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5 font-mono">
                          <span className="font-semibold text-[#17212B] dark:text-[#F5F7FA] block">
                            {p.due_date}
                          </span>
                          {p.status === 'overdue' && (
                            <span className="text-[10px] text-[#DC5252] dark:text-[#FF6666] font-sans font-medium flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-[#17212B] dark:text-[#F5F7FA]">
                        {formatCurrency(total, currency)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="space-y-1">
                          <span
                            className={`font-mono font-bold block ${
                              remaining > 0
                                ? isPayable
                                  ? 'text-[#DC5252] dark:text-[#FF6666]'
                                  : 'text-[#008F62] dark:text-[#00C78A]'
                                : 'text-[#667085] dark:text-[#9AA6B2]'
                            }`}
                          >
                            {formatCurrency(remaining, currency)}
                          </span>
                          <div className="w-24 ml-auto bg-[#F1F4F6] dark:bg-[#202830] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percentPaid >= 100
                                  ? 'bg-[#008F62] dark:bg-[#00C78A]'
                                  : percentPaid > 0
                                  ? 'bg-[#D99A27] dark:bg-[#F0B94B]'
                                  : 'bg-[#667085]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <PaymentStatusBadge status={p.status} />
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {remaining > 0 && p.status !== 'cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => setRecordingPayment(p)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#008F62] dark:text-[#00C78A]" />}
                            >
                              Pay
                            </Button>
                          )}
                          <button
                            onClick={() => setViewingPayment(p)}
                            className="p-1.5 text-[#667085] hover:text-[#008F62] dark:text-[#9AA6B2] dark:hover:text-[#00C78A] transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPayment(p);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 text-[#667085] hover:text-[#17212B] dark:text-[#9AA6B2] dark:hover:text-[#F5F7FA] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPayment(p)}
                            className="p-1.5 text-[#667085] hover:text-[#DC5252] dark:text-[#9AA6B2] dark:hover:text-[#FF6666] transition-colors cursor-pointer"
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

          {/* Mobile Card List View */}
          <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06] md:hidden">
            {filteredPayments.map((p) => {
              const total = Number(p.total_amount);
              const paid = Number(p.paid_amount);
              const remaining = Math.max(0, total - paid);
              const percentPaid = total > 0 ? (paid / total) * 100 : 0;
              const isPayable = p.direction === 'payable';

              return (
                <div
                  key={p.id}
                  className="p-4 space-y-3 cursor-pointer hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-400/[0.05] transition-colors"
                  onClick={() => setViewingPayment(p)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PaymentDirectionBadge direction={p.direction} />
                        <PaymentStatusBadge status={p.status} />
                      </div>
                      <h3 className="font-heading font-semibold text-sm text-[#17212B] dark:text-[#F5F7FA]">
                        {p.title}
                      </h3>
                      <p className="text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>{p.party_name}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#667085] dark:text-[#9AA6B2] block">Remaining</span>
                      <span
                        className={`font-mono font-bold text-base ${
                          remaining > 0
                            ? isPayable
                              ? 'text-[#DC5252] dark:text-[#FF6666]'
                              : 'text-[#008F62] dark:text-[#00C78A]'
                            : 'text-[#667085] dark:text-[#9AA6B2]'
                        }`}
                      >
                        {formatCurrency(remaining, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-[#9AA6B2]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Due: {p.due_date}
                      </span>
                      <span>Total: {formatCurrency(total, currency)}</span>
                    </div>
                    <div className="w-full bg-[#F1F4F6] dark:bg-[#202830] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentPaid >= 100
                            ? 'bg-[#008F62] dark:bg-[#00C78A]'
                            : percentPaid > 0
                            ? 'bg-[#D99A27] dark:bg-[#F0B94B]'
                            : 'bg-[#667085]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
                      />
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div
                    className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {remaining > 0 && p.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setRecordingPayment(p)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#008F62] dark:text-[#00C78A]" />}
                      >
                        Record Payment
                      </Button>
                    )}
                    <button
                      onClick={() => {
                        setEditingPayment(p);
                        setIsCreateModalOpen(true);
                      }}
                      className="p-1.5 text-[#667085] hover:text-[#17212B] dark:text-[#9AA6B2] dark:hover:text-[#F5F7FA]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingPayment(p)}
                      className="p-1.5 text-[#667085] hover:text-[#DC5252] dark:text-[#9AA6B2] dark:hover:text-[#FF6666]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modals */}
      {isCreateModalOpen && user && (
        <PaymentModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPayment(null);
          }}
          userId={user.id}
          currency={currency}
          categories={categories}
          editingPayment={editingPayment}
          onPaymentSaved={loadData}
        />
      )}

      {recordingPayment && user && (
        <RecordPaymentModal
          isOpen={Boolean(recordingPayment)}
          onClose={() => setRecordingPayment(null)}
          userId={user.id}
          currency={currency}
          payment={recordingPayment}
          onPaymentRecorded={loadData}
        />
      )}

      {viewingPayment && user && (
        <PaymentDetailsModal
          isOpen={Boolean(viewingPayment)}
          onClose={() => setViewingPayment(null)}
          userId={user.id}
          payment={viewingPayment}
          currency={currency}
          categories={categories}
          onOpenRecordPayment={(p) => {
            setViewingPayment(null);
            setRecordingPayment(p);
          }}
          onEditPayment={(p) => {
            setViewingPayment(null);
            setEditingPayment(p);
            setIsCreateModalOpen(true);
          }}
          onDeletePayment={(p) => {
            setViewingPayment(null);
            setDeletingPayment(p);
          }}
          onRefresh={loadData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] dark:bg-[#171D23] border border-[#E5E9EF] dark:border-[#303943] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#DC5252]/10 text-[#DC5252] dark:text-[#FF6666]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA]">
                  Delete Obligation?
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2]">
                  This will remove the payment and all associated installment history.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F7F8FA] dark:bg-[#101418] rounded-xl border border-[#E5E9EF] dark:border-[#303943] text-xs">
              <p className="font-semibold text-[#17212B] dark:text-[#F5F7FA]">
                {deletingPayment.title}
              </p>
              <p className="text-[#667085] dark:text-[#9AA6B2]">
                {formatCurrency(deletingPayment.total_amount, currency)} • {deletingPayment.party_name}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPayment(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-[#DC5252] hover:bg-[#C93B3B] dark:bg-[#FF6666] dark:hover:bg-[#E55555] text-white"
                onClick={() => handleDeleteConfirm(deletingPayment.id)}
                isLoading={isDeleting}
              >
                Delete Obligation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
