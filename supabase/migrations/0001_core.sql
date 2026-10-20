-- teamTask: roles administer accounts; only current members can access content.
create type public.account_role as enum ('member', 'admin', 'superuser');
create type public.todo_status as enum ('todo', 'in_progress', 'done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '' check (length(display_name) <= 100),
  role public.account_role not null default 'member',
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index profiles_email_unique on public.profiles (lower(email));
create unique index one_superuser on public.profiles (role) where role = 'superuser';
create table public.bootstrap_state (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index team_members_user_idx on public.team_members(user_id, team_id);
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(email) <= 254),
  kind text not null check (kind in ('team', 'admin')),
  team_id uuid references public.teams(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  constraint invitation_target check ((kind = 'team' and team_id is not null) or (kind = 'admin' and team_id is null))
);
create table public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  title text not null check (length(trim(title)) between 1 and 160),
  body text not null default '' check (length(body) <= 100000),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (team_id, slug)
);
create table public.personal_todos (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 240),
  status public.todo_status not null default 'todo',
  due_date date,
  created_at timestamptz not null default now()
);
create index personal_todos_owner_idx on public.personal_todos(created_by);
create table public.team_todos (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 240),
  status public.todo_status not null default 'todo',
  due_date date,
  created_at timestamptz not null default now()
);
create index team_todos_team_idx on public.team_todos(team_id);
create table public.vault_projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (team_id, name),
  unique (id, team_id)
);
create table public.vault_files (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  project_id uuid,
  name text not null check (length(name) between 1 and 200),
  storage_path text not null unique,
  size bigint not null check (size > 0 and size <= 104857600),
  content_type text not null default 'application/octet-stream',
  ready boolean not null default false,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (project_id, team_id) references public.vault_projects(id, team_id),
  check (storage_path = team_id::text || '/' || id::text || '/' || name),
  check (name ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]*$'),
  check (lower(name) ~ '\.(zip|pdf|doc|docx|md|mdx|txt|csv|ts|tsx|js|jsx|mjs|cjs|json|py|rb|go|rs|java|c|h|cpp|hpp|cs|php|swift|kt|kts|sql|sh|bash|css|scss|html|xml|yaml|yml|toml|ini|r|vue|svelte)$')
);
create index vault_files_team_idx on public.vault_files(team_id, project_id);
create table public.wall_posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  body text not null check (length(trim(body)) between 1 and 20000),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, team_id)
);
create index wall_posts_team_idx on public.wall_posts(team_id);
create table public.wall_reactions (
  post_id uuid not null,
  team_id uuid not null,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '🎉', '👀')),
  primary key (post_id, user_id, emoji),
  foreign key (post_id, team_id) references public.wall_posts(id, team_id) on delete cascade
);
create index wall_reactions_team_idx on public.wall_reactions(team_id);

-- Fixed search paths and definer functions avoid recursive membership RLS.
create function public.is_active() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and not suspended);
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'superuser') and not suspended);
$$;
create function public.is_superuser() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'superuser' and not suspended);
$$;
create function public.is_member(target_team uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_active() and exists(select 1 from public.team_members where team_id = target_team and user_id = auth.uid());
$$;

create function public.sync_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, display_name)
    values (new.id, lower(new.email), left(coalesce(new.raw_user_meta_data->>'display_name', ''), 100))
    on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
create trigger sync_auth_profile after insert or update of email on auth.users for each row execute function public.sync_profile();
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger wiki_updated before update on public.wiki_pages for each row execute function public.touch_updated_at();
create trigger wall_updated before update on public.wall_posts for each row execute function public.touch_updated_at();

create function public.create_team(team_name text, team_slug text) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  insert into public.teams(name, slug, created_by) values(trim(team_name), team_slug, auth.uid()) returning id into new_id;
  insert into public.team_members(team_id, user_id) values(new_id, auth.uid());
  return new_id;
end;
$$;
create function public.set_account_role(target_user uuid, new_role public.account_role) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_superuser() or new_role = 'superuser' then raise exception 'Superuser access required'; end if;
  update public.profiles set role = new_role where id = target_user and role <> 'superuser';
  if not found then raise exception 'Account cannot be changed'; end if;
