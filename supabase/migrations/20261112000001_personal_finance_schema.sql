-- ================================================================
-- DUESDOCK PERSONAL FINANCE & EXPENSE TRACKER MIGRATION
-- Migration: 20261112000001_personal_finance_schema.sql
-- Non-destructive: Safe table creation with airtight PostgreSQL RLS
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USER PROFILES & ONBOARDING PREFERENCES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  preferred_currency text default 'USD' not null check (preferred_currency in ('USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD')),
  monthly_budget_target numeric(12, 2) default 0.00 check (monthly_budget_target >= 0),
  is_onboarded boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. TRANSACTION CATEGORIES (System defaults + user custom categories)
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade, -- NULL for global system defaults
  name text not null,
  type text check (type in ('expense', 'income')) not null,
  icon text default 'Tag' not null,
  color text default '#059669' not null,
  is_system boolean default false not null,
  created_at timestamptz default now() not null
);

-- 3. PERSONAL TRANSACTIONS (Income & Expense CRUD)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  type text check (type in ('expense', 'income')) not null,
  amount numeric(12, 2) not null check (amount > 0),
  transaction_date date default current_date not null,
  payment_method text check (payment_method in ('credit_card', 'debit_card', 'cash', 'bank_transfer', 'upi', 'other')) default 'debit_card' not null,
  merchant text,
  notes text,
  receipt_path text, -- Path in private Supabase Storage 'receipts' bucket
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. MONTHLY CATEGORY BUDGETS
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  month text not null, -- Format: 'YYYY-MM', e.g. '2026-11'
  budget_limit numeric(12, 2) not null check (budget_limit >= 0),
  created_at timestamptz default now() not null,
  unique (user_id, category_id, month)
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Every user can only access their own data
-- ================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- PROFILES RLS
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- CATEGORIES RLS
-- Users can see system-defined categories OR categories they created
drop policy if exists "Categories viewable by system or creator" on public.categories;
create policy "Categories viewable by system or creator"
  on public.categories for select
  to authenticated
  using (is_system = true or auth.uid() = user_id);

drop policy if exists "Users can insert custom categories" on public.categories;
create policy "Users can insert custom categories"
  on public.categories for insert
  to authenticated
  with check (auth.uid() = user_id and is_system = false);

drop policy if exists "Users can update own custom categories" on public.categories;
create policy "Users can update own custom categories"
  on public.categories for update
  to authenticated
  using (auth.uid() = user_id and is_system = false);

drop policy if exists "Users can delete own custom categories" on public.categories;
create policy "Users can delete own custom categories"
  on public.categories for delete
  to authenticated
  using (auth.uid() = user_id and is_system = false);

-- TRANSACTIONS RLS
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
  on public.transactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- BUDGETS RLS
drop policy if exists "Users can view own budgets" on public.budgets;
create policy "Users can view own budgets"
  on public.budgets for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own budgets" on public.budgets;
create policy "Users can insert own budgets"
  on public.budgets for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own budgets" on public.budgets;
create policy "Users can update own budgets"
  on public.budgets for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own budgets" on public.budgets;
create policy "Users can delete own budgets"
  on public.budgets for delete
  to authenticated
  using (auth.uid() = user_id);

-- ================================================================
-- STORAGE BUCKET FOR RECEIPTS (Private with RLS)
-- ================================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own receipts" on storage.objects;
create policy "Users can upload own receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can view own receipts" on storage.objects;
create policy "Users can view own receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own receipts" on storage.objects;
create policy "Users can delete own receipts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ================================================================
-- GOOGLE USER SIGNUP TRIGGER
-- ================================================================

create or replace function public.handle_new_google_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, preferred_currency, is_onboarded)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'USD',
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_google_user();

-- ================================================================
-- SEED DEFAULT SYSTEM CATEGORIES
-- ================================================================

insert into public.categories (name, type, icon, color, is_system) values
  ('Food & Dining', 'expense', 'Utensils', '#F59E0B', true),
  ('Groceries', 'expense', 'ShoppingCart', '#10B981', true),
  ('Housing & Rent', 'expense', 'Home', '#6366F1', true),
  ('Utilities & Bills', 'expense', 'Zap', '#06B6D4', true),
  ('Transportation', 'expense', 'Car', '#EC4899', true),
  ('Entertainment', 'expense', 'Film', '#8B5CF6', true),
  ('Health & Fitness', 'expense', 'Activity', '#EF4444', true),
  ('Shopping', 'expense', 'ShoppingBag', '#F97316', true),
  ('Salary', 'income', 'Briefcase', '#059669', true),
  ('Freelance / Side Gig', 'income', 'Laptop', '#14B8A6', true),
  ('Investments / Dividends', 'income', 'TrendingUp', '#3B82F6', true),
  ('Other Expense', 'expense', 'MoreHorizontal', '#64748B', true),
  ('Other Income', 'income', 'ArrowDownLeft', '#059669', true)
on conflict do nothing;
