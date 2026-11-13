import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import type { CurrencyCode } from '@/types/database.types';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  FileSpreadsheet,
  Plus,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Wallet,
  Check,
} from 'lucide-react';

export type FinanceTabKey = 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'reports';

export interface NavbarProps {
  activeTab: FinanceTabKey;
  onTabChange: (tab: FinanceTabKey) => void;
  onOpenAddTransaction: () => void;
}

const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; label: string }> = [
  { code: 'INR', label: 'INR (₹)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'CAD', label: 'CAD (CA$)' },
  { code: 'AUD', label: 'AUD (A$)' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddTransaction,
}) => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';

  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setIsCurrencyMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencySelect = async (newCurrency: CurrencyCode) => {
    setIsCurrencyMenuOpen(false);
    if (newCurrency !== currency) {
      try {
        await updateProfile({ preferred_currency: newCurrency });
      } catch (err) {
        console.error('Failed to update currency:', err);
      }
    }
  };

  const navItems: Array<{ id: FinanceTabKey; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt className="w-4 h-4" /> },
    { id: 'budgets', label: 'Budgets & Limits', icon: <PieChart className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Export', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#171D23]/95 backdrop-blur-md border-b border-[#E5E9EF] dark:border-[#303943] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* 1. Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Logo size="md" />
          </div>

          {/* 2. Center: Desktop Horizontal Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] font-semibold'
                      : 'text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA] hover:bg-[#F1F4F6] dark:hover:bg-[#202830]'
                  }`}
                >
                  <span className={isActive ? 'text-[#008F62] dark:text-[#00C78A]' : 'text-current'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. Right: Currency, Theme Toggle, Add Action, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Currency Selector Dropdown (Desktop) */}
            <div className="relative hidden sm:block" ref={currencyMenuRef}>
              <button
                type="button"
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#F7F8FA] dark:bg-[#101418] text-[#17212B] dark:text-[#F5F7FA] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors cursor-pointer"
                title="Select Preferred Currency"
              >
                <Wallet className="w-3.5 h-3.5 text-[#008F62] dark:text-[#00C78A]" />
                <span>{currency} ({CURRENCY_SYMBOLS[currency]})</span>
                <ChevronDown className="w-3 h-3 text-[#667085] dark:text-[#9AA6B2]" />
              </button>

              {isCurrencyMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#FFFFFF] dark:bg-[#171D23] border border-[#E5E9EF] dark:border-[#303943] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#667085] dark:text-[#9AA6B2] uppercase tracking-wider border-b border-[#E5E9EF] dark:border-[#303943]">
                    Display Currency
                  </div>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => handleCurrencySelect(opt.code)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left hover:bg-[#F1F4F6] dark:hover:bg-[#202830] text-[#17212B] dark:text-[#F5F7FA] cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      {currency === opt.code && (
                        <Check className="w-3.5 h-3.5 text-[#008F62] dark:text-[#00C78A]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Add Transaction Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAddTransaction}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>

            {/* Profile Menu Dropdown */}
            <div className="relative hidden sm:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors cursor-pointer"
                title="Account Settings"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-8 h-8 rounded-full border border-[#E5E9EF] dark:border-[#303943] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/20 text-[#008F62] dark:text-[#00C78A] font-semibold text-xs flex items-center justify-center border border-[#008F62]/20 dark:border-[#00C78A]/30">
                    {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#667085] dark:text-[#9AA6B2]" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#FFFFFF] dark:bg-[#171D23] border border-[#E5E9EF] dark:border-[#303943] shadow-lg p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#E5E9EF] dark:border-[#303943] mb-1">
                    <p className="text-sm font-semibold text-[#17212B] dark:text-[#F5F7FA] truncate">
                      {profile?.full_name || 'Personal Account'}
                    </p>
                    <p className="text-xs text-[#667085] dark:text-[#9AA6B2] truncate font-mono">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#DC5252] dark:text-[#FF6666] hover:bg-[#DC5252]/10 dark:hover:bg-[#FF6666]/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#171D23] px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          {/* User info on mobile */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#101418] border border-[#E5E9EF] dark:border-[#303943]">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#008F62]/10 dark:bg-[#00C78A]/20 text-[#008F62] dark:text-[#00C78A] font-semibold text-sm flex items-center justify-center">
                {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-[#17212B] dark:text-[#F5F7FA] truncate">
                {profile?.full_name || 'Personal Account'}
              </p>
              <p className="text-xs text-[#667085] dark:text-[#9AA6B2] truncate font-mono">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] font-semibold'
                      : 'text-[#667085] dark:text-[#9AA6B2] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] text-[#17212B] dark:text-[#F5F7FA]'
                  }`}
                >
                  <span className={isActive ? 'text-[#008F62] dark:text-[#00C78A]' : 'text-current'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Currency selection on mobile */}
          <div className="pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
            <span className="text-xs font-semibold text-[#667085] dark:text-[#9AA6B2] block mb-2">
              Currency
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => handleCurrencySelect(opt.code)}
                  className={`py-1.5 px-2 text-xs font-mono rounded-lg border text-center transition-colors ${
                    currency === opt.code
                      ? 'border-[#008F62] dark:border-[#00C78A] bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] font-bold'
                      : 'border-[#E5E9EF] dark:border-[#303943] text-[#667085] dark:text-[#9AA6B2]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sign Out on mobile */}
          <div className="pt-2 border-t border-[#E5E9EF] dark:border-[#303943]">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#DC5252] dark:text-[#FF6666] hover:bg-[#DC5252]/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
