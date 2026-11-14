import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Navbar, type FinanceTabKey } from '@/components/layout/Navbar';
import { Logo } from '@/components/common/Logo';
import { transactionService } from '@/services/transactionService';
import { notifyTransactionUpdated } from '@/lib/utils';
import type { Category, CurrencyCode } from '@/types/database.types';
import { ShieldCheck, Loader2 } from 'lucide-react';

// Lazy-loaded routes for optimal bundle code-splitting
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const OnboardingWizard = lazy(() => import('@/features/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const FinanceDashboard = lazy(() => import('@/features/dashboard/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const TransactionManager = lazy(() => import('@/features/transactions/TransactionManager').then(m => ({ default: m.TransactionManager })));
const PaymentManager = lazy(() => import('@/features/payments/PaymentManager').then(m => ({ default: m.PaymentManager })));
const BudgetManager = lazy(() => import('@/features/budgets/BudgetManager').then(m => ({ default: m.BudgetManager })));
const AnalyticsManager = lazy(() => import('@/features/analytics/AnalyticsManager').then(m => ({ default: m.AnalyticsManager })));
const ReportsManager = lazy(() => import('@/features/reports/ReportsManager').then(m => ({ default: m.ReportsManager })));
const SettingsManager = lazy(() => import('@/features/settings/SettingsManager').then(m => ({ default: m.SettingsManager })));
const DevelopersPage = lazy(() => import('@/features/developers/DevelopersPage').then(m => ({ default: m.DevelopersPage })));
const TransactionModal = lazy(() => import('@/features/transactions/TransactionModal').then(m => ({ default: m.TransactionModal })));

export function App() {
  const { user, profile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<FinanceTabKey>('dashboard');
  const [isGlobalAddOpen, setIsGlobalAddOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';

  // Load categories for global Add Transaction modal
  useEffect(() => {
    if (user) {
      transactionService.getCategories(user.id).then(setCategories).catch(() => {});
    }
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors">
        <div className="glass-panel rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center shadow-2xl border border-white/60 dark:border-white/10">
          <Logo size="xl" showText={false} className="mb-4" />
          <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-2">
            DuesDock
          </h2>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span>Loading your financial workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // Google-Only Authentication requirement: Unauthenticated users are presented with Google Sign-In
  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  // First-time user onboarding requirement:
  // Returning users (profile.is_onboarded === true) skip this completely
  if (profile && !profile.is_onboarded) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <OnboardingWizard />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Unified Top Navigation */}
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddTransaction={() => setIsGlobalAddOpen(true)}
        />
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Suspense fallback={<LoadingFallback />}>
          {activeTab === 'dashboard' && (
            <FinanceDashboard
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onNavigateToPayments={() => setActiveTab('payments')}
              onOpenAddTransaction={() => setIsGlobalAddOpen(true)}
            />
          )}

          {activeTab === 'transactions' && <TransactionManager />}

          {activeTab === 'payments' && <PaymentManager />}

          {activeTab === 'budgets' && <BudgetManager />}

          {activeTab === 'analytics' && <AnalyticsManager />}

          {activeTab === 'reports' && <ReportsManager />}

          {activeTab === 'settings' && <SettingsManager />}

          {activeTab === 'developers' && <DevelopersPage />}
        </Suspense>
      </main>

      {/* Global Add Transaction Modal */}
      {isGlobalAddOpen && user && (
        <Suspense fallback={null}>
          <TransactionModal
            isOpen={isGlobalAddOpen}
            onClose={() => setIsGlobalAddOpen(false)}
            userId={user.id}
            currency={currency}
            categories={categories}
            onTransactionSaved={() => {
              notifyTransactionUpdated();
            }}
            onCategoryAdded={(newCat) => setCategories(prev => [...prev, newCat])}
          />
        </Suspense>
      )}

      {/* Premium Liquid Glass Footer */}
      <footer className="mt-auto border-t border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-[#070B10]/60 backdrop-blur-xl py-6 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-slate-900 dark:text-white">
              DuesDock
            </span>
            <span>•</span>
            <span>Liquid Glass Wealth Workspace</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('developers')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Developers & Architecture
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Settings
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Google OAuth + Supabase RLS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="p-16 flex items-center justify-center gap-2 text-xs text-[#667085] dark:text-[#9AA6B2]">
      <Loader2 className="w-5 h-5 animate-spin text-[#008F62] dark:text-[#00C78A]" />
      <span>Loading content...</span>
    </div>
  );
}

export default App;
