import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
        color: customCategoryType === 'income' ? '#059669' : '#EC4899',
        is_system: false,
      },
    ]);
    setCustomCategoryName('');
  };

  const handleFinishOnboarding = async () => {
    if (!isBudgetValid) {
      setErrorMessage('Please provide a valid monthly budget target (e.g. 1000 or greater).');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // Save onboarding preferences to Supabase
      // Only sets is_onboarded = true upon successful database update
      await completeOnboarding(selectedCurrency, parsedBudget);

      // Trigger celebratory confetti upon successful completion
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
        });
      } catch {
        // Safe fallback if canvas is not present
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to save your preferences to the database. Please try again.'
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
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-extrabold text-xl shadow-emerald mb-3">
            DD
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            Step {step} of 3 • Quick Setup
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Personalize Your DuesDock Workspace
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Welcome, <span className="font-semibold text-slate-700">{profile?.full_name || user?.email}</span>. Let's customize your financial preferences.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full mb-6 overflow-hidden">
          <div
            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Card Panel */}
        <Card className="p-6 sm:p-8 shadow-card border-slate-200">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Save Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Currency Selection */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Select Your Base Currency
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  All transactions, charts, and budget reports will be displayed in this currency.
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
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-base font-extrabold text-slate-900">
                          {c.symbol}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900">
                        {c.code}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {c.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
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
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-600" />
                  Set Monthly Spending Target
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Define your target spending ceiling. DuesDock alerts you when your category spending nears this limit.
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  label="Monthly Target Budget"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="e.g. 3000"
                  value={budgetTarget}
                  onChange={(e) => setBudgetTarget(e.target.value)}
                  leftElement={
                    <span className="font-bold text-slate-600 font-mono">
                      {CURRENCY_SYMBOLS[selectedCurrency]}
                    </span>
                  }
                  helperText="You can adjust this anytime in your Budgets & Categories settings."
                  error={!isBudgetValid ? 'Please enter a valid positive number' : undefined}
                />

                {/* Quick Preset Pills */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Quick Presets for {selectedCurrency}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activePresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBudgetTarget(String(val))}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          budgetTarget === String(val)
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {formatCurrency(val, selectedCurrency)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
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
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600" />
                  Review Starter Categories
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  We've configured smart default categories for you. You can also add custom categories.
                </p>
              </div>

              {/* Category Badges Preview */}
              <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {userCategories.map((cat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium shadow-2xs"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({cat.type})
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add Quick Custom Category */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  Add Custom Category (Optional)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Pet Care, SaaS Subscriptions..."
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <select
                    value={customCategoryType}
                    onChange={(e) => setCustomCategoryType(e.target.value as 'expense' | 'income')}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={handleAddCustomCategory}
                    disabled={!customCategoryName.trim()}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Summary Overview */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Currency:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedCurrency} ({CURRENCY_SYMBOLS[selectedCurrency]})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Target Budget:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(parsedBudget, selectedCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data Isolation:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> PostgreSQL RLS Active
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
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
                  Complete Setup & Launch Dashboard
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
