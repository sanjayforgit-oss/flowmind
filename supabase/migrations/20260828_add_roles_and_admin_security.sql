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
