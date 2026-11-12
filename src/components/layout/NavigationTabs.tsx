import React from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Layers,
  CheckCircle2,
  Users,
  Receipt,
  Smartphone,
} from 'lucide-react';
import { useClubStore } from '@/stores/useClubStore';

export type TabKey = 'overview' | 'campaigns' | 'verification' | 'members' | 'expenses' | 'portal';

export interface NavigationTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const duesRecords = useClubStore((s) => s.duesRecords);
  const pendingVerificationCount = duesRecords.filter(
    (r) => r.status === 'submitted'
  ).length;

  const tabs: Array<{
    id: TabKey;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'campaigns',
      label: 'Dues Campaigns',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'verification',
      label: 'Verification Queue',
      icon: <CheckCircle2 className="w-4 h-4" />,
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
    },
    {
      id: 'members',
      label: 'Members Roster',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'expenses',
      label: 'Treasury & Expenses',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'portal',
      label: 'Student Pay Portal',
      icon: <Smartphone className="w-4 h-4" />,
    },
  ];

  return (
    <div className="border-b border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all shrink-0',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
