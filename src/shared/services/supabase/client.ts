import AsyncStorage from '@react-native-async-storage/async-storage';
import 'whatwg-fetch';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseClient: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
      },
    })
  : null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error('Supabase is not configured. Add Expo public Supabase env variables.');
  }

  return supabaseClient;
};
