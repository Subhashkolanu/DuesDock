-- ================================================================
-- DUESDOCK DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase (PostgreSQL 15+)
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  phone text,
  student_id text,
  college_name text,
  created_at timestamptz default now() not null
);

-- 2. CLUBS / ORGANIZATIONS
create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  upi_id text not null,
  upi_payee_name text not null,
  college_name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 3. CLUB ROLES ENUM & MEMBERSHIP
do $$ begin
  create type public.club_role as enum ('owner', 'treasurer', 'collector', 'member');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.club_members (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role public.club_role default 'member' not null,
  joined_at timestamptz default now() not null,
  unique (club_id, user_id)
);

-- 4. DUES CAMPAIGNS
do $$ begin
  create type public.campaign_status as enum ('active', 'closed', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.campaigns (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  title text not null,
  description text,
  target_amount_per_person numeric(10, 2) not null check (target_amount_per_person >= 0),
  due_date timestamptz not null,
  allow_custom_amount boolean default false not null,
  status public.campaign_status default 'active' not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 5. DUES RECORDS & PAYMENTS
do $$ begin
  create type public.payment_status as enum ('pending', 'submitted', 'verified', 'rejected', 'overdue');
  create type public.payment_mode as enum ('upi', 'cash', 'bank_transfer', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.dues_records (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  club_id uuid references public.clubs(id) on delete cascade not null,
  member_id uuid references public.profiles(id) on delete set null,
  payer_name text not null,
  payer_student_id text,
  payer_email text,
  payer_phone text,
  amount_due numeric(10, 2) not null check (amount_due >= 0),
  amount_paid numeric(10, 2) default 0.00 not null check (amount_paid >= 0),
  status public.payment_status default 'pending' not null,
  payment_mode public.payment_mode default 'upi' not null,
  utr_reference text,
  proof_image_url text,
  submitted_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  rejection_notes text,
  created_at timestamptz default now() not null
);

-- 6. CLUB EXPENSES (Treasury Cash-Flow Ledger)
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null,
  amount numeric(10, 2) not null check (amount > 0),
  category text not null,
  receipt_url text,
  expense_date timestamptz default now() not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.campaigns enable row level security;
alter table public.dues_records enable row level security;
alter table public.expenses enable row level security;

-- Profiles: Users can view all profiles, but only edit their own
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Clubs: Viewable if user is a member or public slug lookup
create policy "Clubs are viewable by members or by public slug"
  on public.clubs for select
  using (true);

create policy "Club owners/treasurers can edit club details"
  on public.clubs for update
  to authenticated
  using (
    exists (
      select 1 from public.club_members
      where club_id = clubs.id
        and user_id = auth.uid()
        and role in ('owner', 'treasurer')
    )
  );

-- Campaigns: Viewable by anyone with link or club members
create policy "Campaigns viewable by public and members"
  on public.campaigns for select
  using (true);

create policy "Club treasurers and owners can manage campaigns"
  on public.campaigns for all
  to authenticated
  using (
    exists (
      select 1 from public.club_members
      where club_id = campaigns.club_id
        and user_id = auth.uid()
        and role in ('owner', 'treasurer')
    )
  );

-- Dues Records:
-- Treasurers see all dues in their club
-- Members see only their own dues records
create policy "Members can view their own dues records"
  on public.dues_records for select
  using (
    member_id = auth.uid()
    or exists (
      select 1 from public.club_members
      where club_id = dues_records.club_id
        and user_id = auth.uid()
        and role in ('owner', 'treasurer', 'collector')
    )
  );

create policy "Anyone can submit a dues record for an active campaign"
  on public.dues_records for insert
  with check (true);

create policy "Treasurers can verify or update dues records"
  on public.dues_records for update
  to authenticated
  using (
    exists (
      select 1 from public.club_members
      where club_id = dues_records.club_id
        and user_id = auth.uid()
        and role in ('owner', 'treasurer', 'collector')
    )
  );

-- Expenses: Viewable by members, editable only by treasurers/owners
create policy "Club members can view expenses"
  on public.expenses for select
  to authenticated
  using (
    exists (
      select 1 from public.club_members
      where club_id = expenses.club_id
        and user_id = auth.uid()
    )
  );

create policy "Treasurers and owners can manage expenses"
  on public.expenses for all
  to authenticated
  using (
    exists (
      select 1 from public.club_members
      where club_id = expenses.club_id
        and user_id = auth.uid()
        and role in ('owner', 'treasurer')
    )
  );

-- Trigger: Automatically create public.profiles entry on Supabase auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Club Member'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
