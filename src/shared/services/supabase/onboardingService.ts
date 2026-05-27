import * as ExpoCrypto from 'expo-crypto';

import { getSupabaseClient } from './client';

export type CreateFamilyInput = {
  parentEmail: string;
  parentPassword: string;
  parentName: string;
  familyName: string;
  childName: string;
};

export type CreateFamilyResult = {
  familyId: string;
  childId: string;
  parentId: string;
};

const AVATAR_COLORS = ['#58A4B0', '#E88C7D', '#7DB87A', '#9B8BD4', '#E8B44A'];

const pickAvatarColor = (): string =>
  AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

export const createFamily = async (input: CreateFamilyInput): Promise<CreateFamilyResult> => {
  const supabase = getSupabaseClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.parentEmail.trim(),
    password: input.parentPassword,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? 'Registration failed. Try again.');
  }

  const parentId = authData.user.id;

  const { error: parentProfileError } = await supabase.from('profiles').insert({
    id: parentId,
    name: input.parentName.trim(),
    role: 'parent',
  });

  if (parentProfileError) {
    throw new Error(`Failed to create profile: ${parentProfileError.message}`);
  }

  const { data: familyData, error: familyError } = await supabase
    .from('families')
    .insert({ name: input.familyName.trim(), created_by: parentId })
    .select('id')
    .single();

  if (familyError || !familyData) {
    throw new Error(`Failed to create family: ${familyError?.message ?? ''}`);
  }

  const familyId = familyData.id as string;

  const { error: parentMemberError } = await supabase.from('family_members').insert({
    family_id: familyId,
    profile_id: parentId,
    role: 'parent',
  });

  if (parentMemberError) {
    throw new Error(`Failed to add parent to family: ${parentMemberError.message}`);
  }

  const childProfileId = ExpoCrypto.randomUUID();

  const { error: childProfileError } = await supabase.from('profiles').insert({
    id: childProfileId,
    name: input.childName.trim(),
    role: 'child',
  });

  if (childProfileError) {
    throw new Error(`Failed to create child profile: ${childProfileError.message}`);
  }

  const { data: childData, error: childError } = await supabase
    .from('children')
    .insert({
      family_id: familyId,
      profile_id: childProfileId,
      display_name: input.childName.trim(),
      avatar_color: pickAvatarColor(),
    })
    .select('id')
    .single();

  if (childError || !childData) {
    throw new Error(`Failed to create child: ${childError?.message ?? ''}`);
  }

  const childId = childData.id as string;

  const { error: childMemberError } = await supabase.from('family_members').insert({
    family_id: familyId,
    profile_id: childProfileId,
    role: 'child',
  });

  if (childMemberError) {
    throw new Error(`Failed to add child to family: ${childMemberError.message}`);
  }

  return { familyId, childId, parentId };
};