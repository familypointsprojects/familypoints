import { isSupabaseConfigured } from '@/shared/services/supabase';

import { localAuthService } from './localAuthService';
import { supabaseAuthService } from './supabaseAuthService';
import type { AuthService } from './types';

const requestedDataSource = process.env.EXPO_PUBLIC_DATA_SOURCE;

export const authService: AuthService =
  requestedDataSource === 'supabase' && isSupabaseConfigured
    ? supabaseAuthService
    : localAuthService;
