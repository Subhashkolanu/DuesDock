export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ClubRole = 'owner' | 'treasurer' | 'collector' | 'member';
export type CampaignStatus = 'active' | 'closed' | 'archived';
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | 'overdue';
export type PaymentMode = 'upi' | 'cash' | 'bank_transfer' | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          student_id: string | null;
          college_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          student_id?: string | null;
          college_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          student_id?: string | null;
          college_name?: string | null;
          created_at?: string;
        };
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          upi_id: string;
          upi_payee_name: string;
          college_name: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          upi_id: string;
          upi_payee_name: string;
          college_name?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          upi_id?: string;
          upi_payee_name?: string;
          college_name?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      club_members: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: ClubRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          role?: ClubRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          user_id?: string;
          role?: ClubRole;
          joined_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          description: string | null;
          target_amount_per_person: number;
          due_date: string;
          allow_custom_amount: boolean;
          status: CampaignStatus;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          title: string;
          description?: string | null;
          target_amount_per_person: number;
          due_date: string;
          allow_custom_amount?: boolean;
          status?: CampaignStatus;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          title?: string;
          description?: string | null;
          target_amount_per_person?: number;
          due_date?: string;
          allow_custom_amount?: boolean;
          status?: CampaignStatus;
          created_by?: string;
          created_at?: string;
        };
      };
      dues_records: {
        Row: {
          id: string;
          campaign_id: string;
          club_id: string;
          member_id: string | null;
          payer_name: string;
          payer_student_id: string | null;
          payer_email: string | null;
          payer_phone: string | null;
          amount_due: number;
          amount_paid: number;
          status: PaymentStatus;
          payment_mode: PaymentMode;
          utr_reference: string | null;
          proof_image_url: string | null;
          submitted_at: string | null;
          verified_by: string | null;
          verified_at: string | null;
          rejection_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          club_id: string;
          member_id?: string | null;
          payer_name: string;
          payer_student_id?: string | null;
          payer_email?: string | null;
          payer_phone?: string | null;
          amount_due: number;
          amount_paid?: number;
          status?: PaymentStatus;
          payment_mode?: PaymentMode;
          utr_reference?: string | null;
          proof_image_url?: string | null;
          submitted_at?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          club_id?: string;
          member_id?: string | null;
          payer_name?: string;
          payer_student_id?: string | null;
          payer_email?: string | null;
          payer_phone?: string | null;
          amount_due?: number;
          amount_paid?: number;
          status?: PaymentStatus;
          payment_mode?: PaymentMode;
          utr_reference?: string | null;
          proof_image_url?: string | null;
          submitted_at?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_notes?: string | null;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          club_id: string;
          campaign_id: string | null;
          title: string;
          amount: number;
          category: string;
          receipt_url: string | null;
          expense_date: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          campaign_id?: string | null;
          title: string;
          amount: number;
          category: string;
          receipt_url?: string | null;
          expense_date?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          campaign_id?: string | null;
          title?: string;
          amount?: number;
          category?: string;
          receipt_url?: string | null;
          expense_date?: string;
          created_by?: string;
          created_at?: string;
        };
      };
    };
  };
}
