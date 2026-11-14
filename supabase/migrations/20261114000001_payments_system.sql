-- ================================================================
-- DUESDOCK PAYMENT TRACKING SYSTEM MIGRATION
-- Migration: 20261114000001_payments_system.sql
-- Additive & Non-destructive: Creates payments & payment_records tables
-- Strict PostgreSQL RLS Isolation: Every user can only access their own payments
-- ================================================================

-- 1. PAYMENT OBLIGATIONS TABLE (Payables & Receivables)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  party_name text not null, -- Person, merchant, or organization
  direction text not null check (direction in ('payable', 'receivable')),
  total_amount numeric(12, 2) not null check (total_amount > 0),
  paid_amount numeric(12, 2) default 0.00 not null check (paid_amount >= 0),
  due_date date not null,
  category_id uuid references public.categories(id) on delete set null,
  status text not null check (status in ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled')) default 'pending',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. PAYMENT INSTALLMENTS / RECORDS TABLE
create table if not exists public.payment_records (
  id uuid default gen_random_uuid() primary key,
  payment_id uuid references public.payments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date default current_date not null,
  payment_method text check (payment_method in ('credit_card', 'debit_card', 'cash', 'bank_transfer', 'upi', 'other')) default 'bank_transfer' not null,
  notes text,
  created_at timestamptz default now() not null
);

-- 3. PERFORMANCE INDEXES
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_due_date on public.payments(due_date);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payment_records_payment_id on public.payment_records(payment_id);
create index if not exists idx_payment_records_user_id on public.payment_records(user_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.payments enable row level security;
alter table public.payment_records enable row level security;

-- PAYMENTS RLS
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own payments" on public.payments;
create policy "Users can insert own payments"
  on public.payments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own payments" on public.payments;
create policy "Users can update own payments"
  on public.payments for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own payments" on public.payments;
create policy "Users can delete own payments"
  on public.payments for delete
  to authenticated
  using (auth.uid() = user_id);

-- PAYMENT RECORDS RLS
drop policy if exists "Users can view own payment records" on public.payment_records;
create policy "Users can view own payment records"
  on public.payment_records for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own payment records" on public.payment_records;
create policy "Users can insert own payment records"
  on public.payment_records for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own payment records" on public.payment_records;
create policy "Users can delete own payment records"
  on public.payment_records for delete
  to authenticated
  using (auth.uid() = user_id);
