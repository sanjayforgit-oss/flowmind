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
