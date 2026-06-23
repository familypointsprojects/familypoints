-- Store the in-app avatar character id chosen by each child.
-- The avatar artwork itself lives in the app (shared/ui/AvatarHeads);
-- only the id (e.g. 'girl' | 'boy' | 'skeleton') is persisted here.
alter table public.children
  add column if not exists avatar_id text;

comment on column public.children.avatar_id is
  'In-app avatar character id (rendered client-side). Null until the child picks one.';
