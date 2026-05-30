# Growth Missions — Technical Design

## 1. Database Schema

```sql
-- ─────────────────────────────────────────────
-- Parent-created missions
-- ─────────────────────────────────────────────
CREATE TABLE investment_projects (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID        NOT NULL REFERENCES families(id)   ON DELETE CASCADE,
  created_by     UUID        NOT NULL REFERENCES profiles(id),
  title          TEXT        NOT NULL,
  description    TEXT,
  duration_days  INTEGER     NOT NULL CHECK (duration_days  > 0),
  bonus_percent  INTEGER     NOT NULL CHECK (bonus_percent >= 0 AND bonus_percent <= 1000),
  min_amount     INTEGER     NOT NULL CHECK (min_amount    > 0),
  max_amount     INTEGER     NOT NULL CHECK (max_amount   >= min_amount),
  status         TEXT        NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'archived')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Per-child deposits
-- ─────────────────────────────────────────────
CREATE TABLE child_investments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES investment_projects(id) ON DELETE RESTRICT,
  child_id       UUID        NOT NULL REFERENCES profiles(id),
  family_id      UUID        NOT NULL REFERENCES families(id)   ON DELETE CASCADE,

  amount         INTEGER     NOT NULL CHECK (amount > 0),
  -- Snapshot values locked at deposit time — children cannot supply these directly
  bonus_percent  INTEGER     NOT NULL CHECK (bonus_percent >= 0),
  payout_amount  INTEGER     NOT NULL CHECK (payout_amount >= amount),

  deposited_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  matures_at     TIMESTAMPTZ NOT NULL,          -- deposited_at + duration_days
  claimed_at     TIMESTAMPTZ,                   -- NULL until claimed

  deposit_tx_id  UUID        REFERENCES point_transactions(id),
  payout_tx_id   UUID        REFERENCES point_transactions(id),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON child_investments (child_id);
CREATE INDEX ON child_investments (project_id);
CREATE INDEX ON child_investments (family_id);
```

### point_transactions additions

Add two new `transaction_type` values to whatever CHECK/enum you already use:

```
'investment_deposit'   -- negative amount, reduces balance
'investment_payout'    -- positive amount, restores + bonus
```

---

## 2. RLS Policies

Use **security-definer functions** for writes (see §3). Direct-table INSERT/UPDATE
for `child_investments` is blocked; only the RPC functions can write to it.

```sql
-- ─────────────────────────────────────────────
-- investment_projects
-- ─────────────────────────────────────────────
ALTER TABLE investment_projects ENABLE ROW LEVEL SECURITY;

-- Any family member can read active projects in their family
CREATE POLICY "family members read projects"
  ON investment_projects FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Only parents can insert
CREATE POLICY "parents insert projects"
  ON investment_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE user_id  = auth.uid()
        AND family_id = NEW.family_id
        AND role      = 'parent'
    )
  );

-- Only parents can update (title, description, status, amounts, duration)
CREATE POLICY "parents update projects"
  ON investment_projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE user_id  = auth.uid()
        AND family_id = investment_projects.family_id
        AND role      = 'parent'
    )
  );

-- ─────────────────────────────────────────────
-- child_investments
-- ─────────────────────────────────────────────
ALTER TABLE child_investments ENABLE ROW LEVEL SECURITY;

-- Parents see all investments in their family; children see only their own
CREATE POLICY "read child_investments"
  ON child_investments FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'parent'
    )
    OR child_id = auth.uid()
  );

-- Direct INSERT and UPDATE are blocked — use RPCs only
-- (No INSERT or UPDATE policies = denied by default)
```

---

## 3. Security-Definer RPC Functions

These run with elevated privileges so they can atomically validate, write
`child_investments`, and write `point_transactions` in one transaction.

### 3a. `create_investment(p_project_id, p_amount)`

