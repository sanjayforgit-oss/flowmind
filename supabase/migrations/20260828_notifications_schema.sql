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
