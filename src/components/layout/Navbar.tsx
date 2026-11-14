import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationBell } from '@/components/common/NotificationBell';
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
  Clock,
  Settings,
  Code2,
} from 'lucide-react';

export type FinanceTabKey =
  | 'dashboard'
  | 'transactions'
  | 'payments'
  | 'budgets'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'developers';

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
    { id: 'payments', label: 'Payments & Dues', icon: <Clock className="w-4 h-4" /> },
    { id: 'budgets', label: 'Budgets', icon: <PieChart className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'developers', label: 'About', icon: <Code2 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#070B10]/75 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 transition-colors shadow-xs">
      {/* Specular top-edge refraction highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/15 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* 1. Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Logo size="md" />
          </div>

          {/* 2. Center: Desktop Horizontal Navigation with Liquid Pills */}
          <nav className="hidden lg:flex items-center space-x-1.5 p-1 rounded-2xl glass-card-subtle" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'liquid-pill-active text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-current'}>
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl border border-slate-300/70 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-white/10 backdrop-blur-md transition-all shadow-xs cursor-pointer"
                title="Select Preferred Currency"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{currency} ({CURRENCY_SYMBOLS[currency]})</span>
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              </button>

              {isCurrencyMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel p-1.5 z-50 animate-in fade-in zoom-in-95 shadow-xl border border-white/60 dark:border-white/10">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/60 dark:border-white/5">
                    Display Currency
                  </div>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => handleCurrencySelect(opt.code)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono rounded-xl text-left hover:bg-emerald-500/10 dark:hover:bg-emerald-400/15 text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      {currency === opt.code && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Reminders */}
            <NotificationBell onNavigateTab={onTabChange} />

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
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-all cursor-pointer"
                title="Account Settings"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-8 h-8 rounded-full border border-emerald-500/30 object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center border border-emerald-500/30">
                    {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl glass-panel p-2 z-50 animate-in fade-in zoom-in-95 space-y-1 shadow-2xl border border-white/60 dark:border-white/10">
                  <div className="px-3 py-2.5 border-b border-slate-200/60 dark:border-white/5 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {profile?.full_name || 'Personal Account'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onTabChange('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      onTabChange('developers');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>About DuesDock</span>
                  </button>
                  <div className="pt-1 border-t border-slate-200/60 dark:border-white/5">
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/70 dark:border-white/10 glass-panel px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2">
          {/* User info on mobile */}
          <div className="flex items-center gap-3 p-3 rounded-2xl glass-card-subtle">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-sm flex items-center justify-center border border-emerald-500/30">
                {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {profile?.full_name || 'Personal Account'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'liquid-pill-active text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-current'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                onTabChange('settings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'liquid-pill-active text-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 text-current" />
              <span>Settings</span>
            </button>
          </div>

          {/* Currency selection on mobile */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-white/5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Currency
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => handleCurrencySelect(opt.code)}
                  className={`py-1.5 px-2 text-xs font-mono rounded-xl border text-center transition-all ${
                    currency === opt.code
                      ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-slate-300/70 dark:border-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sign Out on mobile */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
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
