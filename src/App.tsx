import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { NavigationTabs, type TabKey } from '@/components/layout/NavigationTabs';
import { DashboardOverview } from '@/features/dashboard/DashboardOverview';
import { CampaignListPage } from '@/features/campaigns/CampaignListPage';
import { DuesVerificationTable } from '@/features/dues/DuesVerificationTable';
import { MemberDirectory } from '@/features/members/MemberDirectory';
import { ExpenseTracker } from '@/features/expenses/ExpenseTracker';
import { PublicPayPortal } from '@/features/dues/PublicPayPortal';
import { CreateCampaignModal } from '@/features/campaigns/CreateCampaignModal';
import { QuickScanModal } from '@/components/qr/QuickScanModal';
import { useClubStore } from '@/stores/useClubStore';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [quickScanCampaignId, setQuickScanCampaignId] = useState<string | undefined>();

  const currentClub = useClubStore((s) => s.currentClub);

  const handleOpenPayForCampaign = (campaignId: string) => {
    setQuickScanCampaignId(campaignId);
    setIsPayModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenPayModal={() => {
          setQuickScanCampaignId(undefined);
          setIsPayModalOpen(true);
        }}
        onOpenCreateCampaign={() => setIsCreateCampaignOpen(true)}
      />

      {/* Navigation Sub-header */}
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            onNavigate={setActiveTab}
            onOpenCreateCampaign={() => setIsCreateCampaignOpen(true)}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignListPage
            onNavigate={setActiveTab}
            onOpenPayForCampaign={handleOpenPayForCampaign}
          />
        )}

        {activeTab === 'verification' && <DuesVerificationTable />}

        {activeTab === 'members' && <MemberDirectory />}

        {activeTab === 'expenses' && <ExpenseTracker />}

        {activeTab === 'portal' && (
          <PublicPayPortal
            initialCampaignId={quickScanCampaignId}
            onBackToDashboard={() => setActiveTab('overview')}
          />
        )}
      </main>

      {/* Global Modals */}
      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
      />

      <QuickScanModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        campaignId={quickScanCampaignId}
        onNavigateToPortal={() => setActiveTab('portal')}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight">DuesDock</span>
            <span>•</span>
            <span>Collaborative Payment Tracking for College Clubs</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Modern Emerald Theme</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Supabase Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
