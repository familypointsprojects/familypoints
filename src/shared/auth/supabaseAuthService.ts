import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSupabaseClient } from '@/shared/services/supabase';
import { validateChildInvite } from '@/shared/services/supabase/inviteService';

import type { AuthService, AuthSession } from './types';

const CHILD_SESSION_KEY = '@family_points/child_session';

const getStoredChildSession = async (): Promise<AuthSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(CHILD_SESSION_KEY);

    if (raw) {
      return JSON.parse(raw) as AuthSession;
    }
  } catch {
    // ignore
  }

  return null;
};

const buildSession = (profileId: string, name: string, role: string): AuthSession => ({
  profileId,
  role: role === 'child' ? 'child' : 'parent',
  name,
  isDemo: false,
});

export const supabaseAuthService: AuthService = {
  getSession: async () => {
    const childSession = await getStoredChildSession();

    if (childSession) {
      return childSession;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return buildSession(profile.id as string, profile.name as string, profile.role as string);
  },

  signIn: async ({ email, password }) => {
    await AsyncStorage.removeItem(CHILD_SESSION_KEY);

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Sign in failed');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found. Please complete registration first.');
    }

    return buildSession(profile.id as string, profile.name as string, profile.role as string);
  },

  signUp: async ({ email, password, parentName }) => {
    await AsyncStorage.removeItem(CHILD_SESSION_KEY);

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Registration failed');
    }

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      throw new Error('Account created. Please confirm your email, then sign in.');
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: parentName.trim(),
      role: 'parent',
    });

    if (profileError) {
      throw new Error(`Failed to create parent profile: ${profileError.message}`);
    }

    return buildSession(data.user.id, parentName.trim(), 'parent');
  },

  signInAsChild: async ({ token }) => {
    // Валидируем инвайт-токен через Supabase RPC
    const childData = await validateChildInvite(token);

    const session: AuthSession = {
      profileId: childData.profileId,
      role: 'child',
      name: childData.name,
      isDemo: false,
      childId: childData.childId,
      avatarColor: childData.avatarColor,
    };

    // Сохраняем child-сессию локально (дети не имеют auth.users аккаунта)
    await AsyncStorage.setItem(CHILD_SESSION_KEY, JSON.stringify(session));

    return session;
  },

  signInDemoRole: async () => {
    throw new Error('Demo role sign-in is local only. Use Supabase auth forms.');
  },

  signOut: async () => {
    // Очищаем child-сессию если есть
    await AsyncStorage.removeItem(CHILD_SESSION_KEY);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  },

  subscribeToAuthChanges: (callback) => {
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const childSession = await getStoredChildSession();

      if (childSession) {
        callback(childSession);
        return;
      }

      // Если нет Supabase-сессии — проверяем child-сессию в AsyncStorage
      if (!session) {
        callback(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        callback(null);
        return;
      }

      callback(buildSession(profile.id as string, profile.name as string, profile.role as string));
    });

    return () => subscription.unsubscribe();
  },
};