```sql
CREATE OR REPLACE FUNCTION create_investment(
  p_project_id UUID,
  p_amount     INTEGER
)
RETURNS UUID   -- child_investments.id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_id      UUID        := auth.uid();
  v_project       investment_projects%ROWTYPE;
  v_family_id     UUID;
  v_balance       INTEGER;
  v_payout        INTEGER;
  v_matures_at    TIMESTAMPTZ;
  v_investment_id UUID;
  v_tx_id         UUID;
BEGIN
  -- 1. Verify caller is a child in this family
  SELECT family_id INTO v_family_id
  FROM family_members
  WHERE user_id = v_child_id AND role = 'child';

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'not_a_child';
  END IF;

  -- 2. Load and validate project
  SELECT * INTO v_project
  FROM investment_projects
  WHERE id = p_project_id AND family_id = v_family_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'project_not_found';
  END IF;

  IF p_amount < v_project.min_amount OR p_amount > v_project.max_amount THEN
    RAISE EXCEPTION 'amount_out_of_range';
  END IF;

  -- 3. Check balance (derived from point_transactions)
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM point_transactions
  WHERE child_id = v_child_id;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- 4. Compute derived fields
  v_payout     := p_amount + FLOOR(p_amount::NUMERIC * v_project.bonus_percent / 100);
  v_matures_at := now() + (v_project.duration_days || ' days')::INTERVAL;

  -- 5. Insert investment row (bonus_percent + payout_amount are server-set)
  INSERT INTO child_investments (
    project_id, child_id, family_id,
    amount, bonus_percent, payout_amount,
    matures_at
  )
  VALUES (
    p_project_id, v_child_id, v_family_id,
    p_amount, v_project.bonus_percent, v_payout,
    v_matures_at
  )
  RETURNING id INTO v_investment_id;

  -- 6. Deduct points
  INSERT INTO point_transactions (
    child_id, family_id, amount, transaction_type, reference_id, description
  )
  VALUES (
    v_child_id, v_family_id, -p_amount,
    'investment_deposit', v_investment_id,
    'Deposited into: ' || v_project.title
  )
  RETURNING id INTO v_tx_id;

  -- 7. Back-link transaction to investment
  UPDATE child_investments
  SET deposit_tx_id = v_tx_id
  WHERE id = v_investment_id;

  RETURN v_investment_id;
END;
$$;
```

### 3b. `claim_investment(p_investment_id)`

```sql
CREATE OR REPLACE FUNCTION claim_investment(
  p_investment_id UUID
)
RETURNS INTEGER  -- new balance after payout
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_id   UUID := auth.uid();
  v_inv        child_investments%ROWTYPE;
  v_project    investment_projects%ROWTYPE;
  v_tx_id      UUID;
  v_balance    INTEGER;
BEGIN
  -- 1. Load investment, lock row to prevent race
  SELECT * INTO v_inv
  FROM child_investments
  WHERE id = p_investment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'investment_not_found';
  END IF;

  -- 2. Ownership check
  IF v_inv.child_id <> v_child_id THEN
    RAISE EXCEPTION 'not_your_investment';
  END IF;

  -- 3. Already claimed?
  IF v_inv.claimed_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_claimed';
  END IF;

  -- 4. Maturity check
  IF now() < v_inv.matures_at THEN
    RAISE EXCEPTION 'not_matured_yet';
  END IF;

  -- 5. Create payout transaction
  SELECT title INTO v_project.title
  FROM investment_projects WHERE id = v_inv.project_id;

  INSERT INTO point_transactions (
    child_id, family_id, amount, transaction_type, reference_id, description
  )
  VALUES (
    v_child_id, v_inv.family_id, v_inv.payout_amount,
    'investment_payout', p_investment_id,
    'Payout from: ' || v_project.title
  )
  RETURNING id INTO v_tx_id;

  -- 6. Mark as claimed
  UPDATE child_investments
  SET claimed_at   = now(),
      payout_tx_id = v_tx_id
  WHERE id = p_investment_id;

  -- 7. Return new balance
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM point_transactions
  WHERE child_id = v_child_id;

  RETURN v_balance;
END;
$$;
```

---

## 4. Service Layer (TypeScript)

```ts
// src/services/growthMissions.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Project    = Database['public']['Tables']['investment_projects']['Row']
type Investment = Database['public']['Tables']['child_investments']['Row']

// ── Queries ──────────────────────────────────────────────────────────────────

export async function fetchActiveProjects(familyId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('investment_projects')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllProjects(familyId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('investment_projects')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchChildInvestments(childId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('child_investments')
    .select('*, investment_projects(title, bonus_percent)')
    .eq('child_id', childId)
    .order('deposited_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createProject(
  payload: Pick<Project, 'family_id' | 'title' | 'description' |
                         'duration_days' | 'bonus_percent' | 'min_amount' | 'max_amount'>
): Promise<Project> {
  const { data, error } = await supabase
    .from('investment_projects')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(
  id: string,
  payload: Partial<Pick<Project, 'title' | 'description' | 'duration_days' |
                                  'bonus_percent' | 'min_amount' | 'max_amount'>>
): Promise<Project> {
  const { data, error } = await supabase
    .from('investment_projects')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function archiveProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('investment_projects')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function depositIntoMission(
  projectId: string,
  amount: number
): Promise<string> {
  const { data, error } = await supabase.rpc('create_investment', {
    p_project_id: projectId,
    p_amount: amount,
  })
  if (error) throw error
  return data as string
}

export async function claimMission(investmentId: string): Promise<number> {
  const { data, error } = await supabase.rpc('claim_investment', {
    p_investment_id: investmentId,
  })
  if (error) throw error
  return data as number
}
```

