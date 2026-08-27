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
