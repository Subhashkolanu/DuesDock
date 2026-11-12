import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Lock,
  PieChart,
  FileSpreadsheet,
  AlertCircle,
  Receipt,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, isConfigured, error: authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await signIn();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize Google Sign-In');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* App Logo */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-extrabold text-2xl shadow-emerald shadow-md mb-4">
          DD
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          DuesDock
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 font-medium">
          Personal Finance & Intelligent Expense Tracker
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-card border-slate-200">
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Supabase Setup Notice</span>
                To enable live Google OAuth authentication, configure{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">
                  VITE_SUPABASE_URL
                </code>{' '}
                and{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">
                  VITE_SUPABASE_ANON_KEY
                </code>{' '}
                in your <code className="font-mono">.env</code> file, and enable Google in your Supabase Auth Providers.
              </div>
            </div>
          )}

          {(errorMessage || authError) && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage || authError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Authenticate securely using your Google account. Zero passwords to remember.
              </p>
            </div>

            {/* Official Google OAuth Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-3 rounded-xl border border-slate-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed hover:border-slate-400 active:scale-[0.99]"
            >
              {/* Official Google Icon SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Isolated data with PostgreSQL Row Level Security (RLS)</span>
              </div>
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom category budgets, income vs expense tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Encrypted private receipt storage & PDF export</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Assurance Banner */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected with 256-bit SSL encryption & Google OAuth 2.0</span>
        </div>
      </div>
    </div>
  );
};
