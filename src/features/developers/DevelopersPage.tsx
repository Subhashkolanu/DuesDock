import React from 'react';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/common/Logo';
import {
  Code2,
  Database,
  ShieldCheck,
  Mail,
  ExternalLink,
  Layers,
  Cpu,
  Globe,
  Sparkles,
  Award,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export const DevelopersPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* 1. Hero & Mission Section */}
      <div className="relative overflow-hidden rounded-2xl bg-[#FFFFFF] dark:bg-[#171D23] border border-[#E5E9EF] dark:border-[#303943] p-8 sm:p-10 fintech-card-shadow">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Engineering & Product Architecture</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
              About DuesDock
            </h1>
            <p className="text-sm sm:text-base text-[#667085] dark:text-[#9AA6B2] leading-relaxed">
              DuesDock is an engineer-led personal finance command center and payment tracking platform. Built with strict data isolation, zero mock financial calculations, and high-performance React architecture.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center p-6 bg-[#F7F8FA] dark:bg-[#101418] rounded-2xl border border-[#E5E9EF] dark:border-[#303943]">
            <Logo size="xl" showText={false} />
          </div>
        </div>
      </div>

      {/* 2. Core Pillars / Product Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-heading font-bold text-[#17212B] dark:text-[#F5F7FA]">
            Personal Finance & Wealth Management
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] leading-relaxed">
            Record, categorize, and audit every personal deposit and outflow with multi-currency support (INR, USD, EUR, GBP, CAD, AUD). Features monthly budget limit monitoring, 6-month comparative cash flow trends, category distribution analytics, and CSV / PDF report export capabilities.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 dark:bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-base font-heading font-bold text-[#17212B] dark:text-[#F5F7FA]">
            Payment Obligations & Dues Engine
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] leading-relaxed">
            A dedicated system for tracking payables and receivables. Manages deadlines, installment histories, partial payments, and overdue flags. Clearly distinguishes ongoing payment obligations from completed ledger transactions without double-counting.
          </p>
        </Card>
      </div>

      {/* 3. Verified Developer Profile */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
          <Award className="w-5 h-5 text-[#008F62] dark:text-[#00C78A]" />
          <h2 className="font-heading font-bold text-lg text-[#17212B] dark:text-[#F5F7FA]">
            Developer Profile & Leadership
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#008F62]/10 dark:bg-[#00C78A]/20 border border-[#008F62]/30 dark:border-[#00C78A]/40 text-[#008F62] dark:text-[#00C78A] font-heading font-extrabold text-2xl flex items-center justify-center shadow-xs">
              SS
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-xl text-[#17212B] dark:text-[#F5F7FA]">
                  Sai Subhash Kolanu
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] text-[11px] font-semibold">
                  Lead Developer
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#9AA6B2]">
                Full-Stack Engineer & Product Systems Architect
              </p>
              <p className="text-xs font-mono text-[#667085] dark:text-[#9AA6B2] flex items-center gap-1.5 pt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>2025DCSBT10480@vvitu.ac.in</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Subhashkolanu/DuesDock"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#667085]" />
            </a>
          </div>
        </div>

        {/* Roles and Responsibilities */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-1">
            <span className="text-[11px] font-semibold text-[#008F62] dark:text-[#00C78A] block">
              Frontend & UI/UX
            </span>
            <p className="text-xs text-[#667085] dark:text-[#9AA6B2]">
              React 19, TypeScript architecture, Neo-Brutalist & Modern Emerald design systems, and responsive layouts.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-1">
            <span className="text-[11px] font-semibold text-[#0284C7] dark:text-[#38BDF8] block">
              Database & Security
            </span>
            <p className="text-xs text-[#667085] dark:text-[#9AA6B2]">
              PostgreSQL schema design, Row-Level Security (RLS) data isolation, Google OAuth, and encrypted Supabase Storage.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] space-y-1">
            <span className="text-[11px] font-semibold text-[#D99A27] dark:text-[#F0B94B] block">
              Calculations & QA
            </span>
            <p className="text-xs text-[#667085] dark:text-[#9AA6B2]">
              Airtight cash flow ledgers, partial payment reconciliation, date timezone offset elimination, and bundle optimization.
            </p>
          </div>
        </div>
      </Card>

      {/* 4. Technology Stack & Infrastructure */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E5E9EF] dark:border-[#303943]">
          <Cpu className="w-5 h-5 text-[#008F62] dark:text-[#00C78A]" />
          <h2 className="font-heading font-bold text-lg text-[#17212B] dark:text-[#F5F7FA]">
            Technology Stack & Production Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#17212B] dark:text-[#F5F7FA]">
              <Code2 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
              <span>Frontend Core</span>
            </div>
            <ul className="text-xs text-[#667085] dark:text-[#9AA6B2] space-y-1">
              <li>• React 19.3 & TypeScript</li>
              <li>• Vite 8.3 build bundler</li>
              <li>• Tailwind CSS v4 styling</li>
              <li>• Recharts interactive data viz</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#17212B] dark:text-[#F5F7FA]">
              <Database className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>Database & RLS</span>
            </div>
            <ul className="text-xs text-[#667085] dark:text-[#9AA6B2] space-y-1">
              <li>• PostgreSQL via Supabase</li>
              <li>• Airtight Row-Level Security</li>
              <li>• Cascading foreign keys</li>
              <li>• B-tree performance indexes</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#17212B] dark:text-[#F5F7FA]">
              <ShieldCheck className="w-4 h-4 text-[#059669] dark:text-[#00C78A]" />
              <span>Authentication</span>
            </div>
            <ul className="text-xs text-[#667085] dark:text-[#9AA6B2] space-y-1">
              <li>• Google-Only OAuth 2.0</li>
              <li>• Secure JWT session refresh</li>
              <li>• Private receipts storage</li>
              <li>• Time-limited signed URLs</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#17212B] dark:text-[#F5F7FA]">
              <Globe className="w-4 h-4 text-[#8B5CF6] dark:text-[#C084FC]" />
              <span>Cloud & Deployment</span>
            </div>
            <ul className="text-xs text-[#667085] dark:text-[#9AA6B2] space-y-1">
              <li>• Vercel Edge Hosting</li>
              <li>• Automated CI/CD git triggers</li>
              <li>• Multi-theme dark/light</li>
              <li>• Offline demo localStorage</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 5. Production Details Banner */}
      <div className="p-4 rounded-xl border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#667085] dark:text-[#9AA6B2]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
          <span>Live Deployment: <a href="https://duesdock.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[#008F62] dark:text-[#00C78A] font-semibold underline">duesdock.vercel.app</a></span>
        </div>
        <div className="font-mono text-[11px]">
          Git branch: <span className="font-semibold text-[#17212B] dark:text-[#F5F7FA]">duesdock_initial_setup_plan</span>
        </div>
      </div>
    </div>
  );
};
