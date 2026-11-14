import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, CURRENCY_SYMBOLS } from '@/lib/utils';
import type { Payment, PaymentMethod, CurrencyCode } from '@/types/database.types';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currency: CurrencyCode;
  payment: Payment | null;
  onPaymentRecorded: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  userId,
  currency,
  payment,
  onPaymentRecorded,
}) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const remainingBalance = payment
    ? Math.max(0, Number(payment.total_amount) - Number(payment.paid_amount))
    : 0;

  useEffect(() => {
    if (payment) {
      setAmount(String(remainingBalance.toFixed(2)));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('bank_transfer');
      setNotes('');
    }
    setErrorMessage(null);
  }, [payment, isOpen]);

  if (!payment) return null;

  const isReceivable = payment.direction === 'receivable';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a payment amount greater than zero.');
      return;
    }

    if (numAmount > remainingBalance + 0.001) {
      setErrorMessage(
        `Amount cannot exceed the remaining outstanding balance of ${formatCurrency(remainingBalance, currency)}.`
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      await paymentService.recordPaymentInstallment(userId, payment.id, {
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });

      onPaymentRecorded();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReceivable ? 'Record Received Payment' : 'Record Outflow Payment'}
      description={`Log a partial or full payment against "${payment.title}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-[#DC5252]/10 border border-[#DC5252]/20 rounded-xl text-xs text-[#DC5252] dark:text-[#FF6666] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Obligation Summary Card */}
        <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#667085] dark:text-[#9AA6B2]">Total Obligation:</span>
            <span className="font-mono font-semibold text-[#17212B] dark:text-[#F5F7FA]">
              {formatCurrency(payment.total_amount, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#667085] dark:text-[#9AA6B2]">Previously Paid:</span>
            <span className="font-mono font-semibold text-[#008F62] dark:text-[#00C78A]">
              {formatCurrency(payment.paid_amount, currency)}
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5E9EF] dark:border-[#303943] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#17212B] dark:text-[#F5F7FA]">Remaining Outstanding:</span>
            <span className="font-mono font-bold text-sm text-[#DC5252] dark:text-[#FF6666]">
              {formatCurrency(remainingBalance, currency)}
            </span>
          </div>
        </div>

        {/* Amount Input with Quick Max button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[#17212B] dark:text-[#F5F7FA]">
              Payment Amount ({CURRENCY_SYMBOLS[currency]}) *
            </label>
            <button
              type="button"
              onClick={() => setAmount(String(remainingBalance.toFixed(2)))}
              className="text-[11px] font-semibold text-[#008F62] dark:text-[#00C78A] hover:underline cursor-pointer"
            >
              Pay Full Remaining
            </button>
          </div>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={remainingBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftElement={<span className="font-mono">{CURRENCY_SYMBOLS[currency]}</span>}
            required
          />
        </div>

        {/* Payment Date & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
              Payment Date *
            </label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              leftElement={<Calendar className="w-4 h-4" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:border-[#008F62] dark:focus:border-[#00C78A] focus:outline-none"
            >
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="upi">UPI / Instant Pay</option>
              <option value="debit_card">Debit Card</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
            Reference / Transaction Note
          </label>
          <Input
            placeholder="e.g. UPI Ref #9102482, Check #402, installment 1 of 3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
