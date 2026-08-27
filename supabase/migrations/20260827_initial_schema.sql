-- ==============================================================================
-- FLOWMIND AI — Multi-User Database Schema & Row Level Security (RLS)
-- Phase 6: Authentication & Persistent Workflows
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger to automatically create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. WORKFLOWS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.workflows (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '' not null,
  category text default 'Customer Support' not null,
  status text default 'draft' not null,
  workflow_data jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for fast querying
create index if not exists idx_workflows_user_id on public.workflows(user_id);
create index if not exists idx_workflows_updated_at on public.workflows(updated_at desc);

-- Enable RLS on Workflows
alter table public.workflows enable row level security;

-- Workflows Strict User-Isolation Policies
create policy "Users can select own workflows"
  on public.workflows for select
  using (auth.uid() = user_id);

create policy "Users can insert own workflows"
  on public.workflows for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workflows"
  on public.workflows for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own workflows"
  on public.workflows for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. WORKFLOW EXECUTIONS TABLE (Simulation & Execution History)
-- ------------------------------------------------------------------------------
create table if not exists public.workflow_executions (
  id text primary key,
  workflow_id text references public.workflows(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null,
  execution_data jsonb,
  duration_ms integer default 0,
  started_at timestamptz default now() not null,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists idx_executions_user_id on public.workflow_executions(user_id);

-- Enable RLS on Executions
alter table public.workflow_executions enable row level security;

create policy "Users can select own executions"
  on public.workflow_executions for select
  using (auth.uid() = user_id);

create policy "Users can insert own executions"
  on public.workflow_executions for insert
  with check (auth.uid() = user_id);
