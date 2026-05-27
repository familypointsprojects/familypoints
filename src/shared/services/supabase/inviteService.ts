import { getSupabaseClient } from './client';

export type ChildInvite = {
  id: string;
  childId: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

export type ValidatedChildSession = {
  childId: string;
  profileId: string;
  name: string;
  avatarColor: string;
  role: 'child';
};

/**
 * Создаёт инвайт-токен для ребёнка.
 * Вызывается родителем. Возвращает токен для генерации QR/ссылки.
 */
export const createChildInvite = async (
  childId: string,
  parentProfileId: string,
): Promise<ChildInvite> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('child_invites')
    .insert({
      child_id: childId,
      created_by: parentProfileId,
    })
    .select('id, child_id, token, expires_at, used_at, created_at')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create invite: ${error?.message ?? 'Unknown error'}`);
  }

  return {
    id: data.id as string,
    childId: data.child_id as string,
    token: data.token as string,
    expiresAt: data.expires_at as string,
    usedAt: data.used_at as string | null,
    createdAt: data.created_at as string,
  };
};

/**
 * Валидирует токен инвайта и возвращает данные ребёнка.
 * Вызывается с устройства ребёнка (без родительской сессии).
 * Токен одноразовый — после валидации помечается как использованный.
 */
export const validateChildInvite = async (token: string): Promise<ValidatedChildSession> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('validate_child_invite', {
    invite_token: token,
  });

  if (error) {
    throw new Error(`Failed to validate invite: ${error.message}`);
  }

  const result = data as { error?: string } & ValidatedChildSession;

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    childId: result.childId,
    profileId: result.profileId,
    name: result.name,
    avatarColor: result.avatarColor,
    role: 'child',
  };
};

/**
 * Возвращает активные инвайты для ребёнка (не использованные, не истёкшие).
 * Вызывается родителем для отображения/отзыва.
 */
export const getActiveInvitesForChild = async (childId: string): Promise<ChildInvite[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('child_invites')
    .select('id, child_id, token, expires_at, used_at, created_at')
    .eq('child_id', childId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch invites: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    childId: row.child_id as string,
    token: row.token as string,
    expiresAt: row.expires_at as string,
    usedAt: row.used_at as string | null,
    createdAt: row.created_at as string,
  }));
};

/**
 * Отзывает инвайт (удаляет токен).
 */
export const revokeChildInvite = async (inviteId: string): Promise<void> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('child_invites').delete().eq('id', inviteId);

  if (error) {
    throw new Error(`Failed to revoke invite: ${error.message}`);
  }
};
