import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
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
    <div className="min-h-screen text-slate-900 dark:text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors relative overflow-hidden">
      {/* Ambient background light orbs for liquid refraction */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Theme Toggle */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-10">
        <ThemeToggle showLabel />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <Logo size="xl" showText={false} />
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
          Dues<span className="bg-gradient-to-r from-emerald-600 to-sky-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">Dock</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Track Every Expense. Understand Every Rupee.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="p-7 sm:p-9 glass-card shadow-2xl border border-white/70 dark:border-white/10 rounded-3xl">
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-slate-800 dark:text-slate-200 text-xs flex items-start gap-3 backdrop-blur-md">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">
                  Supabase Setup Notice
                </span>
                To enable live Google OAuth authentication, configure{' '}
                <code className="bg-white/40 dark:bg-black/30 px-1.5 py-0.5 rounded text-[11px] font-mono border border-amber-500/20">
                  VITE_SUPABASE_URL
                </code>{' '}
                and{' '}
                <code className="bg-white/40 dark:bg-black/30 px-1.5 py-0.5 rounded text-[11px] font-mono border border-amber-500/20">
                  VITE_SUPABASE_ANON_KEY
                </code>{' '}
                in your <code className="font-mono">.env</code> file.
              </div>
            </div>
          )}

          {(errorMessage || authError) && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage || authError}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Liquid Glass Workspace</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sign in securely to your personal wealth management workspace
              </p>
            </div>

            {/* Official Google OAuth Sign-In Button in Liquid Glass */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-medium text-sm px-4 py-3.5 rounded-2xl border border-slate-300/80 dark:border-white/15 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] backdrop-blur-md"
            >
              {/* Official Google Icon SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

            {/* Feature Highlights */}
            <div className="pt-5 border-t border-slate-200/60 dark:border-white/10 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Private & isolated with PostgreSQL Row Level Security</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Multi-currency tracking: INR, USD, EUR, GBP, CAD, AUD</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Audit-ready CSV ledgers & printable statements</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Encrypted Supabase OAuth • Strictly No Secret Keys In Client</span>
        </div>
      </div>
    </div>
  );
};
