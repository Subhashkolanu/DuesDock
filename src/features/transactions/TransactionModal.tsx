import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { transactionService } from '@/services/transactionService';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import type { Transaction, Category, TransactionType, PaymentMethod, CurrencyCode } from '@/types/database.types';
import {
  TrendingDown,
  TrendingUp,
  Paperclip,
  X,
  AlertCircle,
  FileText,
  Plus,
} from 'lucide-react';

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currency: CurrencyCode;
  categories: Category[];
  editingTransaction?: Transaction | null;
  onTransactionSaved: () => void;
  onCategoryAdded?: (cat: Category) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  userId,
  currency,
  categories,
  editingTransaction,
  onTransactionSaved,
  onCategoryAdded,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit_card');
  const [merchant, setMerchant] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Receipt attachment
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceiptPath, setExistingReceiptPath] = useState<string | null>(null);

  // Custom Category Inline Creation
  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form when opening in Edit mode
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategoryId(editingTransaction.category_id || '');
      setDate(editingTransaction.transaction_date);
      setPaymentMethod(editingTransaction.payment_method);
      setMerchant(editingTransaction.merchant || '');
      setNotes(editingTransaction.notes || '');
      setExistingReceiptPath(editingTransaction.receipt_path);
      setReceiptFile(null);
    } else {
      setType('expense');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('debit_card');
      setMerchant('');
      setNotes('');
      setExistingReceiptPath(null);
      setReceiptFile(null);
    }
    setErrorMessage(null);
    setIsAddingCustomCat(false);
  }, [editingTransaction, isOpen]);

  // Filter categories by selected transaction type
  const availableCategories = categories.filter((c) => c.type === type);

  // Auto-select first available category if current selection is not valid for type
  useEffect(() => {
    if (!categoryId && availableCategories.length > 0) {
      setCategoryId(availableCategories[0].id);
    } else if (categoryId) {
      const match = availableCategories.find((c) => c.id === categoryId);
      if (!match && availableCategories.length > 0) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [type, availableCategories, categoryId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Receipt must be a JPG, PNG, or PDF file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Receipt file size must be less than 5MB.');
        return;
      }
      setErrorMessage(null);
      setReceiptFile(file);
    }
  };

  const handleCreateCustomCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setIsCreatingCat(true);
      const created = await transactionService.createCategory(userId, {
        name: newCatName.trim(),
        type,
      });
      if (onCategoryAdded) onCategoryAdded(created);
      setCategoryId(created.id);
      setNewCatName('');
      setIsAddingCustomCat(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create category');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Upload receipt if a new file was chosen
      let receiptPath = existingReceiptPath;
      if (receiptFile) {
        receiptPath = await transactionService.uploadReceipt(userId, receiptFile);
      }

      if (editingTransaction) {
        await transactionService.updateTransaction(userId, editingTransaction.id, {
          type,
          amount: numAmount,
          category_id: categoryId || null,
          transaction_date: date,
          payment_method: paymentMethod,
          merchant: merchant.trim() || null,
          notes: notes.trim() || null,
          receipt_path: receiptPath,
        });
      } else {
        await transactionService.createTransaction(userId, {
          type,
          amount: numAmount,
          category_id: categoryId || null,
          transaction_date: date,
          payment_method: paymentMethod,
          merchant: merchant.trim() || null,
          notes: notes.trim() || null,
          receipt_path: receiptPath,
        });
      }

      onTransactionSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
      description="Enter personal transaction details to update your cash flow and budgets."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-[#DC5252]/10 border border-[#DC5252]/20 rounded-xl text-xs text-[#DC5252] dark:text-[#FF6666] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Transaction Type Segment Control */}
        <div>
          <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F4F6] dark:bg-[#202830] rounded-xl border border-[#E5E9EF] dark:border-[#303943]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-[#FFFFFF] dark:bg-[#171D23] text-[#DC5252] dark:text-[#FF6666] shadow-xs'
                  : 'text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA]'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-[#FFFFFF] dark:bg-[#171D23] text-[#008F62] dark:text-[#00C78A] shadow-xs'
                  : 'text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Income
            </button>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Amount (${CURRENCY_SYMBOLS[currency]})`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftElement={
              <span className="font-semibold text-[#667085] dark:text-[#9AA6B2] font-mono text-sm">
                {CURRENCY_SYMBOLS[currency]}
              </span>
            }
            required
          />

          <Input
            label="Transaction Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Category Selector with Custom Category Creator */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA]">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCustomCat(!isAddingCustomCat)}
              className="text-xs font-medium text-[#008F62] dark:text-[#00C78A] hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingCustomCat ? 'Cancel custom' : 'New category'}
            </button>
          </div>

          {isAddingCustomCat ? (
            <div className="p-3 bg-[#F7F8FA] dark:bg-[#101418] border border-[#E5E9EF] dark:border-[#303943] rounded-xl space-y-2 mb-2">
              <span className="text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] block">
                Create new {type === 'income' ? 'income' : 'expense'} category
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Gym, Subscriptions, Freelance..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] px-3 py-1.5 text-xs text-[#17212B] dark:text-[#F5F7FA] focus:outline-none focus:border-[#008F62] dark:focus:border-[#00C78A]"
                />
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  isLoading={isCreatingCat}
                  onClick={handleCreateCustomCategory}
                  disabled={!newCatName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:outline-none focus:border-[#008F62] dark:focus:border-[#00C78A]"
              required
            >
              {availableCategories.length === 0 ? (
                <option value="">No categories available for this type</option>
              ) : (
                availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_system ? '' : '(Custom)'}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Payment Method & Merchant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:outline-none focus:border-[#008F62] dark:focus:border-[#00C78A]"
            >
              <option value="debit_card">Debit Card</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI / Mobile Pay</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input
            label="Merchant / Payee (Optional)"
            placeholder="e.g. Trader Joe's, Netflix, Google"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
            Notes & Description (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add memo, invoice reference, or payment note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] p-3 text-xs text-[#17212B] dark:text-[#F5F7FA] placeholder:text-[#667085]/60 dark:placeholder:text-[#9AA6B2]/60 focus:outline-none focus:border-[#008F62] dark:focus:border-[#00C78A]"
          />
        </div>

        {/* Receipt Attachment (JPG, PNG, PDF < 5MB) */}
        <div>
          <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
            Receipt Attachment (JPG, PNG, PDF &lt; 5MB)
          </label>
          {receiptFile ? (
            <div className="flex items-center justify-between p-3 bg-[#008F62]/10 border border-[#008F62]/20 rounded-xl text-xs text-[#008F62] dark:text-[#00C78A]">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate font-medium">{receiptFile.name}</span>
                <span className="text-[11px] opacity-75">
                  ({(receiptFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptFile(null)}
                className="text-[#DC5252] dark:text-[#FF6666] hover:opacity-80 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : existingReceiptPath ? (
            <div className="flex items-center justify-between p-3 bg-[#F1F4F6] dark:bg-[#202830] border border-[#E5E9EF] dark:border-[#303943] rounded-xl text-xs text-[#17212B] dark:text-[#F5F7FA]">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-[#008F62] dark:text-[#00C78A] shrink-0" />
                <span className="truncate font-medium">Receipt on file</span>
              </div>
              <button
                type="button"
                onClick={() => setExistingReceiptPath(null)}
                className="text-[#DC5252] dark:text-[#FF6666] font-medium text-xs hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border border-dashed border-[#E5E9EF] dark:border-[#303943] rounded-xl p-4 text-xs font-medium text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA] hover:border-[#008F62] dark:hover:border-[#00C78A] cursor-pointer transition-colors bg-[#FFFFFF] dark:bg-[#171D23]">
              <Paperclip className="w-4 h-4" />
              <span>Click to attach receipt (JPG, PNG, PDF)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E9EF] dark:border-[#303943]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {editingTransaction ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
