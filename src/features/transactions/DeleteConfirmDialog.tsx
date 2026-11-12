import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import type { Transaction, CurrencyCode } from '@/types/database.types';
import { AlertTriangle } from 'lucide-react';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currency: CurrencyCode;
  onConfirmDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  currency,
  onConfirmDelete,
  isDeleting,
}) => {
  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Transaction"
      description="This action cannot be undone."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span>Are you sure you want to permanently delete this transaction for </span>
            <span className="font-bold text-rose-950 font-mono">
              {formatCurrency(transaction.amount, currency)}
            </span>
            <span>?</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div><span className="font-semibold">Type:</span> {transaction.type.toUpperCase()}</div>
          <div><span className="font-semibold">Date:</span> {transaction.transaction_date}</div>
          {transaction.merchant && <div><span className="font-semibold">Merchant:</span> {transaction.merchant}</div>}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isDeleting}
            onClick={() => onConfirmDelete(transaction.id)}
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
