import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateUpiUrl(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
}): string {
  const { vpa, payeeName, amount, transactionNote } = params;
  const cleanVpa = encodeURIComponent(vpa.trim());
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanNote = encodeURIComponent(transactionNote.trim());
  return `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${amount.toFixed(2)}&cu=INR&tn=${cleanNote}`;
}
