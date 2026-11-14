import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { CURRENCY_SYMBOLS, formatCurrency } from '@/lib/utils';
import { DEFAULT_CATEGORIES } from '@/lib/categories';
import type { CurrencyCode } from '@/types/database.types';
import confetti from 'canvas-confetti';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PieChart,
  ShieldCheck,
  Tag,
  Plus,
} from 'lucide-react';

interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  name: string;
  country: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
];

export const OnboardingWizard: React.FC = () => {
  const { user, profile, completeOnboarding } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    profile?.preferred_currency || 'USD'
  );
  const [budgetTarget, setBudgetTarget] = useState<string>(
    profile?.monthly_budget_target ? String(profile.monthly_budget_target) : '2500'
  );
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryType, setCustomCategoryType] = useState<'expense' | 'income'>('expense');
  const [userCategories, setUserCategories] = useState(DEFAULT_CATEGORIES);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation
  const parsedBudget = parseFloat(budgetTarget);
  const isBudgetValid = !isNaN(parsedBudget) && parsedBudget >= 0;

  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) return;
    setUserCategories([
      ...userCategories,
      {
        name: customCategoryName.trim(),
        type: customCategoryType,
        icon: 'Tag',
        color: customCategoryType === 'income' ? '#10B981' : '#F43F5E',
        is_system: false,
      },
    ]);
    setCustomCategoryName('');
  };

  const handleFinishOnboarding = async () => {
    if (!isBudgetValid) {
      setErrorMessage('Please enter a valid monthly budget target.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // Save onboarding preferences to Supabase
      await completeOnboarding(selectedCurrency, parsedBudget);

      // Trigger celebratory confetti upon successful completion
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#38BDF8', '#0284C7', '#FFFFFF'],
        });
      } catch {
        // Safe fallback
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to save your preferences. Please try again.'
      );
      setIsSaving(false);
    }
  };

  const budgetPresets: Record<CurrencyCode, number[]> = {
    INR: [15000, 30000, 50000, 100000],
    USD: [1500, 3000, 5000, 8000],
    EUR: [1200, 2500, 4500, 7500],
    GBP: [1000, 2000, 4000, 6500],
    CAD: [2000, 3500, 6000, 9000],
    AUD: [2000, 3500, 6000, 9500],
  };

  const activePresets = budgetPresets[selectedCurrency] || budgetPresets.USD;

  return (
    <div className="min-h-screen text-slate-900 dark:text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors relative selection:bg-emerald-500 selection:text-white">
      {/* Ambient background light orbs for liquid refraction */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Theme Toggle */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-10">
        <ThemeToggle showLabel />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showText={false} />
          </div>

          {/* Stepper Progress with Liquid Glass Pills */}
          <div className="inline-flex items-center gap-1.5 p-1 glass-card-subtle rounded-full mb-3 text-xs border border-white/60 dark:border-white/10 shadow-xs">
            {[
              { num: 1, label: 'Currency' },
              { num: 2, label: 'Budget Target' },
              { num: 3, label: 'Categories' },
            ].map((s) => (
              <span
                key={s.num}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  step === s.num
                    ? 'liquid-pill-active text-emerald-800 dark:text-emerald-300 font-bold'
                    : step > s.num
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {s.num}. {s.label}
              </span>
            ))}
          </div>

          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
            Personalize Your DuesDock Workspace
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Signed in as <strong className="text-slate-900 dark:text-white">{profile?.full_name || user?.email}</strong>
          </p>
        </div>

        {/* Card Panel */}
        <Card className="p-6 sm:p-8 glass-card rounded-3xl shadow-2xl border border-white/70 dark:border-white/10">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Currency Selection */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Select Primary Currency
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All transaction ledgers, analytics, and reports will use this monetary unit.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CURRENCIES.map((c) => {
                  const isSelected = selectedCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer backdrop-blur-md ${
                        isSelected
                          ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/15 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500 dark:ring-emerald-400'
                          : 'border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-emerald-500/40 hover:bg-white/80 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                          {c.symbol}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {c.code}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {c.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Budget Target
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Monthly Budget Target */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Monthly Spending Ceiling
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Define your aggregate monthly expenditure ceiling. DuesDock warns you automatically at 80% and 100% capacity.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label={`Monthly Target Budget (${CURRENCY_SYMBOLS[selectedCurrency]})`}
                  type="number"
                  min="0"
                  step="10"
                  placeholder="e.g. 3000"
                  value={budgetTarget}
                  onChange={(e) => setBudgetTarget(e.target.value)}
                  leftElement={
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {CURRENCY_SYMBOLS[selectedCurrency]}
                    </span>
                  }
                  helperText="You can adjust this anytime in Budgets & Limits."
                  error={!isBudgetValid ? 'Enter a valid positive number' : undefined}
                />

                {/* Quick Presets with Liquid Pills */}
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">
                    Quick presets for {selectedCurrency}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activePresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBudgetTarget(String(val))}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-mono transition-all cursor-pointer backdrop-blur-md ${
                          budgetTarget === String(val)
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent font-bold shadow-md shadow-emerald-500/20'
                            : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-300/70 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10'
                        }`}
                      >
                        {formatCurrency(val, selectedCurrency)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={!isBudgetValid}
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Review Categories
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Categories & Final Confirmation */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Review Expense Categories
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Default categories are prepared. You can add custom categories now or anytime later.
                </p>
              </div>

              {/* Category Badges Preview in Liquid Glass Card */}
              <div className="max-h-48 overflow-y-auto p-3.5 rounded-2xl glass-card-subtle">
                <div className="flex flex-wrap gap-2">
                  {userCategories.map((cat, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-xs backdrop-blur-md"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </span>
                      <span className="text-[10px] capitalize px-1.5 py-0.5 rounded-md bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                        {cat.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Category Inline */}
              <div className="p-4 glass-card-subtle rounded-2xl space-y-2.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Add Custom Category (Optional)
                </span>
                <div className="flex items-center gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    placeholder="e.g. Gym, Subscriptions, Freelance..."
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="w-full sm:flex-1 rounded-xl border border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-[#0B1118]/70 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 backdrop-blur-md"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={customCategoryType}
                      onChange={(e) => setCustomCategoryType(e.target.value as 'expense' | 'income')}
                      className="rounded-xl border border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-[#0B1118]/70 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none backdrop-blur-md"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddCustomCategory}
                      disabled={!customCategoryName.trim()}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Summary Overview in Frosted Glass Box */}
              <div className="p-4 rounded-2xl glass-card-subtle text-xs space-y-2.5 border border-white/50 dark:border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Base Currency:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedCurrency} ({CURRENCY_SYMBOLS[selectedCurrency]})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Target:</span>
                  <span className="font-semibold font-mono text-slate-900 dark:text-white">
                    {formatCurrency(parsedBudget, selectedCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Security Posture:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> PostgreSQL RLS Cryptographic Isolation
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setStep(2)}
                  disabled={isSaving}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  onClick={handleFinishOnboarding}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
