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
        color: customCategoryType === 'income' ? '#008F62' : '#DC5252',
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
          colors: ['#008F62', '#00C78A', '#17212B', '#FFFFFF'],
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
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#101418] text-[#17212B] dark:text-[#F5F7FA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors relative selection:bg-[#008F62] selection:text-white dark:selection:bg-[#00C78A] dark:selection:text-[#101418]">
      {/* Floating Theme Toggle */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8">
        <ThemeToggle showLabel />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showText={false} />
          </div>

          {/* Stepper Progress */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-[#F1F4F6] dark:bg-[#202830] border border-[#E5E9EF] dark:border-[#303943] rounded-full mb-3 text-xs">
            {[
              { num: 1, label: 'Currency' },
              { num: 2, label: 'Budget Target' },
              { num: 3, label: 'Categories' },
            ].map((s) => (
              <span
                key={s.num}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  step === s.num
                    ? 'bg-[#008F62] dark:bg-[#00C78A] text-white dark:text-[#101418] font-semibold shadow-xs'
                    : step > s.num
                    ? 'text-[#008F62] dark:text-[#00C78A]'
                    : 'text-[#667085] dark:text-[#9AA6B2]'
                }`}
              >
                {s.num}. {s.label}
              </span>
            ))}
          </div>

          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
            Personalize Your DuesDock Workspace
          </h1>
          <p className="mt-1 text-xs text-[#667085] dark:text-[#9AA6B2]">
            Signed in as <strong className="text-[#17212B] dark:text-[#F5F7FA]">{profile?.full_name || user?.email}</strong>
          </p>
        </div>

        {/* Card Panel */}
        <Card className="p-6 sm:p-8 border border-[#E5E9EF] dark:border-[#303943] fintech-card-shadow bg-[#FFFFFF] dark:bg-[#171D23] rounded-2xl">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#DC5252]/10 border border-[#DC5252]/20 text-[#DC5252] dark:text-[#FF6666] text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Currency Selection */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#008F62] dark:text-[#00C78A]" />
                  Select Primary Currency
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
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
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#008F62] dark:border-[#00C78A] bg-[#008F62]/5 dark:bg-[#00C78A]/10 ring-1 ring-[#008F62] dark:ring-[#00C78A]'
                          : 'border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#202830] hover:border-[#008F62]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xl font-bold text-[#17212B] dark:text-[#F5F7FA]">
                          {c.symbol}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
                        )}
                      </div>
                      <div className="font-semibold text-xs text-[#17212B] dark:text-[#F5F7FA]">
                        {c.code}
                      </div>
                      <div className="text-[11px] text-[#667085] dark:text-[#9AA6B2] truncate">
                        {c.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#E5E9EF] dark:border-[#303943] flex justify-end">
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
                <h2 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#008F62] dark:text-[#00C78A]" />
                  Monthly Spending Ceiling
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
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
                    <span className="font-mono font-bold text-[#17212B] dark:text-[#F5F7FA] text-sm">
                      {CURRENCY_SYMBOLS[selectedCurrency]}
                    </span>
                  }
                  helperText="You can adjust this anytime in Budgets & Limits."
                  error={!isBudgetValid ? 'Enter a valid positive number' : undefined}
                />

                {/* Quick Presets */}
                <div>
                  <span className="text-xs font-medium text-[#667085] dark:text-[#9AA6B2] block mb-2">
                    Quick presets for {selectedCurrency}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activePresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBudgetTarget(String(val))}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                          budgetTarget === String(val)
                            ? 'bg-[#008F62] dark:bg-[#00C78A] text-white dark:text-[#101418] border-transparent font-semibold shadow-xs'
                            : 'bg-[#F1F4F6] dark:bg-[#202830] text-[#17212B] dark:text-[#F5F7FA] border-[#E5E9EF] dark:border-[#303943] hover:bg-[#E5E9EF] dark:hover:bg-[#28323C]'
                        }`}
                      >
                        {formatCurrency(val, selectedCurrency)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E9EF] dark:border-[#303943] flex items-center justify-between">
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
                <h2 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#008F62] dark:text-[#00C78A]" />
                  Review Expense Categories
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
                  Default categories are prepared. You can add custom categories now or anytime later.
                </p>
              </div>

              {/* Category Badges Preview - Fixed High Contrast Chips without clipping */}
              <div className="max-h-48 overflow-y-auto p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#101418] border border-[#E5E9EF] dark:border-[#303943]">
                <div className="flex flex-wrap gap-2">
                  {userCategories.map((cat, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] shadow-xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-medium text-[#17212B] dark:text-[#F5F7FA]">
                        {cat.name}
                      </span>
                      <span className="text-[10px] capitalize px-1.5 py-0.2 rounded-full bg-[#F1F4F6] dark:bg-[#202830] text-[#667085] dark:text-[#9AA6B2]">
                        {cat.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Category Inline */}
              <div className="p-3.5 bg-[#F7F8FA] dark:bg-[#202830] border border-[#E5E9EF] dark:border-[#303943] rounded-xl space-y-2">
                <span className="text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] block">
                  Add Custom Category (Optional)
                </span>
                <div className="flex items-center gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    placeholder="e.g. Gym, Subscriptions, Freelance..."
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="w-full sm:flex-1 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-1.5 text-xs text-[#17212B] dark:text-[#F5F7FA] focus:outline-none focus:border-[#008F62] dark:focus:border-[#00C78A]"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={customCategoryType}
                      onChange={(e) => setCustomCategoryType(e.target.value as 'expense' | 'income')}
                      className="rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-2.5 py-1.5 text-xs text-[#17212B] dark:text-[#F5F7FA] focus:outline-none"
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

              {/* Summary Overview */}
              <div className="p-4 rounded-xl bg-[#F1F4F6] dark:bg-[#202830] text-xs space-y-2 border border-[#E5E9EF] dark:border-[#303943]">
                <div className="flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#9AA6B2]">Base Currency:</span>
                  <span className="font-semibold text-[#008F62] dark:text-[#00C78A]">
                    {selectedCurrency} ({CURRENCY_SYMBOLS[selectedCurrency]})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#9AA6B2]">Monthly Target:</span>
                  <span className="font-semibold font-mono text-[#17212B] dark:text-[#F5F7FA]">
                    {formatCurrency(parsedBudget, selectedCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#667085] dark:text-[#9AA6B2]">Security:</span>
                  <span className="font-medium text-[#008F62] dark:text-[#00C78A] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> PostgreSQL RLS Active
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E9EF] dark:border-[#303943] flex items-center justify-between">
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
