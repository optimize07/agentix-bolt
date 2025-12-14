-- Relax projects RLS to allow authenticated users to see client projects
-- This keeps insert/update/delete restricted but lets any logged-in user read.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_select_authenticated'
  ) then
    create policy projects_select_authenticated
      on public.projects
      for select
      using (auth.uid() is not null);
  end if;
end
$$;

