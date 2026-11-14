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

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24M7.86 18.5V10.1H5.06v8.4h2.8z" />
    </svg>
  );
}

interface TeamMember {
  name: string;
  role?: string;
  initials: string;
  avatarUrl?: string;
  email?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Sai Subhash Kolanu',
    role: 'Lead Developer',
    initials: 'SS',
    avatarUrl: '/assets/team/sai-subhash-kolanu.jpg',
    email: 'saisubhash.kolanu@gmail.com',
    githubUrl: 'https://github.com/Subhashkolanu',
    linkedinUrl: 'https://www.linkedin.com/in/sai-subhash-kolanu-358ba0376/',
  },
  {
    name: 'Kolisetty Madhavi Venkata Durga',
    initials: 'MD',
    avatarUrl: '/assets/team/madhavi-kolisetty.jpg',
    githubUrl: 'https://github.com/madhavikolisetty717',
  },
  {
    name: 'Katta Lakshmi Lahari',
    initials: 'LL',
    avatarUrl: '/assets/team/katta-lakshmi-lahari.jpg',
    githubUrl: undefined,
  },
  {
    name: 'Katragadda Anjali Durga',
    initials: 'AD',
    avatarUrl: '/assets/team/katragadda-anjali-durga.jpg',
    githubUrl: 'https://github.com/anjalidurgakatragadda-glitch',
  },
  {
    name: 'Katla Venu',
    initials: 'KV',
    avatarUrl: '/assets/team/katla-venu.jpg',
    githubUrl: 'https://github.com/katlakishore86-oss',
  },
];

function DeveloperAvatar({
  name,
  initials,
  avatarUrl,
}: {
  name: string;
  initials: string;
  avatarUrl?: string;
}) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-white/60 dark:border-white/15 bg-emerald-500/10 dark:bg-emerald-400/15 flex items-center justify-center shadow-md backdrop-blur-sm">
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xl sm:text-2xl font-heading font-extrabold text-[#008F62] dark:text-[#00C78A]">
          {initials}
        </span>
      )}
    </div>
  );
}

export const DevelopersPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* 1. Hero & Mission Section */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-8 sm:p-10 border border-slate-200/70 dark:border-white/10 shadow-lg">
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

          <div className="shrink-0 flex items-center justify-center p-6 bg-slate-100/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-inner">
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

      {/* 3. Engineering Team & Leadership */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/[0.08]">
          <Award className="w-5 h-5 text-[#008F62] dark:text-[#00C78A]" />
          <h2 className="font-heading font-bold text-lg text-[#17212B] dark:text-[#F5F7FA]">
            Engineering Team
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Sai Subhash Kolanu — Lead Developer (Featured top card spanning full width on md+) */}
          <Card className="p-6 sm:p-7 md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <DeveloperAvatar
                  name={teamMembers[0].name}
                  initials={teamMembers[0].initials}
                  avatarUrl={teamMembers[0].avatarUrl}
                />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading font-bold text-xl text-[#17212B] dark:text-[#F5F7FA]">
                      {teamMembers[0].name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] text-xs font-semibold">
                      {teamMembers[0].role}
                    </span>
                  </div>
                  <a
                    href={`mailto:${teamMembers[0].email}`}
                    className="text-xs font-mono text-[#667085] dark:text-[#9AA6B2] hover:text-[#008F62] dark:hover:text-[#00C78A] flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{teamMembers[0].email}</span>
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {teamMembers[0].githubUrl && (
                  <a
                    href={teamMembers[0].githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:bg-slate-100/90 dark:hover:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 transition-all shadow-xs hover:border-emerald-500/40"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#667085]" />
                  </a>
                )}
                {teamMembers[0].linkedinUrl && (
                  <a
                    href={teamMembers[0].linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#0077B5]/30 bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-xs font-medium text-[#0077B5] dark:text-[#38BDF8] transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Team Members 2, 3, 4, 5 (Balanced 2x2 grid) */}
          {teamMembers.slice(1).map((member) => (
            <Card key={member.name} className="p-6 flex flex-col justify-between gap-5">
              <div className="flex items-center gap-4">
                <DeveloperAvatar
                  name={member.name}
                  initials={member.initials}
                  avatarUrl={member.avatarUrl}
                />
                <div className="space-y-1 min-w-0">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#17212B] dark:text-[#F5F7FA] leading-snug">
                    {member.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-200/60 dark:border-white/[0.06] min-h-[42px]">
                {member.githubUrl ? (
                  <a
                    href={member.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:bg-slate-100/90 dark:hover:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 transition-all shadow-xs hover:border-emerald-500/40"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3 h-3 text-[#667085]" />
                  </a>
                ) : (
                  <span className="text-xs text-[#9AA6B2] dark:text-[#667085] italic">
                    GitHub profile pending
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Technology Stack & Production Architecture */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200/60 dark:border-white/[0.08]">
          <Cpu className="w-5 h-5 text-[#008F62] dark:text-[#00C78A]" />
          <h2 className="font-heading font-bold text-lg text-[#17212B] dark:text-[#F5F7FA]">
            Technology Stack & Production Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.08] bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm space-y-2 shadow-xs">
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

          <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.08] bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm space-y-2 shadow-xs">
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

          <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.08] bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm space-y-2 shadow-xs">
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

          <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.08] bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm space-y-2 shadow-xs">
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
      <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.08] bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shadow-xs">
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
