import type { ChildInvestment, InvestmentProject } from '@/shared/types/family';

export type CreateMissionInput = {
  familyId: string;
  title: string;
  description?: string;
  durationDays: number;
  bonusPercent: number;
  minAmount: number;
  maxAmount: number;
};

export type UpdateMissionInput = {
  id: string;
  title?: string;
  description?: string;
  durationDays?: number;
  bonusPercent?: number;
  minAmount?: number;
  maxAmount?: number;
};

export type DepositInput = {
  projectId: string;
  childId: string; // children.id
  amount: number;
};

export type ClaimInput = {
  investmentId: string;
  childId: string; // children.id
};

export type GrowthMissionsService = {
  fetchProjects: (familyId: string, childId?: string) => Promise<InvestmentProject[]>;
  fetchChildInvestments: (childId: string) => Promise<ChildInvestment[]>;
  createMission: (input: CreateMissionInput) => Promise<InvestmentProject>;
  updateMission: (input: UpdateMissionInput) => Promise<InvestmentProject>;
  archiveMission: (id: string) => Promise<void>;
  deposit: (input: DepositInput) => Promise<string>; // returns investment id
  claim: (input: ClaimInput) => Promise<number>;     // returns new balance
};
