insert into profiles (id, name, role, avatar_color)
values
  ('00000000-0000-0000-0000-000000000101', 'Alex', 'parent', null),
  ('00000000-0000-0000-0000-000000000201', 'Mia', 'child', '#58A4B0')
on conflict (id) do nothing;

insert into families (id, name, created_by)
values (
  '00000000-0000-0000-0000-000000000301',
  'The Parkers',
  '00000000-0000-0000-0000-000000000101'
)
on conflict (id) do nothing;

insert into family_members (family_id, profile_id, role)
values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000101',
    'parent'
  ),
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    'child'
  )
on conflict (family_id, profile_id) do nothing;

insert into children (id, family_id, profile_id, display_name, avatar_color)
values (
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000201',
  'Mia',
  '#58A4B0'
)
on conflict (family_id, profile_id) do nothing;

insert into tasks (id, family_id, child_id, title, description, points, status, created_by)
values
  (
    '00000000-0000-0000-0000-000000000501',
    '00000000-0000-0000-0000-000000000301',
    null,
    'Make the bed',
    'Tidy the bed before breakfast.',
    10,
    'active',
    '00000000-0000-0000-0000-000000000101'
  ),
  (
    '00000000-0000-0000-0000-000000000502',
    '00000000-0000-0000-0000-000000000301',
    null,
    'Read for 20 minutes',
    'Read any book and tell one thing you learned.',
    25,
    'active',
    '00000000-0000-0000-0000-000000000101'
  )
on conflict (id) do nothing;

insert into rewards (id, family_id, title, price, type, is_active, created_by)
values
  (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000301',
    '30 minutes of screen time',
    60,
    'screen_time',
    true,
    '00000000-0000-0000-0000-000000000101'
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000301',
    'Ice cream after school',
    45,
    'treat',
    true,
    '00000000-0000-0000-0000-000000000101'
  )
on conflict (id) do nothing;

insert into wishes (id, child_id, title, price)
values (
  '00000000-0000-0000-0000-000000000701',
  '00000000-0000-0000-0000-000000000401',
  'Roller skates',
  180
)
on conflict (id) do nothing;

insert into point_transactions (id, child_id, title, points, type, created_by)
values (
  '00000000-0000-0000-0000-000000000801',
  '00000000-0000-0000-0000-000000000401',
  'Helped set the table',
  80,
  'manual_adjustment',
  '00000000-0000-0000-0000-000000000101'
)
on conflict (id) do nothing;
