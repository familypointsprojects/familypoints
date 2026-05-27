-- ============================================================
-- Child Invite Tokens
-- Позволяет родителю генерировать QR/ссылку для входа ребёнка
-- ============================================================

create table if not exists child_invites (
  id          uuid        primary key default gen_random_uuid(),
  child_id    uuid        not null references children(id) on delete cascade,
  token       uuid        not null unique default gen_random_uuid(),
  created_by  uuid        not null references profiles(id),
  expires_at  timestamptz not null default (now() + interval '30 days'),
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists child_invites_token_idx    on child_invites(token);
create index if not exists child_invites_child_id_idx on child_invites(child_id);

-- RLS
alter table child_invites enable row level security;

-- Родитель может создавать инвайты для детей своей семьи
create policy "Parents can create invites for their children"
on child_invites for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1 from children
    join family_members on family_members.family_id = children.family_id
    where children.id = child_id
      and family_members.profile_id = auth.uid()
      and family_members.role = 'parent'
  )
);

-- Родитель может видеть инвайты своих детей
create policy "Parents can view invites for their children"
on child_invites for select
using (
  created_by = auth.uid()
);

-- Анонимный пользователь может читать инвайт по токену (для валидации)
-- Используется Edge Function или отдельный RPC
create policy "Anyone can read invite by token to validate"
on child_invites for select
using (true);

-- Родитель может удалять (отзывать) инвайты
create policy "Parents can delete their invites"
on child_invites for delete
using (created_by = auth.uid());

-- RPC для валидации токена (вызывается без сессии с устройства ребёнка)
-- Возвращает данные ребёнка если токен валиден и не истёк
create or replace function validate_child_invite(invite_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite  child_invites%rowtype;
  v_child   children%rowtype;
  v_profile profiles%rowtype;
begin
  -- Найти инвайт
  select * into v_invite
  from child_invites
  where token = invite_token
    and used_at is null
    and expires_at > now();

  if not found then
    return json_build_object('error', 'Invalid or expired invite token');
  end if;

  -- Получить данные ребёнка
  select * into v_child
  from children
  where id = v_invite.child_id;

  -- Получить профиль
  select * into v_profile
  from profiles
  where id = v_child.profile_id;

  -- Пометить токен как использованный (одноразовый)
  update child_invites
  set used_at = now()
  where id = v_invite.id;

  return json_build_object(
    'childId',    v_child.id,
    'profileId',  v_child.profile_id,
    'name',       v_child.display_name,
    'avatarColor', v_child.avatar_color,
    'role',       'child'
  );
end;
$$;
