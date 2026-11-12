import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, LogOut, Wallet, Plus } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '@/lib/utils';

export interface NavbarProps {
  onOpenAddTransaction?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddTransaction }) => {
  const { user, profile, signOut } = useAuth();
  const currency = profile?.preferred_currency || 'USD';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-extrabold text-lg shadow-emerald shadow-sm">
            DD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                DuesDock
              </span>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Personal
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
              {profile?.full_name || user?.email}
            </p>
          </div>
        </div>

        {/* Currency & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currency} ({CURRENCY_SYMBOLS[currency]})</span>
          </div>

          {onOpenAddTransaction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddTransaction}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              <span>Add Transaction</span>
            </Button>
          )}

          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
            />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
          >
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
