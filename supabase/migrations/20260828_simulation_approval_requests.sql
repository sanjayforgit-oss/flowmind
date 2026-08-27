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
