import React from 'react';
import { useClubStore } from '@/stores/useClubStore';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  QrCode,
  PlusCircle,
  ExternalLink,
  Wallet,
} from 'lucide-react';

export interface NavbarProps {
  onOpenPayModal: () => void;
  onOpenCreateCampaign: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPayModal,
  onOpenCreateCampaign,
}) => {
  const currentClub = useClubStore((s) => s.currentClub);
  const duesRecords = useClubStore((s) => s.duesRecords);
  const pendingCount = duesRecords.filter((r) => r.status === 'submitted').length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
        {/* Left: Club Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-bold shadow-emerald shadow-sm">
            DD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                DuesDock
              </span>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
              {currentClub.name}
            </p>
          </div>
        </div>

        {/* Center: UPI Badge */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-lg text-xs">
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500">Treasury UPI:</span>
          <span className="font-mono font-semibold text-slate-800">{currentClub.upi_id}</span>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="soft"
            size="sm"
            onClick={onOpenPayModal}
            leftIcon={<QrCode className="w-4 h-4 text-emerald-600" />}
          >
            <span>Scan to Pay</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateCampaign}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">New Dues Campaign</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
