import React, { useState } from 'react';
import { useClubStore } from '@/stores/useClubStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import {
  Calendar,
  Users,
  PlusCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { CreateCampaignModal } from './CreateCampaignModal';
import type { TabKey } from '@/components/layout/NavigationTabs';

export interface CampaignListPageProps {
  onNavigate: (tab: TabKey) => void;
  onOpenPayForCampaign: (campaignId: string) => void;
}

export const CampaignListPage: React.FC<CampaignListPageProps> = ({
  onNavigate,
  onOpenPayForCampaign,
}) => {
  const campaigns = useClubStore((s) => s.campaigns);
  const duesRecords = useClubStore((s) => s.duesRecords);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dues Campaigns
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize event fee collections, membership dues drives, and kit purchases.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Create New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((campaign) => {
          const campaignDues = duesRecords.filter(
            (r) => r.campaign_id === campaign.id
          );
          const verifiedRecords = campaignDues.filter(
            (r) => r.status === 'verified'
          );
          const totalCollected = verifiedRecords.reduce(
            (sum, r) => sum + r.amount_paid,
            0
          );
          const pendingSubmissions = campaignDues.filter(
            (r) => r.status === 'submitted'
          );

          const dueDateObj = new Date(campaign.due_date);
          const isOverdue = dueDateObj < new Date();

          return (
            <Card key={campaign.id} hoverEffect className="flex flex-col justify-between">
              <div>
                <CardHeader className="bg-slate-50/50 pb-3">
                  <Badge variant="emerald" size="sm">
                    {campaign.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                    {formatCurrency(campaign.target_amount_per_person)}
                  </span>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {campaign.title}
                    </h3>
                    {campaign.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      Due: {dueDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                        Expired
                      </span>
                    )}
                  </div>

                  {/* Progress Stats */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Total Collected</span>
                      <span className="text-emerald-700">{formatCurrency(totalCollected)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{verifiedRecords.length} Paid Members</span>
                      {pendingSubmissions.length > 0 && (
                        <span className="text-amber-600 font-medium">
                          {pendingSubmissions.length} awaiting verification
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => onNavigate('verification')}
                >
                  View Ledger
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => onOpenPayForCampaign(campaign.id)}
                  leftIcon={<QrCode className="w-3.5 h-3.5" />}
                >
                  Pay QR
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <CreateCampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
