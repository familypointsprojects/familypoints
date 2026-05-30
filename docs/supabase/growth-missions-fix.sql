-- Fix: children have no Supabase auth account (session is local-only via invite token).
-- auth.uid() is NULL for child sessions, so all RLS checks fail.
-- Solution: two RPCs — one for parents (auth.uid()-based), one for children (child_id-based).
-- Run this in Supabase SQL Editor.

-- ── Parent RPC ────────────────────────────────────────────────────────────────
-- Verifies caller is a family member via auth.uid()
CREATE OR REPLACE FUNCTION get_investment_projects(p_family_id UUID)
RETURNS SETOF investment_projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_family_member(p_family_id) THEN
    RAISE EXCEPTION 'not_a_family_member';
  END IF;

  RETURN QUERY
  SELECT * FROM investment_projects
  WHERE family_id = p_family_id
  ORDER BY created_at DESC;
END;
$$;

-- ── Child RPC ─────────────────────────────────────────────────────────────────
-- Children have no Supabase auth; identity is proved via their children.id UUID
-- (obtained from the invite token flow). Looks up family_id from children table.
CREATE OR REPLACE FUNCTION get_investment_projects_for_child(p_child_id UUID)
RETURNS SETOF investment_projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id UUID;
BEGIN
  SELECT family_id INTO v_family_id
  FROM children
  WHERE id = p_child_id;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'child_not_found';
  END IF;

  RETURN QUERY
  SELECT * FROM investment_projects
  WHERE family_id = v_family_id
    AND status = 'active'
  ORDER BY created_at DESC;
END;
$$;

-- Grant execute to anon role so unauthenticated child sessions can call it
GRANT EXECUTE ON FUNCTION get_investment_projects_for_child(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_investment_projects(UUID) TO authenticated;
