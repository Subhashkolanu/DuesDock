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
        <div className="p-4 bg-[#DC5252]/10 border border-[#DC5252]/20 rounded-xl text-xs text-[#DC5252] dark:text-[#FF6666] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span>Are you sure you want to permanently delete this transaction for </span>
            <strong className="font-semibold font-mono">
              {formatCurrency(transaction.amount, currency)}
            </strong>
            <span>?</span>
          </div>
        </div>

        <div className="text-xs text-[#17212B] dark:text-[#F5F7FA] bg-[#F7F8FA] dark:bg-[#101418] p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] space-y-1 font-mono">
          <div>
            <span className="text-[#667085] dark:text-[#9AA6B2]">Type:</span>{' '}
            <span className="font-semibold capitalize">{transaction.type}</span>
          </div>
          <div>
            <span className="text-[#667085] dark:text-[#9AA6B2]">Date:</span>{' '}
            <span>{transaction.transaction_date}</span>
          </div>
          {transaction.merchant && (
            <div>
              <span className="text-[#667085] dark:text-[#9AA6B2]">Merchant:</span>{' '}
              <span>{transaction.merchant}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
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
