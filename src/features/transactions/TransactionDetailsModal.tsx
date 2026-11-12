import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TransactionTypeBadge, PaymentMethodBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { transactionService } from '@/services/transactionService';
import type { Transaction, Category, CurrencyCode } from '@/types/database.types';
import {
  Calendar,
  CreditCard,
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
      description="Audit record details and verified receipt attachment."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TransactionTypeBadge type={transaction.type} />
              <PaymentMethodBadge method={transaction.payment_method} />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              <span className={isIncome ? 'text-emerald-600' : 'text-slate-900'}>
                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, currency)}
              </span>
            </div>
          </div>

          {category && (
            <div className="text-right">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                  borderColor: `${category.color}30`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
            </div>
          )}
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Merchant / Payee
            </span>
            <span className="font-semibold text-slate-800">
              {transaction.merchant || 'None specified'}
            </span>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="p-3 rounded-lg border border-slate-100 bg-white text-xs space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Description & Notes
            </span>
            <p className="text-slate-700 whitespace-pre-line">{transaction.notes}</p>
          </div>
        )}

        {/* Receipt Attachment Viewer */}
        {transaction.receipt_path && (
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-emerald-600" />
              Attached Receipt (Encrypted Supabase Storage)
            </span>

            {loadingReceipt ? (
              <div className="flex items-center justify-center p-6 text-xs text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading secure receipt...</span>
              </div>
            ) : signedReceiptUrl ? (
              isPdf ? (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <FileText className="w-5 h-5 text-rose-600" />
                    <span>PDF Receipt Document</span>
                  </div>
                  <a
                    href={signedReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Open PDF <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-60">
                  <img
                    src={signedReceiptUrl}
                    alt="Receipt"
                    className="max-h-60 w-auto object-contain"
                  />
                </div>
              )
            ) : (
              <p className="text-xs text-slate-400 italic">
                Receipt path on file: {transaction.receipt_path}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
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
