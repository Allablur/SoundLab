-- Run in your own Supabase SQL editor once.
create table if not exists public.soundlab_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null check (jsonb_typeof(workspace) = 'object'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.soundlab_workspaces enable row level security;
revoke all on public.soundlab_workspaces from anon, authenticated;
grant select, insert, update on public.soundlab_workspaces to authenticated;
drop policy if exists "Read own workspace" on public.soundlab_workspaces;
create policy "Read own workspace" on public.soundlab_workspaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own workspace" on public.soundlab_workspaces;
create policy "Insert own workspace" on public.soundlab_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own workspace" on public.soundlab_workspaces;
create policy "Update own workspace" on public.soundlab_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
