import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DynamicUpiQr } from '@/components/qr/DynamicUpiQr';
import { useClubStore } from '@/stores/useClubStore';
import { Button } from '@/components/ui/Button';
import { ExternalLink } from 'lucide-react';
import type { TabKey } from '@/components/layout/NavigationTabs';

export interface QuickScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  onNavigateToPortal: () => void;
}

export const QuickScanModal: React.FC<QuickScanModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  onNavigateToPortal,
}) => {
  const currentClub = useClubStore((s) => s.currentClub);
  const campaigns = useClubStore((s) => s.campaigns);

  const [selectedId, setSelectedId] = useState<string>(
    campaignId || campaigns[0]?.id || ''
  );

  const activeCampaign =
    campaigns.find((c) => c.id === (campaignId || selectedId)) || campaigns[0];

  if (!activeCampaign) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan to Pay Dues"
      description={`Official UPI Collection for ${currentClub.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {!campaignId && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Campaign
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} (₹{c.target_amount_per_person})
                </option>
              ))}
            </select>
          </div>
        )}

        <DynamicUpiQr
          upiId={currentClub.upi_id}
          payeeName={currentClub.upi_payee_name}
          amount={activeCampaign.target_amount_per_person}
          transactionNote={`${activeCampaign.title.slice(0, 25)} - DuesDock`}
        />

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onNavigateToPortal();
            }}
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Open Full Student Form
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
