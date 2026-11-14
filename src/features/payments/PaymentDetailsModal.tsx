import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PaymentDirectionBadge, PaymentStatusBadge, PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { paymentService } from '@/services/paymentService';
import type { Payment, PaymentRecord, Category, CurrencyCode } from '@/types/database.types';
import {
  Calendar,
  Building,
  FileText,
  Trash2,
  Plus,
  Loader2,
  Clock,
  History,
} from 'lucide-react';

export interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  payment: Payment | null;
  currency: CurrencyCode;
  categories: Category[];
  onOpenRecordPayment: (payment: Payment) => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (payment: Payment) => void;
  onRefresh: () => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  payment,
  currency,
  categories,
  onOpenRecordPayment,
  onEditPayment,
  onDeletePayment,
  onRefresh,
}) => {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  const loadRecords = async () => {
    if (!payment) return;
    try {
      setIsLoadingRecords(true);
      const data = await paymentService.getPaymentRecords(userId, payment.id);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (payment && isOpen) {
      loadRecords();
    }
  }, [payment, isOpen]);

  if (!payment) return null;

  const category = categories.find((c) => c.id === payment.category_id);
  const total = Number(payment.total_amount);
  const paid = Number(payment.paid_amount);
  const remaining = Math.max(0, total - paid);
  const percentPaid = total > 0 ? (paid / total) * 100 : 0;
  const isPayable = payment.direction === 'payable';

  const handleDeleteInstallment = async (recordId: string) => {
    if (!confirm('Are you sure you want to remove this payment installment? This will increase the remaining balance.')) {
      return;
    }
    try {
      setDeletingRecordId(recordId);
      await paymentService.deletePaymentRecord(userId, payment.id, recordId);
      await loadRecords();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to remove installment');
    } finally {
      setDeletingRecordId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Obligation Details"
      description="View full obligation status, deadlines, and payment history."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Top Header Card */}
        <div className="p-5 bg-[#F7F8FA] dark:bg-[#101418] rounded-xl border border-[#E5E9EF] dark:border-[#303943] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <PaymentDirectionBadge direction={payment.direction} />
              <PaymentStatusBadge status={payment.status} />
              {category && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] font-medium text-[#17212B] dark:text-[#F5F7FA]">
                  {category.name}
                </span>
              )}
            </div>
            <h2 className="text-xl font-heading font-bold text-[#17212B] dark:text-[#F5F7FA]">
              {payment.title}
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>{isPayable ? 'Payable to' : 'Receivable from'}: <strong>{payment.party_name}</strong></span>
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-[#E5E9EF] sm:dark:border-[#303943] sm:pl-5">
            <span className="text-xs text-[#667085] dark:text-[#9AA6B2] block">Total Obligation</span>
            <span className="text-2xl font-mono font-bold text-[#17212B] dark:text-[#F5F7FA]">
              {formatCurrency(total, currency)}
            </span>
          </div>
        </div>

        {/* Financial Progress Bar */}
        <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#667085] dark:text-[#9AA6B2]">Settlement Progress:</span>
              <span className="font-semibold text-[#17212B] dark:text-[#F5F7FA]">
                {Math.round(percentPaid)}% Paid
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-[#008F62] dark:text-[#00C78A] font-medium">
                Paid: {formatCurrency(paid, currency)}
              </span>
              <span className="text-[#DC5252] dark:text-[#FF6666] font-semibold">
                Remaining: {formatCurrency(remaining, currency)}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#F1F4F6] dark:bg-[#202830] rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
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

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-1">
            <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px] font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Due Date
            </span>
            <span className="font-mono font-semibold text-[#17212B] dark:text-[#F5F7FA] block text-sm">
              {payment.due_date}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-1">
            <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px] font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Created Date
            </span>
            <span className="font-mono text-[#17212B] dark:text-[#F5F7FA] block text-sm">
              {payment.created_at.split('T')[0]}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-1">
            <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px] font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Counterparty
            </span>
            <span className="font-semibold text-[#17212B] dark:text-[#F5F7FA] block text-sm truncate">
              {payment.party_name}
            </span>
          </div>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] text-xs space-y-1">
            <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px] font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Description & Notes
            </span>
            <p className="text-[#17212B] dark:text-[#F5F7FA] whitespace-pre-line text-xs">
              {payment.notes}
            </p>
          </div>
        )}

        {/* Payment History / Installments Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
              <h3 className="font-heading font-semibold text-sm text-[#17212B] dark:text-[#F5F7FA]">
                Payment Installments & History ({records.length})
              </h3>
            </div>

            {remaining > 0 && payment.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenRecordPayment(payment)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Record Payment
              </Button>
            )}
          </div>

          {isLoadingRecords ? (
            <div className="p-6 text-center text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#008F62] dark:text-[#00C78A]" />
              <span>Loading payment history...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#667085] dark:text-[#9AA6B2] border border-dashed border-[#E5E9EF] dark:border-[#303943] rounded-xl">
              No payments recorded yet against this obligation.
            </div>
          ) : (
            <div className="border border-[#E5E9EF] dark:border-[#303943] rounded-xl overflow-hidden divide-y divide-[#E5E9EF] dark:divide-[#303943] bg-[#FFFFFF] dark:bg-[#171D23]">
              {records.map((r) => (
                <div key={r.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#F7F8FA] dark:hover:bg-[#101418] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#008F62] dark:text-[#00C78A]">
                        {formatCurrency(r.amount, currency)}
                      </span>
                      <PaymentMethodBadge method={r.payment_method} />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#667085] dark:text-[#9AA6B2]">
                      <span className="font-mono">{r.payment_date}</span>
                      {r.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-xs">{r.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteInstallment(r.id)}
                    disabled={deletingRecordId === r.id}
                    className="p-1.5 text-[#667085] hover:text-[#DC5252] dark:text-[#9AA6B2] dark:hover:text-[#FF6666] transition-colors cursor-pointer"
                    title="Remove Installment"
                  >
                    {deletingRecordId === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEditPayment(payment);
              }}
            >
              Edit Obligation
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[#DC5252] dark:text-[#FF6666] hover:bg-[#DC5252]/10"
              onClick={() => {
                onClose();
                onDeletePayment(payment);
              }}
            >
              Delete
            </Button>
          </div>

          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
