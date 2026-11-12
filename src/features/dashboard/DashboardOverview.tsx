import React from 'react';
import { useClubStore } from '@/stores/useClubStore';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import {
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Users,
} from 'lucide-react';
import type { TabKey } from '@/components/layout/NavigationTabs';

export interface DashboardOverviewProps {
  onNavigate: (tab: TabKey) => void;
  onOpenCreateCampaign: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenCreateCampaign,
}) => {
  const currentClub = useClubStore((s) => s.currentClub);
  const campaigns = useClubStore((s) => s.campaigns);
  const duesRecords = useClubStore((s) => s.duesRecords);
  const expenses = useClubStore((s) => s.expenses);
  const verifyRecord = useClubStore((s) => s.verifyRecord);

  // Financial Calculations
  const totalVerifiedCollections = duesRecords
    .filter((r) => r.status === 'verified')
    .reduce((sum, r) => sum + r.amount_paid, 0);

  const totalSubmittedAwaiting = duesRecords
    .filter((r) => r.status === 'submitted')
    .reduce((sum, r) => sum + r.amount_due, 0);

  const totalPendingUnpaid = duesRecords
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount_due, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netTreasuryBalance = totalVerifiedCollections - totalExpenses;

  const awaitingProofRecords = duesRecords.filter((r) => r.status === 'submitted');

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 text-white shadow-emerald relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            Treasury Command Center
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentClub.name}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Collaborative dues tracking, dynamic UPI collections, and real-time ledger audits for campus events and clubs.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('verification')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Review Verification Queue ({awaitingProofRecords.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('portal')}
              className="border-emerald-600/40 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-900/60"
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              Open Student Payment Portal
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Treasury Balance"
          value={formatCurrency(netTreasuryBalance)}
          subtitle="Collections minus expenses"
          icon={<IndianRupee className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Verified Collections"
          value={formatCurrency(totalVerifiedCollections)}
          subtitle={`${duesRecords.filter((r) => r.status === 'verified').length} verified transactions`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Awaiting Verification"
          value={formatCurrency(totalSubmittedAwaiting)}
          subtitle={`${awaitingProofRecords.length} proofs need approval`}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Total Club Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle={`${expenses.length} disbursements logged`}
          icon={<Receipt className="w-5 h-5" />}
          color="rose"
        />
      </div>

      {/* Active Campaigns & Quick Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Campaigns */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Active Dues Campaigns</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live collection targets and progress for society activities
                </p>
              </div>
              <Button
                variant="soft"
                size="sm"
                onClick={() => onNavigate('campaigns')}
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.map((campaign) => {
                const campaignDues = duesRecords.filter(
                  (r) => r.campaign_id === campaign.id
                );
                const collected = campaignDues
                  .filter((r) => r.status === 'verified')
                  .reduce((sum, r) => sum + r.amount_paid, 0);
                const totalTarget =
                  campaignDues.reduce((sum, r) => sum + r.amount_due, 0) ||
                  campaign.target_amount_per_person * 10;
                const percentage = Math.min(
                  100,
                  Math.round((collected / (totalTarget || 1)) * 100)
                );

                return (
                  <div
                    key={campaign.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {campaign.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {campaign.description}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                        {formatCurrency(campaign.target_amount_per_person)} / person
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                        <span>Collected: {formatCurrency(collected)}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Priority Verification Action Box */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Verification Queue</span>
              </CardTitle>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                {awaitingProofRecords.length} Pending
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {awaitingProofRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All submitted payments have been verified!
                </div>
              ) : (
                awaitingProofRecords.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          {record.payer_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {record.payer_student_id || 'Student'} • UTR: {record.utr_reference}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(record.amount_due)}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs py-1"
                        onClick={() => verifyRecord(record.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs py-1 text-slate-600"
                        onClick={() => onNavigate('verification')}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {awaitingProofRecords.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-slate-600"
                  onClick={() => onNavigate('verification')}
                >
                  View all {awaitingProofRecords.length} submissions →
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
