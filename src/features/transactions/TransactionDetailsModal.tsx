import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TransactionTypeBadge, PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { transactionService } from '@/services/transactionService';
import type { Transaction, Category, CurrencyCode } from '@/types/database.types';
import {
  Calendar,
  Store,
  FileText,
  ExternalLink,
  Edit2,
  Trash2,
  Paperclip,
  Loader2,
} from 'lucide-react';

export interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currency: CurrencyCode;
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
  currency,
  categories,
  onEdit,
  onDelete,
}) => {
  const [signedReceiptUrl, setSignedReceiptUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    let active = true;
    if (transaction?.receipt_path) {
      setLoadingReceipt(true);
      transactionService
        .getReceiptUrl(transaction.receipt_path)
        .then((url) => {
          if (active) setSignedReceiptUrl(url);
        })
        .finally(() => {
          if (active) setLoadingReceipt(false);
        });
    } else {
      setSignedReceiptUrl(null);
    }
    return () => {
      active = false;
    };
  }, [transaction]);

  if (!transaction) return null;

  const category = categories.find((c) => c.id === transaction.category_id);
  const isIncome = transaction.type === 'income';
  const isPdf = transaction.receipt_path?.toLowerCase().endsWith('.pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      description="Cryptographically isolated ledger entry and verified receipt attachment."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="p-5 bg-[#F7F8FA] dark:bg-[#101418] rounded-xl border border-[#E5E9EF] dark:border-[#303943] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TransactionTypeBadge type={transaction.type} />
              <PaymentMethodBadge method={transaction.payment_method} />
            </div>
            <div className="text-3xl font-bold tracking-tight font-mono">
              <span className={isIncome ? 'text-[#008F62] dark:text-[#00C78A]' : 'text-[#17212B] dark:text-[#F5F7FA]'}>
                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, currency)}
              </span>
            </div>
          </div>

          {category && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] text-[#17212B] dark:text-[#F5F7FA]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
            </div>
          )}
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-1">
            <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px] font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date
            </span>
            <span className="font-mono font-semibold text-[#17212B] dark:text-[#F5F7FA] block text-sm">
              {transaction.transaction_date}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-1">
            <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px] font-medium flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Merchant / Payee
            </span>
            <span className="font-semibold text-[#17212B] dark:text-[#F5F7FA] block text-sm truncate">
              {transaction.merchant || 'None specified'}
            </span>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] text-xs space-y-1">
            <span className="text-[#667085] dark:text-[#9AA6B2] text-[11px] font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Description & Notes
            </span>
            <p className="text-[#17212B] dark:text-[#F5F7FA] whitespace-pre-line text-xs">
              {transaction.notes}
            </p>
          </div>
        )}

        {/* Receipt Attachment Viewer */}
        {transaction.receipt_path && (
          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-3">
            <span className="text-xs font-semibold text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
              Attached Receipt (Encrypted Supabase Storage)
            </span>

            {loadingReceipt ? (
              <div className="flex items-center justify-center p-6 text-xs text-[#667085] dark:text-[#9AA6B2] gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#008F62] dark:text-[#00C78A]" />
                <span>Loading secure receipt...</span>
              </div>
            ) : signedReceiptUrl ? (
              isPdf ? (
                <div className="flex items-center justify-between p-3 bg-[#FFFFFF] dark:bg-[#171D23] rounded-xl border border-[#E5E9EF] dark:border-[#303943]">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA]">
                    <FileText className="w-5 h-5 text-[#DC5252] dark:text-[#FF6666]" />
                    <span>PDF Receipt Document</span>
                  </div>
                  <a
                    href={signedReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#008F62] dark:text-[#00C78A] hover:underline"
                  >
                    Open PDF <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-black/5 dark:bg-black/40 flex items-center justify-center max-h-60 overflow-hidden">
                  <img
                    src={signedReceiptUrl}
                    alt="Receipt"
                    className="max-h-60 w-auto object-contain rounded-lg"
                  />
                </div>
              )
            ) : (
              <p className="text-xs text-[#667085] dark:text-[#9AA6B2] italic">
                Path on file: {transaction.receipt_path}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onClose();
                onDelete(transaction);
              }}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
