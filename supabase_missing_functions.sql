-- ============================================================
-- MISSING SUPABASE RPC FUNCTIONS
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. submit_child_task
--    Called when a child presses "Я сделал" on a task
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_child_task(
  child_id_input   uuid,
  profile_id_input uuid,
  task_id_input    uuid,
  proof_note_input text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_exists   boolean;
  v_pending_exists boolean;
BEGIN
  -- Verify the child belongs to this profile
  SELECT EXISTS(
    SELECT 1 FROM children
    WHERE id          = child_id_input
      AND profile_id  = profile_id_input
  ) INTO v_child_exists;

  IF NOT v_child_exists THEN
    RETURN json_build_object('error', 'Unauthorized: child not found for this profile');
  END IF;

  -- Block duplicate pending submissions
  SELECT EXISTS(
    SELECT 1 FROM task_submissions
    WHERE task_id  = task_id_input
      AND child_id = child_id_input
      AND status   = 'pending'
  ) INTO v_pending_exists;

  IF v_pending_exists THEN
    RETURN json_build_object('error', 'Task already submitted and pending review');
  END IF;

  -- Create the submission
  INSERT INTO task_submissions (task_id, child_id, status, photo_url, submitted_at)
  VALUES (task_id_input, child_id_input, 'pending', proof_note_input, now());

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_child_task(uuid, uuid, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_child_task(uuid, uuid, uuid, text) TO authenticated;


-- 2. add_child_wish
--    Called when a child adds a wish to their wishlist
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_child_wish(
  child_id_input   uuid,
  profile_id_input uuid,
  title_input      text,
  price_input      int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM children
    WHERE id         = child_id_input
      AND profile_id = profile_id_input
  ) INTO v_child_exists;

  IF NOT v_child_exists THEN
    RETURN json_build_object('error', 'Unauthorized: child not found for this profile');
  END IF;

  INSERT INTO wishes (child_id, title, price, is_archived)
  VALUES (child_id_input, title_input, price_input, false);

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_child_wish(uuid, uuid, text, int) TO anon;
GRANT EXECUTE ON FUNCTION public.add_child_wish(uuid, uuid, text, int) TO authenticated;


-- 3. create_child_reward_redemption
--    Called when a child redeems a reward
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_child_reward_redemption(
  child_id_input   uuid,
  profile_id_input uuid,
  reward_id_input  uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_exists   boolean;
  v_reward         record;
  v_balance        int;
  v_open_exists    boolean;
  v_redemption_id  uuid;
BEGIN
  -- Verify the child belongs to this profile
  SELECT EXISTS(
    SELECT 1 FROM children
    WHERE id         = child_id_input
      AND profile_id = profile_id_input
  ) INTO v_child_exists;

  IF NOT v_child_exists THEN
    RETURN json_build_object('error', 'Unauthorized: child not found for this profile');
  END IF;

  -- Load the reward
  SELECT * INTO v_reward FROM rewards WHERE id = reward_id_input;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Reward not found');
  END IF;

  IF v_reward.is_active = false THEN
    RETURN json_build_object('error', 'Reward is not active');
  END IF;

  -- Compute balance
  SELECT COALESCE(SUM(points), 0)
    INTO v_balance
    FROM point_transactions
   WHERE child_id = child_id_input;

  IF v_balance < v_reward.price THEN
    RETURN json_build_object('error', 'Not enough points');
  END IF;

  -- Block duplicate open requests
  SELECT EXISTS(
    SELECT 1 FROM reward_redemptions
    WHERE child_id  = child_id_input
      AND reward_id = reward_id_input
      AND status IN ('requested', 'approved')
  ) INTO v_open_exists;

  IF v_open_exists THEN
    RETURN json_build_object('error', 'Reward already requested');
  END IF;

  -- Create redemption
  INSERT INTO reward_redemptions (reward_id, child_id, points_spent, status, requested_at)
  VALUES (reward_id_input, child_id_input, v_reward.price, 'requested', now())
  RETURNING id INTO v_redemption_id;

  -- Deduct points
  INSERT INTO point_transactions (child_id, title, points, type, source_reward_redemption_id, created_by)
  VALUES (child_id_input, v_reward.title, -v_reward.price, 'spend', v_redemption_id, NULL);

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_child_reward_redemption(uuid, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.create_child_reward_redemption(uuid, uuid, uuid) TO authenticated;


-- ============================================================
-- WISH APPROVAL FEATURE — run these separately if already
-- ran the block above
-- ============================================================

-- 4. Add status column to wishes table (run once)
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

ALTER TABLE wishes DROP CONSTRAINT IF EXISTS wishes_price_check;
ALTER TABLE wishes ADD CONSTRAINT wishes_price_check CHECK (price >= 0);

ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_type_check;
ALTER TABLE rewards ADD CONSTRAINT rewards_type_check
  CHECK (type IN ('screen_time', 'experience', 'toy', 'treat', 'wish'));

-- Update existing wishes to have status = 'pending'
UPDATE wishes SET status = 'pending' WHERE status IS NULL;

-- 5. approve_wish
--    Called by the parent to approve a wish and set its price.
--    Creates a reward automatically.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_wish(
  wish_id_input    uuid,
  price_input      int,
  profile_id_input uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wish       record;
  v_membership record;
BEGIN
  IF price_input <= 0 THEN
    RETURN json_build_object('error', 'Price must be greater than 0');
  END IF;

  SELECT * INTO v_wish FROM wishes WHERE id = wish_id_input;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Wish not found');
  END IF;

  -- Find the family for this parent
  SELECT fm.* INTO v_membership
  FROM family_members fm
  WHERE fm.profile_id = profile_id_input
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Parent family not found');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM children c
    WHERE c.id = v_wish.child_id
      AND c.family_id = v_membership.family_id
  ) THEN
    RETURN json_build_object('error', 'Wish does not belong to this family');
  END IF;

  -- Update wish status and store the parent-assigned price
  UPDATE wishes
  SET status = 'approved',
      price = price_input,
      updated_at = now()
  WHERE id = wish_id_input;

  -- Create a reward from the wish
  INSERT INTO rewards (family_id, title, price, type, is_active, created_by)
  VALUES (v_membership.family_id, v_wish.title, price_input, 'wish', true, profile_id_input);

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_wish(uuid, int, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.approve_wish(uuid, int, uuid) TO authenticated;


-- 6. reject_wish
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reject_wish(
  wish_id_input uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE wishes
  SET status = 'rejected',
      updated_at = now()
  WHERE id = wish_id_input;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_wish(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.reject_wish(uuid) TO authenticated;
