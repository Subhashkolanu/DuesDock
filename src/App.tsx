import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ShieldCheck,
  LogOut,
  Wallet,
  Loader2,
  PieChart,
  Receipt,
  Layers,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PlusCircle,
} from 'lucide-react';
import { CURRENCY_SYMBOLS, formatCurrency } from '@/lib/utils';

export function App() {
  const { user, profile, isLoading, signOut, isConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'reports'>('dashboard');

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

  const preferredCurrency = profile?.preferred_currency || 'USD';

  return (
    <div className="min-h-screen bg-background text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-extrabold text-lg shadow-emerald shadow-sm">
              DD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  DuesDock
                </span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Personal Finance
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {profile?.full_name || user.email}
              </p>
            </div>
          </div>

          {/* Active Currency & User Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Currency: {preferredCurrency} ({CURRENCY_SYMBOLS[preferredCurrency]})</span>
            </div>

            {profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
            >
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 text-white shadow-emerald relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              Phase 1 Database & Auth Active
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
              Your personal financial workspace is initialized with Google authentication and PostgreSQL Row Level Security.
            </p>
          </div>
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Phase 1 Verification Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 border-emerald-100 bg-emerald-50/30">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Google OAuth Verified</span>
            </div>
            <p className="text-xs text-slate-600">
              User identity <code className="font-mono text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">{user.email}</code> authenticated via Supabase OAuth.
            </p>
          </Card>

          <Card className="p-5 border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>RLS Isolation Enforced</span>
            </div>
            <p className="text-xs text-slate-600">
              User ID <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px] truncate block">{user.id}</code> secures all personal transactions.
            </p>
          </Card>

          <Card className="p-5 border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Storage & Budgets Ready</span>
            </div>
            <p className="text-xs text-slate-600">
              Private Supabase Storage bucket <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">receipts</code> and monthly budget schemas prepared.
            </p>
          </Card>
        </div>
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
