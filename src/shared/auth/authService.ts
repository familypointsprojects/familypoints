import { isSupabaseConfigured } from '@/shared/services/supabase';

import { localAuthService } from './localAuthService';
import { supabaseAuthService } from './supabaseAuthService';
import type { AuthService } from './types';

const requestedDataSource = process.env.EXPO_PUBLIC_DATA_SOURCE;
const shouldUseLocalAuth = requestedDataSource === 'local';

export const authService: AuthService = shouldUseLocalAuth ? localAuthService : supabaseAuthService;

export const isAuthBackendConfigured = !shouldUseLocalAuth && isSupabaseConfigured;