end;
$$;
create function public.set_account_suspended(target_user uuid, is_suspended boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_superuser() then raise exception 'Superuser access required'; end if;
  update public.profiles set suspended = is_suspended where id = target_user and role <> 'superuser';
  if not found then raise exception 'Account cannot be changed'; end if;
end;
$$;
create function public.bootstrap_superuser(target_user uuid) returns void language plpgsql security definer set search_path = '' as $$
declare existing_id uuid;
begin
  perform pg_advisory_xact_lock(78122301);
  select user_id into existing_id from public.bootstrap_state where singleton;
  if existing_id is not null then
    if existing_id <> target_user then raise exception 'A superuser is already configured'; end if;
    return;
  end if;
  insert into public.bootstrap_state(user_id) values(target_user);
  update public.profiles set role = 'superuser', suspended = false where id = target_user;
  if not found then raise exception 'Account not found'; end if;
end;
$$;

-- Redemption is atomic, single-use, and bound to the authenticated email.
create function public.accept_invitation(invite_hash text) returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.invitations; user_email text;
begin
  if not public.is_active() then raise exception 'Sign in to accept this invitation'; end if;
  select lower(email) into user_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  select * into invitation from public.invitations where token_hash = invite_hash for update;
  if not found or invitation.revoked_at is not null or invitation.accepted_at is not null or invitation.expires_at <= now() then
    raise exception 'Invitation is no longer valid';
  end if;
  if user_email is distinct from lower(invitation.email) then raise exception 'Sign in with the invited email address'; end if;
  -- Revocation of the sender's authority also invalidates outstanding invites.
  if not exists(select 1 from public.profiles where id = invitation.invited_by and not suspended and
    ((invitation.kind = 'admin' and role = 'superuser') or (invitation.kind = 'team' and role in ('admin', 'superuser')))) then
    raise exception 'Invitation sender no longer has permission';
  end if;
  if invitation.kind = 'admin' then
    update public.profiles set role = 'admin' where id = auth.uid() and role = 'member';
  else
    insert into public.team_members(team_id, user_id) values(invitation.team_id, auth.uid()) on conflict do nothing;
  end if;
  update public.invitations set accepted_at = now(), accepted_by = auth.uid() where id = invitation.id;
  return invitation.team_id;
end;
$$;

create function public.finalize_upload(file_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare item public.vault_files; actual_size bigint;
begin
  select * into item from public.vault_files where id = file_id for update;
  if not found or not public.is_member(item.team_id) or item.created_by <> auth.uid() then raise exception 'File access denied'; end if;
  select (metadata->>'size')::bigint into actual_size from storage.objects where bucket_id = 'team-vault' and name = item.storage_path;
  if actual_size is null or actual_size <> item.size or actual_size > 104857600 then raise exception 'Upload is missing or has an unexpected size'; end if;
  update public.vault_files set ready = true where id = file_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.bootstrap_state enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.invitations enable row level security;
alter table public.wiki_pages enable row level security;
alter table public.personal_todos enable row level security;
alter table public.team_todos enable row level security;
alter table public.vault_projects enable row level security;
alter table public.vault_files enable row level security;
alter table public.wall_posts enable row level security;
alter table public.wall_reactions enable row level security;

-- No client access to bootstrap_state, and no broad profile directory for members.
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_edit on public.profiles for update to authenticated using (id = auth.uid() and public.is_active()) with check (id = auth.uid());
create policy teams_read on public.teams for select to authenticated using (public.is_member(id) or public.is_admin());
create policy membership_read on public.team_members for select to authenticated using (public.is_member(team_id) or public.is_admin());
create policy membership_remove on public.team_members for delete to authenticated using (public.is_admin());
create policy invitations_read on public.invitations for select to authenticated using ((kind = 'team' and public.is_admin()) or public.is_superuser());
create policy invitations_create on public.invitations for insert to authenticated with check (
  invited_by = auth.uid() and accepted_at is null and revoked_at is null and accepted_by is null
  and expires_at <= now() + interval '7 days' and expires_at > now()
  and ((kind = 'team' and public.is_admin()) or (kind = 'admin' and public.is_superuser()))
);
create policy invitations_manage on public.invitations for update to authenticated
  using (accepted_at is null and ((kind = 'team' and public.is_admin()) or public.is_superuser()))
  with check (expires_at <= now() + interval '7 days' and ((kind = 'team' and public.is_admin()) or public.is_superuser()));

create policy wiki_read on public.wiki_pages for select to authenticated using (public.is_member(team_id));
create policy wiki_create on public.wiki_pages for insert to authenticated with check (public.is_member(team_id) and created_by = auth.uid());
create policy wiki_edit on public.wiki_pages for update to authenticated using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy wiki_delete on public.wiki_pages for delete to authenticated using (public.is_member(team_id) and (created_by = auth.uid() or public.is_admin()));
create policy personal_todos_owner on public.personal_todos for all to authenticated using (created_by = auth.uid() and public.is_active()) with check (created_by = auth.uid() and public.is_active());
create policy team_todos_read on public.team_todos for select to authenticated using (public.is_member(team_id));
create policy team_todos_create on public.team_todos for insert to authenticated with check (public.is_member(team_id) and created_by = auth.uid());
create policy team_todos_edit on public.team_todos for update to authenticated using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy team_todos_delete on public.team_todos for delete to authenticated using (public.is_member(team_id) and (created_by = auth.uid() or public.is_admin()));
create policy projects_read on public.vault_projects for select to authenticated using (public.is_member(team_id));
create policy projects_create on public.vault_projects for insert to authenticated with check (public.is_member(team_id) and created_by = auth.uid());
create policy files_read on public.vault_files for select to authenticated using (public.is_member(team_id));
create policy files_create on public.vault_files for insert to authenticated with check (public.is_member(team_id) and created_by = auth.uid() and not ready);
create policy files_cancel on public.vault_files for delete to authenticated using (public.is_member(team_id) and created_by = auth.uid() and not ready);
create policy wall_read on public.wall_posts for select to authenticated using (public.is_member(team_id));
create policy wall_create on public.wall_posts for insert to authenticated with check (public.is_member(team_id) and public.is_admin() and created_by = auth.uid());
create policy wall_edit on public.wall_posts for update to authenticated using (public.is_member(team_id) and public.is_admin()) with check (public.is_member(team_id) and public.is_admin());
create policy wall_delete on public.wall_posts for delete to authenticated using (public.is_member(team_id) and public.is_admin());
create policy reactions_read on public.wall_reactions for select to authenticated using (public.is_member(team_id));
create policy reactions_create on public.wall_reactions for insert to authenticated with check (public.is_member(team_id) and user_id = auth.uid());
create policy reactions_remove on public.wall_reactions for delete to authenticated using (public.is_member(team_id) and user_id = auth.uid());

-- Restrict mutable columns so authorship and scope cannot be reassigned via REST.
revoke all on public.profiles, public.bootstrap_state, public.teams, public.team_members, public.invitations,
  public.wiki_pages, public.personal_todos, public.team_todos, public.vault_projects, public.vault_files,
  public.wall_posts, public.wall_reactions from anon, authenticated;
grant select on public.profiles, public.teams, public.team_members, public.invitations, public.wiki_pages,
  public.personal_todos, public.team_todos, public.vault_projects, public.vault_files, public.wall_posts, public.wall_reactions to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant delete on public.team_members to authenticated;
grant insert(email, kind, team_id, token_hash, invited_by) on public.invitations to authenticated;
grant update(token_hash, expires_at, revoked_at, delivery_status) on public.invitations to authenticated;
grant insert(id, team_id, slug, title, body, created_by), delete on public.wiki_pages to authenticated;
grant update(title, body) on public.wiki_pages to authenticated;
grant insert(title, status, due_date, created_by), delete on public.personal_todos to authenticated;
grant update(title, status, due_date) on public.personal_todos to authenticated;
grant insert(team_id, title, status, due_date, created_by), delete on public.team_todos to authenticated;
grant update(title, status, due_date) on public.team_todos to authenticated;
grant insert(team_id, name, created_by) on public.vault_projects to authenticated;
grant insert(id, team_id, project_id, name, storage_path, size, content_type, created_by), delete on public.vault_files to authenticated;
grant insert(team_id, title, body, created_by), delete on public.wall_posts to authenticated;
grant update(title, body) on public.wall_posts to authenticated;
grant insert(post_id, team_id, user_id, emoji), delete on public.wall_reactions to authenticated;
grant all on public.profiles, public.bootstrap_state, public.teams, public.team_members, public.invitations,
  public.wiki_pages, public.personal_todos, public.team_todos, public.vault_projects, public.vault_files,
  public.wall_posts, public.wall_reactions to service_role;

revoke all on function public.is_active(), public.is_admin(), public.is_superuser(), public.is_member(uuid),
  public.sync_profile(), public.touch_updated_at(), public.create_team(text, text),
  public.set_account_role(uuid, public.account_role), public.set_account_suspended(uuid, boolean),
  public.bootstrap_superuser(uuid), public.accept_invitation(text), public.finalize_upload(uuid) from public, anon, authenticated;
grant execute on function public.is_active(), public.is_admin(), public.is_superuser(), public.is_member(uuid),
  public.create_team(text, text), public.set_account_role(uuid, public.account_role),
  public.set_account_suspended(uuid, boolean), public.accept_invitation(text), public.finalize_upload(uuid) to authenticated;
grant execute on function public.bootstrap_superuser(uuid) to service_role;

insert into storage.buckets(id, name, public, file_size_limit)
values ('team-vault', 'team-vault', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;
-- Exact metadata path matching avoids unsafe UUID casts on untrusted filenames.
create policy vault_storage_read on storage.objects for select to authenticated using (
  bucket_id = 'team-vault' and exists(select 1 from public.vault_files f where f.storage_path = storage.objects.name and public.is_member(f.team_id))
);
create policy vault_storage_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'team-vault' and exists(select 1 from public.vault_files f where f.storage_path = storage.objects.name and public.is_member(f.team_id) and f.created_by = auth.uid() and not f.ready)
);
create policy vault_storage_cancel on storage.objects for delete to authenticated using (
  bucket_id = 'team-vault' and exists(select 1 from public.vault_files f where f.storage_path = storage.objects.name and public.is_member(f.team_id) and f.created_by = auth.uid() and not f.ready)
);

-- Aggregate on the server so reaction counts are not truncated by REST row limits.
create function public.reaction_counts(target_team uuid, post_ids uuid[])
returns table(post_id uuid, emoji text, total bigint, reacted boolean)
language sql stable security invoker set search_path = '' as $$
  select r.post_id, r.emoji, count(*), bool_or(r.user_id = auth.uid())
  from public.wall_reactions r
  where r.team_id = target_team and r.post_id = any(post_ids)
  group by r.post_id, r.emoji;
$$;
revoke all on function public.reaction_counts(uuid, uuid[]) from public, anon;
grant execute on function public.reaction_counts(uuid, uuid[]) to authenticated;
