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
