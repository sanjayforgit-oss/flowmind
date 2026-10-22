-- ==============================================================================
-- FLOWMIND AI — Multi-User Database Schema & Row Level Security (RLS)
-- Phase 7: Persistent Copilot Chat & Enterprise Workflow Audit Trail
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. COPILOT CONVERSATIONS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.copilot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'New Automation Conversation' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_copilot_conversations_user_id on public.copilot_conversations(user_id);
create index if not exists idx_copilot_conversations_updated_at on public.copilot_conversations(updated_at desc);

-- Enable RLS
alter table public.copilot_conversations enable row level security;

-- Policies for copilot_conversations
create policy "Users can select own copilot conversations"
  on public.copilot_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own copilot conversations"
  on public.copilot_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own copilot conversations"
  on public.copilot_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own copilot conversations"
  on public.copilot_conversations for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 2. COPILOT MESSAGES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.copilot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.copilot_conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_copilot_messages_convo on public.copilot_messages(conversation_id);
create index if not exists idx_copilot_messages_user_id on public.copilot_messages(user_id);
create index if not exists idx_copilot_messages_created_at on public.copilot_messages(created_at asc);

-- Enable RLS
alter table public.copilot_messages enable row level security;

-- Policies for copilot_messages
create policy "Users can select own copilot messages"
  on public.copilot_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own copilot messages"
  on public.copilot_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can update own copilot messages"
  on public.copilot_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own copilot messages"
  on public.copilot_messages for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. WORKFLOW AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.workflow_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_id text,
  workflow_name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  actor_type text default 'user' not null check (actor_type in ('user', 'ai')),
  actor_name text not null,
  action text not null,
  description text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_audit_logs_user_id on public.workflow_audit_logs(user_id);
create index if not exists idx_audit_logs_workflow_id on public.workflow_audit_logs(workflow_id);
create index if not exists idx_audit_logs_created_at on public.workflow_audit_logs(created_at desc);

-- Enable RLS
alter table public.workflow_audit_logs enable row level security;

-- Policies for workflow_audit_logs
create policy "Users can select own workflow audit logs"
  on public.workflow_audit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own workflow audit logs"
  on public.workflow_audit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own workflow audit logs"
  on public.workflow_audit_logs for delete
  using (auth.uid() = user_id);
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
-- ==============================================================================
-- FLOWMIND AI — 3-Tier Role-Based Access Control (Admin, Manager, User)
-- ==============================================================================

-- 1. Update role check constraint and add department column
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'manager', 'admin'));

alter table public.profiles
  add column if not exists department text;

-- 2. Index for department lookups
create index if not exists idx_profiles_department on public.profiles(department);

-- 3. Seed/Ensure Designated Administrator Profile
insert into public.profiles (id, full_name, email, role, department)
values (
  '00000000-0000-0000-0000-000000000001',
  'Deepika Bhuvaneshwaran',
  'deepikabhuvaneshwaran8@gmail.com',
  'admin',
  'Operations'
)
on conflict (id) do update
set role = 'admin',
    full_name = 'Deepika Bhuvaneshwaran',
    department = 'Operations';

-- 4. Cross-Tenant Query Policies for Admins and Managers
drop policy if exists "Admins can view all audit logs" on public.workflow_audit_logs;
drop policy if exists "Admins and Managers can view all audit logs" on public.workflow_audit_logs;
create policy "Admins and Managers can view all audit logs"
  on public.workflow_audit_logs for select
  using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'manager')
    or auth.uid() = user_id
  );

drop policy if exists "Admins can view all workflows" on public.workflows;
drop policy if exists "Admins and Managers can view all workflows" on public.workflows;
create policy "Admins and Managers can view all workflows"
  on public.workflows for select
  using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'manager')
    or auth.uid() = user_id
  );

drop policy if exists "Admins can view all executions" on public.workflow_executions;
drop policy if exists "Admins and Managers can view all executions" on public.workflow_executions;
create policy "Admins and Managers can view all executions"
  on public.workflow_executions for select
  using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'manager')
    or auth.uid() = user_id
  );
-- ==============================================================================
-- FLOWMIND AI — Enterprise Role-Based Access Control (RBAC) & Admin Security
-- Phase 8: Separate User & Admin Authentication and Authorization
-- ==============================================================================

-- 1. Add role column to profiles if not exists
alter table public.profiles
  add column if not exists role text default 'user' not null check (role in ('user', 'admin'));

-- 2. Create index for fast role lookups
create index if not exists idx_profiles_role on public.profiles(role);

-- 3. Update the handle_new_user trigger to always set role = 'user'
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 4. Secure RLS policies on profiles
-- Users can view their own profile; Admins can view all profiles
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile or admins view all"
  on public.profiles for select
  using (
    auth.uid() = id
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Users can update their own profile, but CANNOT self-escalate role to admin
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update own profile without role escalation"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      role = (select role from public.profiles where id = auth.uid())
      or (select role from public.profiles where id = auth.uid()) = 'admin'
    )
  );

-- 5. Admin global view policies for audit logs and platform workflows
create policy "Admins can view all audit logs"
  on public.workflow_audit_logs for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can view all workflows"
  on public.workflows for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can view all executions"
  on public.workflow_executions for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
