-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  default_currency text default 'USD',
  theme_preference text default 'system',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by owner." on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- CATEGORIES
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text,
  type text not null check (type in ('income', 'expense')),
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;
create policy "Categories viewable by owner" on public.categories for select using (auth.uid() = user_id);
create policy "Categories insertable by owner" on public.categories for insert with check (auth.uid() = user_id);
create policy "Categories updatable by owner" on public.categories for update using (auth.uid() = user_id);
create policy "Categories deletable by owner" on public.categories for delete using (auth.uid() = user_id);

-- SPLIT GROUPS
create table public.split_groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  total_amount numeric(12,2) not null,
  event_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.split_groups enable row level security;
create policy "Split groups viewable by owner" on public.split_groups for select using (auth.uid() = user_id);
create policy "Split groups insertable by owner" on public.split_groups for insert with check (auth.uid() = user_id);
create policy "Split groups updatable by owner" on public.split_groups for update using (auth.uid() = user_id);
create policy "Split groups deletable by owner" on public.split_groups for delete using (auth.uid() = user_id);

-- TRANSACTIONS
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories on delete set null,
  remarks text,
  amount numeric(12,2) not null,
  quantity integer default 1,
  total_amount numeric(12,2) not null,
  transaction_date timestamp with time zone not null,
  currency text default 'USD',
  tags text[],
  recurring_id uuid, -- Reference to recurring_transactions (can add foreign key later)
  split_group_id uuid references public.split_groups on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create policy "Transactions viewable by owner" on public.transactions for select using (auth.uid() = user_id);
create policy "Transactions insertable by owner" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Transactions updatable by owner" on public.transactions for update using (auth.uid() = user_id);
create policy "Transactions deletable by owner" on public.transactions for delete using (auth.uid() = user_id);

-- BUDGETS
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references public.categories on delete cascade not null,
  limit_amount numeric(12,2) not null,
  period text not null check (period in ('weekly', 'monthly', 'yearly')),
  alert_threshold numeric(5,2) default 80.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.budgets enable row level security;
create policy "Budgets viewable by owner" on public.budgets for select using (auth.uid() = user_id);
create policy "Budgets insertable by owner" on public.budgets for insert with check (auth.uid() = user_id);
create policy "Budgets updatable by owner" on public.budgets for update using (auth.uid() = user_id);
create policy "Budgets deletable by owner" on public.budgets for delete using (auth.uid() = user_id);

-- RECURRING TRANSACTIONS
create table public.recurring_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  amount numeric(12,2) not null,
  category_id uuid references public.categories on delete set null,
  type text not null check (type in ('income', 'expense')),
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  next_run_date date not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recurring_transactions enable row level security;
create policy "Recurring transactions viewable by owner" on public.recurring_transactions for select using (auth.uid() = user_id);
create policy "Recurring transactions insertable by owner" on public.recurring_transactions for insert with check (auth.uid() = user_id);
create policy "Recurring transactions updatable by owner" on public.recurring_transactions for update using (auth.uid() = user_id);
create policy "Recurring transactions deletable by owner" on public.recurring_transactions for delete using (auth.uid() = user_id);

-- SPLIT MEMBERS
create table public.split_members (
  id uuid default uuid_generate_v4() primary key,
  split_group_id uuid references public.split_groups on delete cascade not null,
  member_name text not null,
  owed_amount numeric(12,2) default 0,
  paid_amount numeric(12,2) default 0,
  status text not null check (status in ('pending', 'settled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.split_members enable row level security;
-- Policies based on split_group owner
create policy "Split members viewable by group owner" on public.split_members for select using (
  exists (select 1 from public.split_groups where id = split_group_id and user_id = auth.uid())
);
create policy "Split members insertable by group owner" on public.split_members for insert with check (
  exists (select 1 from public.split_groups where id = split_group_id and user_id = auth.uid())
);
create policy "Split members updatable by group owner" on public.split_members for update using (
  exists (select 1 from public.split_groups where id = split_group_id and user_id = auth.uid())
);
create policy "Split members deletable by group owner" on public.split_members for delete using (
  exists (select 1 from public.split_groups where id = split_group_id and user_id = auth.uid())
);

-- RECEIPTS
create table public.receipts (
  id uuid default uuid_generate_v4() primary key,
  transaction_id uuid references public.transactions on delete cascade not null,
  file_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.receipts enable row level security;
-- Policies based on transaction owner
create policy "Receipts viewable by transaction owner" on public.receipts for select using (
  exists (select 1 from public.transactions where id = transaction_id and user_id = auth.uid())
);
create policy "Receipts insertable by transaction owner" on public.receipts for insert with check (
  exists (select 1 from public.transactions where id = transaction_id and user_id = auth.uid())
);
create policy "Receipts updatable by transaction owner" on public.receipts for update using (
  exists (select 1 from public.transactions where id = transaction_id and user_id = auth.uid())
);
create policy "Receipts deletable by transaction owner" on public.receipts for delete using (
  exists (select 1 from public.transactions where id = transaction_id and user_id = auth.uid())
);