---

## 5. TanStack Query Hooks

```ts
// src/hooks/useGrowthMissions.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as svc from '@/services/growthMissions'
import { useFamily } from '@/hooks/useFamily'
import { useAuth } from '@/hooks/useAuth'

// ── Query keys ───────────────────────────────────────────────────────────────
export const missionKeys = {
  all:         (familyId: string)  => ['investment_projects', familyId] as const,
  active:      (familyId: string)  => ['investment_projects', familyId, 'active'] as const,
  investments: (childId: string)   => ['child_investments', childId] as const,
}

// ── Parent hooks ─────────────────────────────────────────────────────────────

export function useAllMissions() {
  const { familyId } = useFamily()
  return useQuery({
    queryKey: missionKeys.all(familyId),
    queryFn: () => svc.fetchAllProjects(familyId),
  })
}

export function useCreateMission() {
  const qc = useQueryClient()
  const { familyId } = useFamily()
  return useMutation({
    mutationFn: svc.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: missionKeys.all(familyId) }),
  })
}

export function useUpdateMission() {
  const qc = useQueryClient()
  const { familyId } = useFamily()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof svc.updateProject>[1] }) =>
      svc.updateProject(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: missionKeys.all(familyId) }),
  })
}

export function useArchiveMission() {
  const qc = useQueryClient()
  const { familyId } = useFamily()
  return useMutation({
    mutationFn: svc.archiveProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: missionKeys.all(familyId) }),
  })
}

// ── Child hooks ───────────────────────────────────────────────────────────────

export function useActiveMissions() {
  const { familyId } = useFamily()
  return useQuery({
    queryKey: missionKeys.active(familyId),
    queryFn: () => svc.fetchActiveProjects(familyId),
  })
}

export function useMyInvestments() {
  const { userId } = useAuth()
  return useQuery({
    queryKey: missionKeys.investments(userId),
    queryFn: () => svc.fetchChildInvestments(userId),
  })
}

export function useDepositIntoMission() {
  const qc = useQueryClient()
  const { userId } = useAuth()
  const { familyId } = useFamily()
  return useMutation({
    mutationFn: ({ projectId, amount }: { projectId: string; amount: number }) =>
      svc.depositIntoMission(projectId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.investments(userId) })
      qc.invalidateQueries({ queryKey: ['point_balance', userId] }) // your existing balance key
      qc.invalidateQueries({ queryKey: missionKeys.active(familyId) })
    },
  })
}

export function useClaimMission() {
  const qc = useQueryClient()
  const { userId } = useAuth()
  return useMutation({
    mutationFn: svc.claimMission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missionKeys.investments(userId) })
      qc.invalidateQueries({ queryKey: ['point_balance', userId] })
    },
  })
}
```

---

## 6. Parent Form — Zod Schema

```ts
// src/schemas/missionSchema.ts
import { z } from 'zod'

export const missionSchema = z.object({
  title:         z.string().min(1).max(80),
  description:   z.string().max(300).optional(),
  duration_days: z.coerce.number().int().min(1).max(365),
  bonus_percent: z.coerce.number().int().min(0).max(1000),
  min_amount:    z.coerce.number().int().min(1),
  max_amount:    z.coerce.number().int().min(1),
}).refine(d => d.max_amount >= d.min_amount, {
  message: 'Max must be ≥ min',
  path: ['max_amount'],
})

export type MissionFormValues = z.infer<typeof missionSchema>
```

---

## 7. Screen & Component Structure

