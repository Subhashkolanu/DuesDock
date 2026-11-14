import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CurrencyCode } from '@/types/database.types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
};

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD'
): string {
  const currencyLocales: Record<CurrencyCode, { locale: string; currency: string }> = {
    USD: { locale: 'en-US', currency: 'USD' },
    INR: { locale: 'en-IN', currency: 'INR' },
    EUR: { locale: 'de-DE', currency: 'EUR' },
    GBP: { locale: 'en-GB', currency: 'GBP' },
    CAD: { locale: 'en-CA', currency: 'CAD' },
    AUD: { locale: 'en-AU', currency: 'AUD' },
  };

  const config = currencyLocales[currency] || currencyLocales.USD;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getLastMonthKey(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parses YYYY-MM-DD into a local Date object without UTC timezone shifting
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/**
 * Checks if a YYYY-MM-DD string is within the current calendar year
 */
export function isDateInCurrentYear(dateStr: string): boolean {
  if (!dateStr) return false;
  const year = parseInt(dateStr.substring(0, 4), 10);
  return year === new Date().getFullYear();
}

/**
 * Checks if a YYYY-MM-DD date falls within the last N calendar months
 */
export function isDateWithinMonths(dateStr: string, monthsCount: number): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const txDate = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  const startPeriod = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1, 0, 0, 0, 0);
  return txDate >= startPeriod;
}

/**
 * Checks if a YYYY-MM-DD date falls within the last N calendar days
 */
export function isDateWithinDays(dateStr: string, daysCount: number): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const txDate = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - daysCount);
  return txDate >= threshold;
}

/**
 * Global transaction sync event name and dispatcher
 */
export const TRANSACTION_UPDATED_EVENT = 'duesdock_transaction_updated';

export function notifyTransactionUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRANSACTION_UPDATED_EVENT));
    window.dispatchEvent(new Event('duesdock_transaction_saved'));
  }
}

