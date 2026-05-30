-- Fix: children have no Supabase auth account, so auth.uid() is NULL.
-- Remove auth.uid() checks; also fix point_transactions insert (no family_id column).
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION create_investment(
  p_project_id uuid,
  p_child_id   uuid,
  p_amount     integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project       investment_projects%rowtype;
  v_child_family  uuid;
  v_balance       integer;
  v_payout        integer;
  v_matures_at    timestamptz;
  v_investment_id uuid;
  v_tx_id         uuid;
BEGIN
  -- 1. Verify child exists and get family_id
  SELECT family_id INTO v_child_family
  FROM children
  WHERE id = p_child_id;

  IF v_child_family IS NULL THEN
    RAISE EXCEPTION 'child_not_found';
  END IF;

  -- 2. Validate project belongs to same family and is active
  SELECT * INTO v_project
  FROM investment_projects
  WHERE id = p_project_id
    AND family_id = v_child_family
    AND status    = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'project_not_found';
  END IF;

  -- 3. Validate amount
  IF p_amount < v_project.min_amount OR p_amount > v_project.max_amount THEN
    RAISE EXCEPTION 'amount_out_of_range';
  END IF;

  -- 4. Check balance
  SELECT COALESCE(SUM(points), 0) INTO v_balance
  FROM point_transactions
  WHERE child_id = p_child_id;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- 5. Compute payout
  v_payout     := p_amount + FLOOR(p_amount::numeric * v_project.bonus_percent / 100)::integer;
  v_matures_at := now() + (v_project.duration_days || ' days')::interval;

  -- 6. Insert investment row
  INSERT INTO child_investments (
    project_id, child_id, family_id,
    amount, bonus_percent, payout_amount,
    matures_at
  )
  VALUES (
    p_project_id, p_child_id, v_child_family,
    p_amount, v_project.bonus_percent, v_payout,
    v_matures_at
  )
  RETURNING id INTO v_investment_id;

  -- 7. Deduct points (point_transactions has no family_id column)
  INSERT INTO point_transactions (
    child_id, title, points, type,
    source_task_submission_id, source_reward_redemption_id, created_by
  )
  VALUES (
    p_child_id,
    'Копилка: ' || v_project.title,
    -p_amount,
    'investment_deposit',
    null, null, null
  )
  RETURNING id INTO v_tx_id;

  -- 8. Back-link transaction
  UPDATE child_investments
  SET deposit_tx_id = v_tx_id
  WHERE id = v_investment_id;

  RETURN v_investment_id;
END;
$$;

CREATE OR REPLACE FUNCTION claim_investment(
  p_investment_id uuid,
  p_child_id      uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv           child_investments%rowtype;
  v_project_title text;
  v_tx_id         uuid;
  v_balance       integer;
BEGIN
  -- 1. Load + lock row
  SELECT * INTO v_inv
  FROM child_investments
  WHERE id = p_investment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'investment_not_found';
  END IF;

  -- 2. Verify ownership
  IF v_inv.child_id <> p_child_id THEN
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

  -- 5. Payout transaction (no family_id column in point_transactions)
  SELECT title INTO v_project_title
  FROM investment_projects WHERE id = v_inv.project_id;

  INSERT INTO point_transactions (
    child_id, title, points, type,
    source_task_submission_id, source_reward_redemption_id, created_by
  )
  VALUES (
    p_child_id,
    'Выплата копилки: ' || v_project_title,
    v_inv.payout_amount,
    'investment_payout',
    null, null, null
  )
  RETURNING id INTO v_tx_id;

  -- 6. Mark claimed
  UPDATE child_investments
  SET claimed_at   = now(),
      payout_tx_id = v_tx_id
  WHERE id = p_investment_id;

  -- 7. Return new balance
  SELECT COALESCE(SUM(points), 0) INTO v_balance
  FROM point_transactions
  WHERE child_id = p_child_id;

  RETURN v_balance;
END;
$$;

-- Grant to anon so unauthenticated child sessions can call these
GRANT EXECUTE ON FUNCTION create_investment(uuid, uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_investment(uuid, uuid) TO anon, authenticated;

-- RPC: fetch child investments (children have no JWT, can't use RLS directly)
CREATE OR REPLACE FUNCTION get_child_investments(p_child_id UUID)
RETURNS TABLE (
  id              uuid,
  project_id      uuid,
  child_id        uuid,
  family_id       uuid,
  amount          integer,
  bonus_percent   integer,
  payout_amount   integer,
  deposited_at    timestamptz,
  matures_at      timestamptz,
  claimed_at      timestamptz,
  project_title   text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify child exists
  IF NOT EXISTS (SELECT 1 FROM children WHERE id = p_child_id) THEN
    RAISE EXCEPTION 'child_not_found';
  END IF;

  RETURN QUERY
  SELECT
    ci.id,
    ci.project_id,
    ci.child_id,
    ci.family_id,
    ci.amount,
    ci.bonus_percent,
    ci.payout_amount,
    ci.deposited_at,
    ci.matures_at,
    ci.claimed_at,
    ip.title AS project_title
  FROM child_investments ci
  JOIN investment_projects ip ON ip.id = ci.project_id
  WHERE ci.child_id = p_child_id
  ORDER BY ci.deposited_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_child_investments(uuid) TO anon, authenticated;