```
src/
  screens/
    parent/
      GrowthMissionsScreen.tsx      ← list all missions (active + archived), FAB to create
      MissionFormScreen.tsx         ← create / edit (React Hook Form + Zod)
    child/
      AvailableMissionsScreen.tsx   ← list active projects, tap → DepositModal
      MyInvestmentsScreen.tsx       ← pending (not mature) + ready-to-claim
  components/
    missions/
      MissionCard.tsx               ← shared card for both parent and child views
      MissionFormFields.tsx         ← form fields extracted from MissionFormScreen
      DepositModal.tsx              ← bottom sheet: amount input, balance check, confirm
      ClaimCard.tsx                 ← child card for a matured investment + claim button
      CountdownBadge.tsx            ← "Ready in 3d 4h" / "Ready to claim!"
```

### Key component notes

**`MissionCard`** — receives a `role` prop (`'parent' | 'child'`).
Parents see edit/archive actions. Children see bonus percent and duration only.

**`DepositModal`** — shows current balance, project min/max, calculates live preview
of payout. Disables confirm if amount is out of range or exceeds balance.

**`ClaimCard`** — shows `payout_amount`, bonus earned, and a Claim button.
Button is disabled until `matures_at <= now()`; show `CountdownBadge` otherwise.

**`MyInvestmentsScreen`** — two sections: "Active" (not yet matured) and "Ready" (matured,
`claimed_at IS NULL`). Claimed investments can be hidden or shown in a collapsed
"History" section.

---

## 8. Edge Cases

| Case | Handling |
|------|----------|
| Balance drops between UI check and RPC call | `create_investment` re-checks balance inside the transaction — throws `insufficient_balance` |
| Two concurrent deposits exhaust balance | `FOR UPDATE` lock on point_transactions sum (or serializable isolation on the function) |
| Project archived while a child's deposit is in flight | RPC checks `status = 'active'` at call time — throw `project_not_found` |
| Project archived after deposit but before maturity | Investment still pays out — `child_investments` stores snapshots and references are RESTRICT |
| Double-claim attempt | `claimed_at IS NOT NULL` check + `FOR UPDATE` row lock — throw `already_claimed` |
| Claim before maturity | `now() < matures_at` check — throw `not_matured_yet` |
| Child tries to deposit into another family's project | `family_id` join in `create_investment` prevents it |
| Parent edits `bonus_percent` after deposits exist | Old deposits keep their snapshot value — no back-fill needed |
| `payout_amount` integer overflow | Use `BIGINT` for `payout_amount` if bonus_percent can be very high, or cap bonus_percent at a sane value (e.g. 500) |
| Child has no `family_members` row | `create_investment` throws `not_a_child` |
| Offline / network failure mid-claim | Function is atomic — either both transaction and `claimed_at` update succeed or neither does |

---

## 9. Implementation Steps

1. **DB migration**
   - Add `investment_deposit` / `investment_payout` to `point_transactions` type check
   - Create `investment_projects` table + indexes
   - Create `child_investments` table + indexes
   - Apply RLS policies

2. **RPC functions**
   - Create `create_investment` in Supabase SQL editor (or migration file)
   - Create `claim_investment`
   - Smoke-test both with `supabase.rpc(...)` in a local dev seed script

3. **TypeScript types**
   - Run `supabase gen types typescript` to regenerate `src/types/supabase.ts`

4. **Service layer** — `src/services/growthMissions.ts`

5. **Hooks** — `src/hooks/useGrowthMissions.ts`

6. **Zod schema** — `src/schemas/missionSchema.ts`

7. **Parent screens**
   - `GrowthMissionsScreen` (list + FAB)
   - `MissionFormScreen` (create/edit with React Hook Form)
   - Wire archive action with confirmation dialog

8. **Child screens**
   - `AvailableMissionsScreen` + `DepositModal`
   - `MyInvestmentsScreen` + `ClaimCard`

9. **Navigation** — add routes to your existing navigator; gate parent screens by role

10. **Testing**
    - Unit test the Zod schema
    - Unit test payout formula: `amount + floor(amount * bonus_percent / 100)`
    - Integration test RPC functions with Supabase local dev
    - E2E: deposit flow, countdown, claim flow

---

## Payout Formula Reference

```
payout = amount + FLOOR(amount × bonus_percent / 100)

Examples:
  100 pts × 10%  → 100 + 10  = 110
  100 pts × 15%  → 100 + 15  = 115
  75  pts × 20%  → 75  + 15  = 90
  50  pts × 33%  → 50  + 16  = 66   (floor of 16.5)
```
