-- ============================================================
-- Parent Invite Tokens
-- Позволяет родителю генерировать QR/ссылку для второго родителя
-- ============================================================

create table if not exists parent_invites (
  id                   uuid        primary key default gen_random_uuid(),
  family_id            uuid        not null references families(id) on delete cascade,
  token                uuid        not null unique default gen_random_uuid(),
  created_by           uuid        not null references profiles(id),
  has_full_permissions boolean     not null default false,
  expires_at           timestamptz not null default (now() + interval '7 days'),
  used_at              timestamptz,
  used_by              uuid        references profiles(id),
  created_at           timestamptz not null default now()
);

create index if not exists parent_invites_token_idx     on parent_invites(token);
create index if not exists parent_invites_family_id_idx on parent_invites(family_id);

-- RLS
alter table parent_invites enable row level security;

-- Родитель может создавать инвайты для своей семьи
create policy "Parents can create parent invites"
on parent_invites for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1 from family_members
    where family_members.family_id = parent_invites.family_id
      and family_members.profile_id = auth.uid()
      and family_members.role = 'parent'
  )
);

-- Родитель видит инвайты которые сам создал
create policy "Parents can view their own invites"
on parent_invites for select
using (created_by = auth.uid());

-- Любой авторизованный может прочитать инвайт по токену
create policy "Anyone authenticated can read invite by token"
on parent_invites for select
using (true);

-- Родитель может отзывать свои инвайты
create policy "Parents can delete their invites"
on parent_invites for delete
using (created_by = auth.uid());

-- ============================================================
-- RPC: validate_parent_invite
-- Вызывается авторизованным пользователем (второй родитель)
-- Привязывает его аккаунт к семье
-- ============================================================
create or replace function validate_parent_invite(invite_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite  parent_invites%rowtype;
  v_user_id uuid;
begin
  -- Текущий пользователь
  v_user_id := auth.uid();

  if v_user_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;

  -- Найти валидный инвайт
  select * into v_invite
  from parent_invites
  where token = invite_token
    and used_at is null
    and expires_at > now();

  if not found then
    return json_build_object('error', 'Invalid or expired invite token');
  end if;

  -- Проверить что пользователь не уже в этой семье
  if exists (
    select 1 from family_members
    where family_id = v_invite.family_id
      and profile_id = v_user_id
  ) then
    return json_build_object('error', 'Already a member of this family');
  end if;

  -- Убедиться что профиль существует, обновить роль если нужно
  insert into profiles (id, name, role, has_full_permissions)
  values (v_user_id, '', 'parent', v_invite.has_full_permissions)
  on conflict (id) do update
    set role = 'parent',
        has_full_permissions = v_invite.has_full_permissions;

  -- Добавить в family_members
  insert into family_members (family_id, profile_id, role)
  values (v_invite.family_id, v_user_id, 'parent')
  on conflict do nothing;

  -- Пометить токен использованным
  update parent_invites
  set used_at = now(),
      used_by = v_user_id
  where id = v_invite.id;

  return json_build_object(
    'familyId', v_invite.family_id,
    'hasFullPermissions', v_invite.has_full_permissions,
    'role', 'parent'
  );
end;
$$;