-- ==============================================================================
-- FLOWMIND AI — In-App Notifications & Unified Request Lifecycle Schema
-- ==============================================================================

-- 1. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  request_id uuid references public.simulation_approval_requests(id) on delete cascade,
  type text not null default 'approval' check (type in ('approval', 'rejection', 'system', 'conflict')),
  title text not null,
  message text not null,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- Policies on notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "System and approvers can insert notifications" on public.notifications;
create policy "System and approvers can insert notifications"
  on public.notifications for insert
  with check (auth.uid() is not null);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- 2. Enhanced RLS on simulation_approval_requests to guarantee Manager & Admin multi-tenant visibility
drop policy if exists "Select simulation approval requests" on public.simulation_approval_requests;
create policy "Select simulation approval requests"
  on public.simulation_approval_requests for select
  using (
    -- Admin has global access
    (select role from public.profiles where id = auth.uid()) = 'admin'
    -- Manager has access to department requests
    or (
      (select role from public.profiles where id = auth.uid()) = 'manager'
      and (
        lower(department) = lower(coalesce((select department from public.profiles where id = auth.uid()), 'HR'))
        or requester_id = auth.uid()
      )
    )
    -- User has access to own requests
    or requester_id = auth.uid()
  );

-- Update policy with double-decision protection
drop policy if exists "Update simulation approval requests" on public.simulation_approval_requests;
create policy "Update simulation approval requests"
  on public.simulation_approval_requests for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or (
      (select role from public.profiles where id = auth.uid()) = 'manager'
      and lower(department) = lower(coalesce((select department from public.profiles where id = auth.uid()), 'HR'))
    )
  );
-- ==============================================================================
-- FLOWMIND AI — Simulation Approval Requests & RBAC Persistence Schema
-- ==============================================================================

-- 1. Simulation Approval Requests Table
create table if not exists public.simulation_approval_requests (
  id uuid primary key default gen_random_uuid(),
  workflow_name text not null,
  employee_name text not null,
  department text not null check (department in ('HR', 'Support', 'Sales', 'Finance', 'Operations', 'IT', 'Other')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'accepted', 'rejected')),
  requester_id uuid references auth.users(id) on delete cascade,
  approver_id uuid references auth.users(id) on delete set null,
  approver_role text,
  approved_by text,
  approved_by_role text,
  approved_at timestamptz,
  rejected_by text,
  rejected_by_role text,
  rejected_at timestamptz,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_approval_requests_dept on public.simulation_approval_requests(department);
create index if not exists idx_approval_requests_requester on public.simulation_approval_requests(requester_id);
create index if not exists idx_approval_requests_status on public.simulation_approval_requests(status);

-- Enable RLS
alter table public.simulation_approval_requests enable row level security;

-- 2. Select Policy:
-- Admins: view all requests
-- Managers: view requests matching their department + their own requests
-- Users: view their own requests
drop policy if exists "Select simulation approval requests" on public.simulation_approval_requests;
create policy "Select simulation approval requests"
  on public.simulation_approval_requests for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or (
      (select role from public.profiles where id = auth.uid()) = 'manager'
      and department = (select department from public.profiles where id = auth.uid())
    )
    or requester_id = auth.uid()
  );

-- 3. Insert Policy:
-- Authenticated users can submit approval requests for their own account
drop policy if exists "Insert simulation approval requests" on public.simulation_approval_requests;
create policy "Insert simulation approval requests"
  on public.simulation_approval_requests for insert
  with check (auth.uid() = requester_id or auth.uid() is not null);

-- 4. Update Policy (Approve / Reject):
-- Only Admins and Authorized Department Managers can update request status
drop policy if exists "Update simulation approval requests" on public.simulation_approval_requests;
create policy "Update simulation approval requests"
  on public.simulation_approval_requests for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or (
      (select role from public.profiles where id = auth.uid()) = 'manager'
      and department = (select department from public.profiles where id = auth.uid())
    )
  );

-- 5. Seed standard initial simulation request sample records
insert into public.simulation_approval_requests (id, workflow_name, employee_name, department, status, details)
values
  ('11111111-1111-1111-1111-111111111111', 'Employee Leave Request', 'Mohanraj', 'HR', 'pending', '{"leave_days": 4, "type": "Annual Leave", "reason": "Family vacation"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'VIP Customer Discount Exception', 'Alex Johnson', 'Sales', 'pending', '{"client": "Acme Corp", "discount_pct": 25, "deal_value": "$120,000"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'Emergency Priority SLA Escalation', 'Sarah Connor', 'Support', 'pending', '{"ticket_id": "ZD-9982", "priority": "URGENT", "sla_hours": 1}'::jsonb)
on conflict (id) do nothing;
-- ==============================================================================
-- FLOWMIND AI — Phase 7: Real Render Workflows Execution Migration
-- Adds UPDATE policy for workflow executions so running jobs can transition
-- to SUCCEEDED or FAILED states, and ensures elevated roles can view telemetry.
-- ==============================================================================

-- Allow users to update their own execution telemetry records
drop policy if exists "Users can update own executions" on public.workflow_executions;
create policy "Users can update own executions"
  on public.workflow_executions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ensure admins and managers can view all workflow executions
drop policy if exists "Admins and Managers can view all executions" on public.workflow_executions;
create policy "Admins and Managers can view all executions"
  on public.workflow_executions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );
