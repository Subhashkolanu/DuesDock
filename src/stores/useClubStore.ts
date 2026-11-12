import { create } from 'zustand';
import type { Database, PaymentStatus, ClubRole } from '@/types/database.types';
import { INITIAL_CLUB, INITIAL_CAMPAIGNS, INITIAL_DUES_RECORDS, INITIAL_EXPENSES } from './mockData';
import confetti from 'canvas-confetti';

type Club = Database['public']['Tables']['clubs']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];
type DuesRecord = Database['public']['Tables']['dues_records']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'];

interface ClubState {
  currentClub: Club;
  campaigns: Campaign[];
  duesRecords: DuesRecord[];
  expenses: Expense[];
  currentRole: ClubRole;
  selectedCampaignId: string | 'all';
  searchQuery: string;
  statusFilter: PaymentStatus | 'all';

  // Actions
  setSelectedCampaignId: (id: string | 'all') => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: PaymentStatus | 'all') => void;
  verifyRecord: (id: string) => void;
  rejectRecord: (id: string, reason: string) => void;
  submitPayment: (record: {
    campaignId: string;
    payerName: string;
    studentId: string;
    email: string;
    amount: number;
    utr: string;
    proofUrl?: string;
  }) => void;
  createCampaign: (campaign: Omit<Campaign, 'id' | 'club_id' | 'created_at' | 'created_by'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'club_id' | 'created_at' | 'created_by'>) => void;
  importMembers: (members: Array<{ name: string; studentId: string; email: string; campaignId: string; amount: number }>) => void;
}

export const useClubStore = create<ClubState>((set, get) => ({
  currentClub: INITIAL_CLUB,
  campaigns: INITIAL_CAMPAIGNS,
  duesRecords: INITIAL_DUES_RECORDS,
  expenses: INITIAL_EXPENSES,
  currentRole: 'treasurer',
  selectedCampaignId: 'all',
  searchQuery: '',
  statusFilter: 'all',

  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  verifyRecord: (id) => {
    set((state) => ({
      duesRecords: state.duesRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'verified',
              amount_paid: r.amount_due,
              verified_at: new Date().toISOString(),
              verified_by: 'user-001',
              rejection_notes: null,
            }
          : r
      ),
    }));

    // Trigger celebratory confetti on verification
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
      });
    } catch {
      // Ignore if confetti is unavailable
    }
  },

  rejectRecord: (id, reason) => {
    set((state) => ({
      duesRecords: state.duesRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              rejection_notes: reason,
              verified_at: new Date().toISOString(),
            }
          : r
      ),
    }));
  },

  submitPayment: ({ campaignId, payerName, studentId, email, amount, utr, proofUrl }) => {
    const newRecord: DuesRecord = {
      id: `due-${Date.now()}`,
      campaign_id: campaignId,
      club_id: get().currentClub.id,
      member_id: null,
      payer_name: payerName,
      payer_student_id: studentId,
      payer_email: email,
      payer_phone: null,
      amount_due: amount,
      amount_paid: amount,
      status: 'submitted',
      payment_mode: 'upi',
      utr_reference: utr,
      proof_image_url: proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      submitted_at: new Date().toISOString(),
      verified_by: null,
      verified_at: null,
      rejection_notes: null,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      duesRecords: [newRecord, ...state.duesRecords],
    }));

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#34D399', '#F59E0B'],
      });
    } catch {
      // Ignore
    }
  },

  createCampaign: (data) => {
    const newCampaign: Campaign = {
      ...data,
      id: `camp-${Date.now()}`,
      club_id: get().currentClub.id,
      created_by: 'user-001',
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      campaigns: [newCampaign, ...state.campaigns],
    }));
  },

  addExpense: (data) => {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      club_id: get().currentClub.id,
      created_by: 'user-001',
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      expenses: [newExpense, ...state.expenses],
    }));
  },

  importMembers: (members) => {
    const newRecords: DuesRecord[] = members.map((m, index) => ({
      id: `due-import-${Date.now()}-${index}`,
      campaign_id: m.campaignId,
      club_id: get().currentClub.id,
      member_id: null,
      payer_name: m.name,
      payer_student_id: m.studentId,
      payer_email: m.email,
      payer_phone: null,
      amount_due: m.amount,
      amount_paid: 0,
      status: 'pending',
      payment_mode: 'upi',
      utr_reference: null,
      proof_image_url: null,
      submitted_at: null,
      verified_by: null,
      verified_at: null,
      rejection_notes: null,
      created_at: new Date().toISOString(),
    }));

    set((state) => ({
      duesRecords: [...newRecords, ...state.duesRecords],
    }));
  },
}));
