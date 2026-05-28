create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('parent', 'child')),
  avatar_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  created_at timestamptz not null default now(),
  unique (family_id, profile_id)
);

create table children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  display_name text not null,
  avatar_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, profile_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid references children(id) on delete set null,
  title text not null,
  description text not null,
  points integer not null check (points > 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  photo_url text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz
);

create table rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  price integer not null check (price > 0),
  type text not null check (type in ('screen_time', 'experience', 'toy', 'treat', 'wish')),
  is_active boolean not null default true,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wishes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  title text not null,
  price integer not null check (price >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table point_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  title text not null,
  points integer not null,
  type text not null check (type in ('earn', 'spend', 'penalty', 'manual_adjustment')),
  source_task_submission_id uuid references task_submissions(id) on delete set null,
  source_reward_redemption_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references rewards(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  points_spent integer not null check (points_spent > 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'fulfilled')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz
);

create table favorite_goals (
  child_id uuid primary key references children(id) on delete cascade,
  target_type text not null check (target_type in ('reward', 'wish')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table point_transactions
  add constraint point_transactions_reward_redemption_fk
  foreign key (source_reward_redemption_id)
  references reward_redemptions(id)
  on delete set null;

create index tasks_family_id_idx on tasks(family_id);
create index task_submissions_child_id_status_idx on task_submissions(child_id, status);
create index rewards_family_id_is_active_idx on rewards(family_id, is_active);
create index wishes_child_id_is_archived_idx on wishes(child_id, is_archived);
create index point_transactions_child_id_created_at_idx on point_transactions(child_id, created_at desc);
create index favorite_goals_target_idx on favorite_goals(target_type, target_id);
