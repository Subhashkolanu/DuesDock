import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
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
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#101418] text-[#17212B] dark:text-[#F5F7FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors relative selection:bg-[#008F62] selection:text-white dark:selection:bg-[#00C78A] dark:selection:text-[#101418]">
      {/* Top Floating Theme Toggle */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8">
        <ThemeToggle showLabel />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <Logo size="xl" showText={false} />
        </div>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
          Dues<span className="text-[#008F62] dark:text-[#00C78A]">Dock</span>
        </h1>
        <p className="mt-2 text-sm text-[#667085] dark:text-[#9AA6B2]">
          Track Every Expense. Understand Every Rupee.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-7 sm:p-8 border border-[#E5E9EF] dark:border-[#303943] fintech-card-shadow bg-[#FFFFFF] dark:bg-[#171D23] rounded-2xl">
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-[#D99A27]/10 border border-[#D99A27]/20 text-[#17212B] dark:text-[#F5F7FA] text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#D99A27] dark:text-[#F0B94B] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">
                  Supabase Setup Notice
                </span>
                To enable live Google OAuth authentication, configure{' '}
                <code className="bg-[#F1F4F6] dark:bg-[#202830] px-1.5 py-0.5 rounded text-[11px] font-mono">
                  VITE_SUPABASE_URL
                </code>{' '}
                and{' '}
                <code className="bg-[#F1F4F6] dark:bg-[#202830] px-1.5 py-0.5 rounded text-[11px] font-mono">
                  VITE_SUPABASE_ANON_KEY
                </code>{' '}
                in your <code className="font-mono">.env</code> file.
              </div>
            </div>
          )}

          {(errorMessage || authError) && (
            <div className="mb-6 p-3 rounded-xl bg-[#DC5252]/10 border border-[#DC5252]/20 text-[#DC5252] dark:text-[#FF6666] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage || authError}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-heading font-semibold text-lg text-[#17212B] dark:text-[#F5F7FA]">
                Welcome Back
              </h2>
              <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-1">
                Sign in securely to your personal wealth management workspace
              </p>
            </div>

            {/* Official Google OAuth Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-[#FFFFFF] dark:bg-[#202830] hover:bg-[#F7F8FA] dark:hover:bg-[#28323C] text-[#17212B] dark:text-[#F5F7FA] font-medium text-sm px-4 py-3 rounded-xl border border-[#E5E9EF] dark:border-[#303943] shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#008F62]/20 dark:focus:ring-[#00C78A]/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
            <div className="pt-4 border-t border-[#E5E9EF] dark:border-[#303943] space-y-2 text-xs text-[#667085] dark:text-[#9AA6B2]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A] shrink-0" />
                <span>Private & isolated with PostgreSQL Row Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A] shrink-0" />
                <span>Multi-currency tracking: INR, USD, EUR, GBP, CAD, AUD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A] shrink-0" />
                <span>Audit-ready CSV ledgers & printable statements</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
          <span>Encrypted Supabase OAuth • Strictly No Secret Keys In Client</span>
        </div>
      </div>
    </div>
  );
};
