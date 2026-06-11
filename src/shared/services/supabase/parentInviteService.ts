import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSupabaseClient } from './client';

export type ParentInvite = {
  id: string;
  familyId: string;
  token: string;
  hasFullPermissions: boolean;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

const buildInviteUrl = (token: string) =>
  `familypoints://invite/parent/${token}`;

export { buildInviteUrl as buildParentInviteUrl };

const PENDING_PARENT_INVITE_KEY = '@family_points/pending_parent_invite';

export const savePendingParentInvite = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(PENDING_PARENT_INVITE_KEY, token);
};

export const getPendingParentInvite = async (): Promise<string | null> =>
  AsyncStorage.getItem(PENDING_PARENT_INVITE_KEY);

export const clearPendingParentInvite = async (): Promise<void> => {
  await AsyncStorage.removeItem(PENDING_PARENT_INVITE_KEY);
};

/**
 * Создаёт инвайт-токен для второго родителя.
 */
export const createParentInvite = async (
  familyId: string,
  parentProfileId: string,
  hasFullPermissions: boolean,
): Promise<ParentInvite> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('parent_invites')
    .insert({
      family_id: familyId,
      created_by: parentProfileId,
      has_full_permissions: hasFullPermissions,
    })
    .select('id, family_id, token, has_full_permissions, expires_at, used_at, created_at')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create parent invite: ${error?.message ?? 'Unknown error'}`);
  }

  return {
    id: data.id as string,
    familyId: data.family_id as string,
    token: data.token as string,
    hasFullPermissions: data.has_full_permissions as boolean,
    expiresAt: data.expires_at as string,
    usedAt: data.used_at as string | null,
    createdAt: data.created_at as string,
  };
};

/**
 * Валидирует токен инвайта и привязывает текущего пользователя к семье.
 * Вызывается с устройства второго родителя (должен быть авторизован).
 */
export const validateParentInvite = async (
  token: string,
): Promise<{ familyId: string; hasFullPermissions: boolean }> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('validate_parent_invite', {
    invite_token: token,
  });

  if (error) {
    throw new Error(`Failed to validate invite: ${error.message}`);
  }

  const result = data as { error?: string; familyId?: string; hasFullPermissions?: boolean };

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    familyId: result.familyId!,
    hasFullPermissions: result.hasFullPermissions ?? false,
  };
};

/**
 * Возвращает активные инвайты для семьи.
 */
export const getActiveParentInvites = async (familyId: string): Promise<ParentInvite[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('parent_invites')
    .select('id, family_id, token, has_full_permissions, expires_at, used_at, created_at')
    .eq('family_id', familyId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch invites: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    familyId: row.family_id as string,
    token: row.token as string,
    hasFullPermissions: row.has_full_permissions as boolean,
    expiresAt: row.expires_at as string,
    usedAt: row.used_at as string | null,
    createdAt: row.created_at as string,
  }));
};

/**
 * Отзывает инвайт.
 */
export const revokeParentInvite = async (inviteId: string): Promise<void> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('parent_invites').delete().eq('id', inviteId);

  if (error) {
    throw new Error(`Failed to revoke invite: ${error.message}`);
  }
};
