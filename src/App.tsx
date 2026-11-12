import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { Navbar } from '@/components/layout/Navbar';
import { NavigationTabs, type FinanceTabKey } from '@/components/layout/NavigationTabs';
import { FinanceDashboard } from '@/features/dashboard/FinanceDashboard';
import { TransactionManager } from '@/features/transactions/TransactionManager';
import { BudgetManager } from '@/features/budgets/BudgetManager';
import { ReportsManager } from '@/features/reports/ReportsManager';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function App() {
  const { user, profile, isLoading } = useAuth();
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

  return (
    <div className="min-h-screen bg-background text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <div className="no-print">
        <Navbar onOpenAddTransaction={() => setActiveTab('transactions')} />
      </div>

      {/* Navigation Tabs */}
      <div className="no-print">
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {activeTab === 'dashboard' && (
          <FinanceDashboard
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onOpenAddTransaction={() => setActiveTab('transactions')}
          />
        )}

        {activeTab === 'transactions' && <TransactionManager />}

        {activeTab === 'budgets' && <BudgetManager />}

        {activeTab === 'analytics' && (
          <FinanceDashboard
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onOpenAddTransaction={() => setActiveTab('transactions')}
          />
        )}

        {activeTab === 'reports' && <ReportsManager />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 no-print">
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
