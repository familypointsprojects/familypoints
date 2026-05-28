import { isSupabaseConfigured } from '@/shared/services/supabase';

import { localFamilyPointsService } from './localFamilyPointsService';
import { supabaseFamilyPointsService } from './supabaseFamilyPointsService';
import type { FamilyPointsService } from './types';

export type FamilyPointsDataSource = 'local' | 'supabase';

const requestedDataSource = process.env.EXPO_PUBLIC_DATA_SOURCE;
const shouldUseLocalDataSource = requestedDataSource === 'local';

export const familyPointsDataSource: FamilyPointsDataSource =
  shouldUseLocalDataSource ? 'local' : 'supabase';

export const familyPointsService: FamilyPointsService =
  familyPointsDataSource === 'supabase' ? supabaseFamilyPointsService : localFamilyPointsService;

export const isFamilyPointsBackendConfigured = familyPointsDataSource === 'supabase' && isSupabaseConfigured;
