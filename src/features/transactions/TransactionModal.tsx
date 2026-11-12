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
  Loader2,
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
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Transaction Type Segment Control */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
              <span className="font-bold text-slate-500 font-mono">
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCustomCat(!isAddingCustomCat)}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {isAddingCustomCat ? 'Cancel Custom' : 'New Custom Category'}
            </button>
          </div>

          {isAddingCustomCat ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Create New {type === 'income' ? 'Income' : 'Expense'} Category
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Gym Membership, Side Hustle..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
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
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
            placeholder="e.g. Trader Joe's, Google, Netflix"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add memo, invoice number, or description..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Receipt Attachment (JPG, PNG, PDF < 5MB) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Receipt Attachment (JPG, PNG, or PDF under 5MB)
          </label>
          {receiptFile ? (
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate font-medium">{receiptFile.name}</span>
                <span className="text-[11px] text-emerald-600">
                  ({(receiptFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptFile(null)}
                className="text-slate-400 hover:text-rose-600 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : existingReceiptPath ? (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Attached Receipt on File</span>
              </div>
              <button
                type="button"
                onClick={() => setExistingReceiptPath(null)}
                className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 text-xs text-slate-500 hover:bg-slate-50 hover:border-emerald-500 cursor-pointer transition-colors">
              <Paperclip className="w-4 h-4 text-slate-400" />
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
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
