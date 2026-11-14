export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TransactionType = 'expense' | 'income';
export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'bank_transfer'
  | 'upi'
  | 'other';

export type PaymentDirection = 'payable' | 'receivable';
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          preferred_currency: CurrencyCode;
          monthly_budget_target: number;
          is_onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: CurrencyCode;
          monthly_budget_target?: number;
          is_onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_currency?: CurrencyCode;
          monthly_budget_target?: number;
          is_onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: TransactionType;
          icon: string;
          color: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type: TransactionType;
          icon?: string;
          color?: string;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          type?: TransactionType;
          icon?: string;
          color?: string;
          is_system?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          type: TransactionType;
          amount: number;
          transaction_date: string;
          payment_method: PaymentMethod;
          merchant: string | null;
          notes: string | null;
          receipt_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          type: TransactionType;
          amount: number;
          transaction_date?: string;
          payment_method?: PaymentMethod;
          merchant?: string | null;
          notes?: string | null;
          receipt_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          type?: TransactionType;
          amount?: number;
          transaction_date?: string;
          payment_method?: PaymentMethod;
          merchant?: string | null;
          notes?: string | null;
          receipt_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          month: string;
          budget_limit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          month: string;
          budget_limit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          month?: string;
          budget_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          party_name: string;
          direction: PaymentDirection;
          total_amount: number;
          paid_amount: number;
          due_date: string;
          category_id: string | null;
          status: PaymentStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          party_name: string;
          direction: PaymentDirection;
          total_amount: number;
          paid_amount?: number;
          due_date: string;
          category_id?: string | null;
          status?: PaymentStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          party_name?: string;
          direction?: PaymentDirection;
          total_amount?: number;
          paid_amount?: number;
          due_date?: string;
          category_id?: string | null;
          status?: PaymentStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_records: {
        Row: {
          id: string;
          payment_id: string;
          user_id: string;
          amount: number;
          payment_date: string;
          payment_method: PaymentMethod;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          user_id: string;
          amount: number;
          payment_date?: string;
          payment_method?: PaymentMethod;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          user_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: PaymentMethod;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Budget = Database['public']['Tables']['budgets']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentRecord = Database['public']['Tables']['payment_records']['Row'];
