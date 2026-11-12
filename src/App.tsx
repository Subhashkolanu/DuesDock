import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { Navbar } from '@/components/layout/Navbar';
import { NavigationTabs, type FinanceTabKey } from '@/components/layout/NavigationTabs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/common/StatCard';
import {
  ShieldCheck,
  Wallet,
  Loader2,
  PieChart,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import { CURRENCY_SYMBOLS, formatCurrency } from '@/lib/utils';

export function App() {
  const { user, profile, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<FinanceTabKey>('dashboard');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-extrabold text-xl shadow-emerald mb-4 animate-pulse">
          DD
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading your financial workspace...</span>
        </div>
      </div>
    );
  }

  // Google-Only Authentication requirement: Unauthenticated users are presented with Google Sign-In
  if (!user) {
    return <LoginPage />;
  }

  // First-time user onboarding requirement:
  // If user is authenticated but has not completed onboarding, display the Onboarding Wizard
  // Returning users (profile.is_onboarded === true) skip this completely
  if (profile && !profile.is_onboarded) {
    return <OnboardingWizard />;
  }

  const preferredCurrency = profile?.preferred_currency || 'USD';
  const monthlyBudgetTarget = profile?.monthly_budget_target || 0;

  return (
    <div className="min-h-screen bg-background text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar onOpenAddTransaction={() => setActiveTab('transactions')} />

      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 text-white shadow-emerald relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              Personal Finance Dashboard
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
            </h1>
            <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
              Your financial dashboard is ready. All your transactions, budgets, and reports are secured under personal PostgreSQL Row Level Security.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                onClick={() => setActiveTab('transactions')}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Log First Transaction
              </Button>
              <div className="text-xs text-emerald-200 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Default Currency: {preferredCurrency} ({CURRENCY_SYMBOLS[preferredCurrency]})</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Clean Dashboard Financial Metrics (No fake financial data) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Target Budget"
            value={formatCurrency(monthlyBudgetTarget, preferredCurrency)}
            subtitle="Configured in onboarding"
            icon={<PieChart className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            title="Total Income"
            value={formatCurrency(0, preferredCurrency)}
            subtitle="0 transactions logged"
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(0, preferredCurrency)}
            subtitle="0 transactions logged"
            icon={<TrendingDown className="w-5 h-5" />}
            color="rose"
          />
          <StatCard
            title="Net Savings"
            value={formatCurrency(0, preferredCurrency)}
            subtitle="Income minus expenses"
            icon={<PiggyBank className="w-5 h-5" />}
            color="sky"
          />
        </div>

        {/* Clean Empty State Workspace */}
        <Card className="p-8 text-center bg-white border-dashed border-2 border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Transactions Recorded Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Your personal finance ledger is completely clean. Click below to record your first income deposit or daily expense.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('transactions')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Your First Transaction
          </Button>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight">DuesDock</span>
            <span>•</span>
            <span>Personal Finance & Expense Tracker</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Modern Emerald Theme</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Google OAuth + Supabase RLS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
