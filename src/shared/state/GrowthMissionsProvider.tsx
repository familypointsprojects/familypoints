import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/shared/auth';
import { supabaseGrowthMissionsService } from '@/shared/services/growthMissions';
import { useFamilyPoints } from '@/shared/state/FamilyPointsProvider';
import type { ChildInvestment, InvestmentProject } from '@/shared/types/family';
import type { CreateMissionInput, UpdateMissionInput } from '@/shared/services/growthMissions';
import { applySavingsSkills } from '@/shared/utils/leveling';

type GrowthMissionsContextValue = {
  hasHydrated: boolean;
  projects: InvestmentProject[];
  myInvestments: ChildInvestment[];
  createMission: (input: Omit<CreateMissionInput, 'familyId'>) => Promise<void>;
  updateMission: (input: UpdateMissionInput) => Promise<void>;
  archiveMission: (id: string) => Promise<void>;
  deposit: (projectId: string, amount: number) => Promise<void>;
  claim: (investmentId: string) => Promise<void>;
  reload: () => Promise<void>;
};

const GrowthMissionsContext = createContext<GrowthMissionsContextValue | null>(null);

export const GrowthMissionsProvider = ({ children }: PropsWithChildren) => {
  const { session } = useAuth();
  const { childSkillUnlocks, reloadState: reloadFamilyPointsState } = useFamilyPoints();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [projects, setProjects]           = useState<InvestmentProject[]>([]);
  const [myInvestments, setMyInvestments] = useState<ChildInvestment[]>([]);

  const familyIdRef = useRef('');
  const childIdRef  = useRef('');
  // Timestamp of the last successful load. Used to throttle focus-triggered
  // reloads so that rapidly switching between tabs doesn't refetch projects /
  // investments on every navigation (a major source of page-switch lag).
  const lastLoadAtRef = useRef(0);
  const RELOAD_THROTTLE_MS = 15_000;

  const loadProjects = useCallback(async (fid: string, cid?: string) => {
    const data = await supabaseGrowthMissionsService.fetchProjects(fid, cid);
    setProjects(data);
  }, []);

  const loadInvestments = useCallback(async (childId: string, options?: { autoClaimReady?: boolean }) => {
    const data = await supabaseGrowthMissionsService.fetchChildInvestments(childId);

    if (options?.autoClaimReady) {
      const readyInvestments = data.filter(
        (investment) =>
          !investment.claimedAt && new Date(investment.maturesAt).getTime() <= Date.now(),
      );

      if (readyInvestments.length > 0) {
        const results = await Promise.allSettled(
          readyInvestments.map((investment) =>
            supabaseGrowthMissionsService.claim({ investmentId: investment.id, childId }),
          ),
        );
        const hasClaimed = results.some((result) => result.status === 'fulfilled');

        if (hasClaimed) {
          await reloadFamilyPointsState();
          const refreshedData = await supabaseGrowthMissionsService.fetchChildInvestments(childId);
          setMyInvestments(refreshedData);
          return;
        }
      }
    }

    setMyInvestments(data);
  }, [reloadFamilyPointsState]);

  useEffect(() => {
    if (session?.role !== 'child') {
      return undefined;
    }

    const childId = session.childId ?? childIdRef.current;
    const pendingInvestments = myInvestments.filter((investment) => !investment.claimedAt);

    if (!childId || pendingInvestments.length === 0) {
      return undefined;
    }

    const now = Date.now();
    const nextMaturityDelay = pendingInvestments.reduce<number | null>((currentDelay, investment) => {
      const delay = new Date(investment.maturesAt).getTime() - now;
      const normalizedDelay = Math.max(delay, 5_000);

      return currentDelay === null ? normalizedDelay : Math.min(currentDelay, normalizedDelay);
    }, null);

    if (nextMaturityDelay === null) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      loadInvestments(childId, { autoClaimReady: true }).catch((error: unknown) => {
        console.warn('[GrowthMissions] auto-claim check failed', error);
      });
    }, nextMaturityDelay + 250);

    return () => clearTimeout(timeout);
  }, [loadInvestments, myInvestments, session]);

  const hydrate = useCallback(async () => {
    if (!session) return;
    try {
      const { getSupabaseClient } = await import('@/shared/services/supabase');
      const supabase = getSupabaseClient();

      if (session.role === 'parent') {
        const { data } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('profile_id', session.profileId)
          .limit(1)
          .single();

        if (data?.family_id) {
          familyIdRef.current = data.family_id;
          await loadProjects(data.family_id);
        }

      } else if (session.role === 'child') {
        let resolvedChildId  = session.childId ?? '';
        let resolvedFamilyId = '';

        if (resolvedChildId) {
          const { data } = await supabase
            .from('children')
            .select('family_id')
            .eq('id', resolvedChildId)
            .single();
          resolvedFamilyId = data?.family_id ?? '';
        }

        if (!resolvedFamilyId) {
          const { data } = await supabase
            .from('children')
            .select('id, family_id')
            .eq('profile_id', session.profileId)
            .single();
          resolvedChildId  = data?.id        ?? resolvedChildId;
          resolvedFamilyId = data?.family_id ?? '';
        }

        if (resolvedFamilyId) {
          familyIdRef.current = resolvedFamilyId;
          childIdRef.current  = resolvedChildId;
          await Promise.all([
            loadProjects(resolvedFamilyId, resolvedChildId || undefined),
            resolvedChildId
              ? loadInvestments(resolvedChildId, { autoClaimReady: true })
              : Promise.resolve(),
          ]);
        }
      }
    } catch (e) {
      console.error('[GrowthMissions] hydrate error:', e instanceof Error ? e.message : e);
    } finally {
      lastLoadAtRef.current = Date.now();
      setHasHydrated(true);
    }
  }, [session, loadProjects, loadInvestments]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const reload = useCallback(async (options?: { force?: boolean }) => {
    // For quick reload (focus events), re-use already-resolved IDs to avoid
    // redundant table lookups. Full re-hydration happens when session changes.
    const fid = familyIdRef.current;
    const cid = childIdRef.current;

    // Throttle focus-driven reloads: if data was loaded very recently, skip the
    // network round-trip (and the hasHydrated flicker) entirely. Explicit
    // actions can pass { force: true } to bypass this.
    if (!options?.force && fid && Date.now() - lastLoadAtRef.current < RELOAD_THROTTLE_MS) {
      return;
    }

    if (fid) {
      setHasHydrated(false);
      await Promise.all([
        loadProjects(fid, cid || undefined),
        cid ? loadInvestments(cid, { autoClaimReady: true }) : Promise.resolve(),
      ]);
      lastLoadAtRef.current = Date.now();
      setHasHydrated(true);
    } else {
      setHasHydrated(false);
      await hydrate();
    }
  }, [hydrate, loadProjects, loadInvestments]);

  // ── Parent actions ──────────────────────────────────────────────────────────

  const createMission = useCallback(
    async (input: Omit<CreateMissionInput, 'familyId'>) => {
      const fid = familyIdRef.current;
      if (!fid) throw new Error('family_not_loaded');
      const project = await supabaseGrowthMissionsService.createMission({ ...input, familyId: fid });
      setProjects((prev) => [project, ...prev]);
    },
    [],
  );

  const updateMission = useCallback(async (input: UpdateMissionInput) => {
    const updated = await supabaseGrowthMissionsService.updateMission(input);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const archiveMission = useCallback(async (id: string) => {
    await supabaseGrowthMissionsService.archiveMission(id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)),
    );
  }, []);

  // ── Child actions ───────────────────────────────────────────────────────────

  const deposit = useCallback(
    async (projectId: string, amount: number) => {
      const cid = session?.childId ?? childIdRef.current;
      if (!cid) throw new Error('no_child_id');
      const project = projects.find((item) => item.id === projectId);
      const savingsPreview = project
        ? applySavingsSkills({
            bonusPercent: project.bonusPercent,
            durationDays: project.durationDays,
            unlocks: childSkillUnlocks,
            childId: cid,
          })
        : undefined;
      const skillBonusPercent = project && savingsPreview
        ? Math.max(0, savingsPreview.bonusPercent - project.bonusPercent)
        : 0;
      await supabaseGrowthMissionsService.deposit({
        projectId,
        childId: cid,
        amount,
        skillBonusPercent,
      });
      await reloadFamilyPointsState();
      await loadInvestments(cid, { autoClaimReady: true });
    },
    [childSkillUnlocks, projects, session, loadInvestments, reloadFamilyPointsState],
  );

  const claim = useCallback(
    async (investmentId: string) => {
      const cid = session?.childId ?? childIdRef.current;
      if (!cid) throw new Error('no_child_id');
      await supabaseGrowthMissionsService.claim({ investmentId, childId: cid });
      await Promise.all([reloadFamilyPointsState(), loadInvestments(cid)]);
    },
    [session, loadInvestments, reloadFamilyPointsState],
  );

  const value = useMemo<GrowthMissionsContextValue>(
    () => ({
      hasHydrated, projects, myInvestments,
      createMission, updateMission, archiveMission,
      deposit, claim, reload,
    }),
    [
      hasHydrated, projects, myInvestments,
      createMission, updateMission, archiveMission,
      deposit, claim, reload,
    ],
  );

  return (
    <GrowthMissionsContext.Provider value={value}>
      {children}
    </GrowthMissionsContext.Provider>
  );
};

export const useGrowthMissions = (): GrowthMissionsContextValue => {
  const ctx = useContext(GrowthMissionsContext);
  if (!ctx) throw new Error('useGrowthMissions must be used inside GrowthMissionsProvider');
  return ctx;
};
