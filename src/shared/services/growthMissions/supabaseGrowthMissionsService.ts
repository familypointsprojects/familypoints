import { getSupabaseClient } from '@/shared/services/supabase';
import type { ChildInvestment, InvestmentProject } from '@/shared/types/family';
import type {
  ClaimInput,
  CreateMissionInput,
  DepositInput,
  GrowthMissionsService,
  UpdateMissionInput,
} from './types';

// ── Row types ─────────────────────────────────────────────────────────────────

type ProjectRow = {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  duration_days: number;
  bonus_percent: number;
  min_amount: number;
  max_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type InvestmentRow = {
  id: string;
  project_id: string;
  child_id: string;
  family_id: string;
  amount: number;
  bonus_percent: number;
  payout_amount: number;
  deposited_at: string;
  matures_at: string;
  claimed_at: string | null;
  // from direct table query (join)
  investment_projects?: { title: string } | null;
  // from get_child_investments RPC (flat column)
  project_title?: string | null;
  deposit_tx_id?: string | null;
};

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapProject = (row: ProjectRow): InvestmentProject => ({
  id: row.id,
  familyId: row.family_id,
  createdBy: row.created_by,
  title: row.title,
  description: row.description ?? undefined,
  durationDays: row.duration_days,
  bonusPercent: row.bonus_percent,
  minAmount: row.min_amount,
  maxAmount: row.max_amount,
  status: row.status as InvestmentProject['status'],
  createdAt: row.created_at,
});

const mapInvestment = (row: InvestmentRow): ChildInvestment => ({
  id: row.id,
  projectId: row.project_id,
  projectTitle: row.project_title ?? row.investment_projects?.title,
  childId: row.child_id,
  familyId: row.family_id,
  amount: row.amount,
  bonusPercent: row.bonus_percent,
  payoutAmount: row.payout_amount,
  depositedAt: row.deposited_at,
  maturesAt: row.matures_at,
  claimedAt: row.claimed_at,
  depositTxId: row.deposit_tx_id,
});

// ── Service ───────────────────────────────────────────────────────────────────

export const supabaseGrowthMissionsService: GrowthMissionsService = {
  async fetchProjects(familyId, childId) {
    const supabase = getSupabaseClient();
    // Children have no Supabase auth account — use child-specific RPC that
    // identifies the caller via their children.id UUID from the invite token.
    if (childId) {
      const { data, error } = await supabase.rpc('get_investment_projects_for_child', {
        p_child_id: childId,
      });
      if (error) throw new Error(error.message);
      return (data as ProjectRow[]).map(mapProject);
    }
    // Parents have a valid Supabase JWT — direct table query, RLS handles access.
    const { data, error } = await supabase
      .from('investment_projects')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ProjectRow[]).map(mapProject);
  },

  async fetchChildInvestments(childId) {
    const supabase = getSupabaseClient();
    // Children have no JWT — use security-definer RPC
    const { data, error } = await supabase.rpc('get_child_investments', {
      p_child_id: childId,
    });
    if (error) throw new Error(error.message);
    return (data as InvestmentRow[]).map(mapInvestment);
  },

  async createMission(input: CreateMissionInput) {
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('investment_projects')
      .insert({
        family_id:     input.familyId,
        created_by:    userData.user?.id,
        title:         input.title,
        description:   input.description ?? null,
        duration_days: input.durationDays,
        bonus_percent: input.bonusPercent,
        min_amount:    input.minAmount,
        max_amount:    input.maxAmount,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapProject(data as ProjectRow);
  },

  async updateMission(input: UpdateMissionInput) {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title         !== undefined) payload.title         = input.title;
    if (input.description   !== undefined) payload.description   = input.description;
    if (input.durationDays  !== undefined) payload.duration_days = input.durationDays;
    if (input.bonusPercent  !== undefined) payload.bonus_percent = input.bonusPercent;
    if (input.minAmount     !== undefined) payload.min_amount    = input.minAmount;
    if (input.maxAmount     !== undefined) payload.max_amount    = input.maxAmount;

    const { data, error } = await supabase
      .from('investment_projects')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapProject(data as ProjectRow);
  },

  async archiveMission(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('investment_projects')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deposit(input: DepositInput) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('create_investment', {
      p_project_id: input.projectId,
      p_child_id:   input.childId,
      p_amount:     input.amount,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },

  async claim(input: ClaimInput) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('claim_investment', {
      p_investment_id: input.investmentId,
      p_child_id:      input.childId,
    });
    if (error) throw new Error(error.message);
    return data as number;
  },
};
