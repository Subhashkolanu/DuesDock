import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CURRENCY_SYMBOLS, formatCurrency } from '@/lib/utils';
import type { CurrencyCode } from '@/types/database.types';
import {
  User,
  Wallet,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
} from 'lucide-react';

const CURRENCY_LIST: Array<{ code: CurrencyCode; label: string; symbol: string }> = [
  { code: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' },
  { code: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'CA$' },
  { code: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
];

export const SettingsManager: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [preferredCurrency, setPreferredCurrency] = useState<CurrencyCode>(
    profile?.preferred_currency || 'USD'
  );
  const [budgetTarget, setBudgetTarget] = useState(
    String(profile?.monthly_budget_target || 0)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPreferredCurrency(profile.preferred_currency || 'USD');
      setBudgetTarget(String(profile.monthly_budget_target || 0));
    }
  }, [profile]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const numBudget = parseFloat(budgetTarget);
    if (isNaN(numBudget) || numBudget < 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'Please enter a valid monthly budget target (0 or greater).',
      });
      return;
    }

    try {
      setIsSaving(true);
      setFeedbackMessage(null);

      await updateProfile({
        full_name: fullName.trim() || null,
        preferred_currency: preferredCurrency,
        monthly_budget_target: numBudget,
      });

      setFeedbackMessage({
        type: 'success',
        text: 'Account preferences updated successfully.',
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to update preferences.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Top Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
          Application & Account Settings
        </h1>
        <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
          Configure personal preferences, display currency, spending thresholds, and theme
        </p>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-[#008F62]/10 border-[#008F62]/20 text-[#008F62] dark:text-[#00C78A]'
              : 'bg-[#DC5252]/10 border-[#DC5252]/20 text-[#DC5252] dark:text-[#FF6666]'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Profile Information */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E9EF] dark:border-[#303943]">
            <User className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
            <h2 className="font-heading font-bold text-base text-[#17212B] dark:text-[#F5F7FA]">
              Personal Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
                Full Name
              </label>
              <Input
                placeholder="Your Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
                Google Account Email
              </label>
              <div className="relative">
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-[#F1F4F6] dark:bg-[#202830] text-[#667085] cursor-not-allowed"
                  leftElement={<Mail className="w-4 h-4 text-[#667085]" />}
                />
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2] mt-1">
                Managed securely via Google OAuth 2.0.
              </p>
            </div>
          </div>
        </Card>

        {/* 2. Currency & Financial Preferences */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E9EF] dark:border-[#303943]">
            <Wallet className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
            <h2 className="font-heading font-bold text-base text-[#17212B] dark:text-[#F5F7FA]">
              Currency & Spending Targets
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Currency */}
            <div>
              <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
                Preferred Display Currency
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value as CurrencyCode)}
                className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:border-[#008F62] dark:focus:border-[#00C78A] focus:outline-none"
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2] mt-1">
                All ledger amounts, budgets, and exports will render in this currency.
              </p>
            </div>

            {/* Monthly Budget Target */}
            <div>
              <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1">
                Monthly Spending Ceiling ({CURRENCY_SYMBOLS[preferredCurrency]})
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="0.00"
                value={budgetTarget}
                onChange={(e) => setBudgetTarget(e.target.value)}
                leftElement={<span className="font-mono">{CURRENCY_SYMBOLS[preferredCurrency]}</span>}
              />
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2] mt-1">
                Global monthly budget benchmark visualized on your dashboard.
              </p>
            </div>
          </div>
        </Card>

        {/* 3. Theme & Appearance */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E9EF] dark:border-[#303943]">
            {isDark ? <Moon className="w-4 h-4 text-[#00C78A]" /> : <Sun className="w-4 h-4 text-[#D99A27]" />}
            <h2 className="font-heading font-bold text-base text-[#17212B] dark:text-[#F5F7FA]">
              Appearance & Interface Theme
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418]">
            <div>
              <p className="font-semibold text-xs text-[#17212B] dark:text-[#F5F7FA]">
                Current Active Mode: {isDark ? 'Dark Theme (Deep Navy & Emerald)' : 'Light Theme (Clean White & Slate)'}
              </p>
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2] mt-0.5">
                Saved in your browser localStorage and synchronized across sessions.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              leftIcon={isDark ? <Sun className="w-4 h-4 text-[#F0B94B]" /> : <Moon className="w-4 h-4" />}
            >
              Switch to {isDark ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </Card>

        {/* 4. Security & Data Isolation Status */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E9EF] dark:border-[#303943]">
            <ShieldCheck className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
            <h2 className="font-heading font-bold text-base text-[#17212B] dark:text-[#F5F7FA]">
              Security & Cryptographic Isolation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-1">
              <span className="font-semibold text-[#008F62] dark:text-[#00C78A] block">
                PostgreSQL RLS
              </span>
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2]">
                Row-Level Security active. Only auth.uid() can read or mutate your records.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-1">
              <span className="font-semibold text-[#008F62] dark:text-[#00C78A] block">
                Private Storage
              </span>
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2]">
                Receipt uploads are stored in an encrypted private bucket with signed URLs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-1">
              <span className="font-semibold text-[#008F62] dark:text-[#00C78A] block">
                OAuth Verification
              </span>
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2]">
                Google-Only OAuth 2.0. No passwords stored or handled locally.
              </p>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" type="submit" isLoading={isSaving} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Save All Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
