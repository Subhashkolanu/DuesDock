import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { paymentService } from '@/services/paymentService';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import type { Payment, Category, PaymentDirection, CurrencyCode } from '@/types/database.types';
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Calendar,
  Building,
} from 'lucide-react';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currency: CurrencyCode;
  categories: Category[];
  editingPayment?: Payment | null;
  onPaymentSaved: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  userId,
  currency,
  categories,
  editingPayment,
  onPaymentSaved,
}) => {
  const [direction, setDirection] = useState<PaymentDirection>('payable');
  const [title, setTitle] = useState('');
  const [partyName, setPartyName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingPayment) {
      setDirection(editingPayment.direction);
      setTitle(editingPayment.title);
      setPartyName(editingPayment.party_name);
      setTotalAmount(String(editingPayment.total_amount));
      setDueDate(editingPayment.due_date);
      setCategoryId(editingPayment.category_id || '');
      setNotes(editingPayment.notes || '');
    } else {
      setDirection('payable');
      setTitle('');
      setPartyName('');
      setTotalAmount('');
      // Default due date: 7 days from now
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split('T')[0]);
      setCategoryId('');
      setNotes('');
    }
    setErrorMessage(null);
  }, [editingPayment, isOpen]);

  // Categories matching the obligation direction
  const filteredCategories = categories.filter((c) =>
    direction === 'payable' ? c.type === 'expense' : c.type === 'income'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const numAmount = parseFloat(totalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid total amount greater than zero.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter a payment title or description.');
      return;
    }
    if (!partyName.trim()) {
      setErrorMessage('Please specify the person, merchant, or organization.');
      return;
    }
    if (!dueDate) {
      setErrorMessage('Please specify a valid due date.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      if (editingPayment) {
        if (numAmount < Number(editingPayment.paid_amount)) {
          setErrorMessage(
            `Total amount cannot be less than the already paid amount (${editingPayment.paid_amount}).`
          );
          setIsLoading(false);
          return;
        }

        await paymentService.updatePayment(userId, editingPayment.id, {
          title: title.trim(),
          party_name: partyName.trim(),
          direction,
          total_amount: numAmount,
          due_date: dueDate,
          category_id: categoryId || null,
          notes: notes.trim() || null,
        });
      } else {
        await paymentService.createPayment(userId, {
          title: title.trim(),
          party_name: partyName.trim(),
          direction,
          total_amount: numAmount,
          due_date: dueDate,
          category_id: categoryId || null,
          notes: notes.trim() || null,
        });
      }

      onPaymentSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save payment obligation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPayment ? 'Edit Payment Obligation' : 'Add Payment Obligation'}
      description="Track pending obligations, deadlines, and expected receivables."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-[#DC5252]/10 border border-[#DC5252]/20 rounded-xl text-xs text-[#DC5252] dark:text-[#FF6666] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Direction Segment Switcher */}
        <div>
          <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
            Payment Direction
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F4F6] dark:bg-[#202830] rounded-xl border border-[#E5E9EF] dark:border-[#303943]">
            <button
              type="button"
              onClick={() => setDirection('payable')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                direction === 'payable'
                  ? 'bg-[#FFFFFF] dark:bg-[#171D23] text-[#DC5252] dark:text-[#FF6666] shadow-xs'
                  : 'text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA]'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Money to Pay (Payable)</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('receivable')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                direction === 'receivable'
                  ? 'bg-[#FFFFFF] dark:bg-[#171D23] text-[#008F62] dark:text-[#00C78A] shadow-xs'
                  : 'text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Money to Receive (Receivable)</span>
            </button>
          </div>
        </div>

        {/* Title & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
              Title / Purpose *
            </label>
            <Input
              placeholder="e.g., Office Rent, Client Invoice #204"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
              Total Amount ({CURRENCY_SYMBOLS[currency]}) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              leftElement={<span className="font-mono">{CURRENCY_SYMBOLS[currency]}</span>}
              required
            />
          </div>
        </div>

        {/* Party Name & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
              {direction === 'payable' ? 'Payable To (Merchant / Person) *' : 'Receivable From (Client / Person) *'}
            </label>
            <Input
              placeholder="e.g. Acme Corp, John Doe, Landlord"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              leftElement={<Building className="w-4 h-4" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
              Due Date *
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              leftElement={<Calendar className="w-4 h-4" />}
              required
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
            Associated Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:border-[#008F62] dark:focus:border-[#00C78A] focus:outline-none"
          >
            <option value="">No Category / General</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
            Notes / Description
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional terms, invoice reference, bank details, or reminders..."
            className="w-full rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs text-[#17212B] dark:text-[#F5F7FA] placeholder-[#667085] dark:placeholder-[#9AA6B2] focus:border-[#008F62] dark:focus:border-[#00C78A] focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {editingPayment ? 'Save Obligation' : 'Create Obligation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
