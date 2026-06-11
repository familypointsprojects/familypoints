import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

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

  signInWithGoogle: async () => {
    await AsyncStorage.removeItem(CHILD_SESSION_KEY);

    const supabase = getSupabaseClient();

    if (Platform.OS === 'web') {
      // На вебе — редирект в той же вкладке, сессия подхватится через callback-страницу
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw new Error(error.message);
      // Браузер сам редиректит, управление сюда не вернётся
      return new Promise<never>(() => {});
    }

    // Native — открываем через in-app browser
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data.url) {
      throw new Error(error?.message ?? 'Google sign-in failed');
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success') {
      throw new Error('Google sign-in was cancelled');
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);

    if (exchangeError) {
      throw new Error(exchangeError.message);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error('Failed to get user after Google sign-in');
    }

    // Проверяем или создаём профиль
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', userData.user.id)
      .single();

    if (!profile) {
      const name =
        userData.user.user_metadata?.full_name ??
        userData.user.user_metadata?.name ??
        userData.user.email?.split('@')[0] ??
        'Parent';

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userData.user.id, name, role: 'parent' })
        .select('id, name, role')
        .single();

      if (insertError || !newProfile) {
        throw new Error(`Failed to create profile: ${insertError?.message}`);
      }

      profile = newProfile;
    }

    return buildSession(profile.id as string, profile.name as string, profile.role as string);
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

  deleteAccount: async () => {
    await AsyncStorage.removeItem(CHILD_SESSION_KEY);

    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('delete_current_user');

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }

    await supabase.auth.signOut();
  },

  subscribeToAuthChanges: (callback) => {
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Игнорируем события обновления токена — они не меняют сессию пользователя
      if (event === 'TOKEN_REFRESHED' || event === 'MFA_CHALLENGE_VERIFIED') {
        return;
      }

      const childSession = await getStoredChildSession();

      if (childSession) {
        callback(childSession);
        return;
      }

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
