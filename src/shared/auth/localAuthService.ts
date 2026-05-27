import AsyncStorage from '@react-native-async-storage/async-storage';

import { childProfile, parentProfile } from '@/shared/mocks';

import type { AuthService, AuthSession, SignInDemoRoleInput } from './types';

const STORAGE_KEY = 'family-points:auth-session:v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.profileId === 'string' &&
    (value.role === 'parent' || value.role === 'child') &&
    typeof value.name === 'string' &&
    typeof value.isDemo === 'boolean'
  );
};

const createDemoSession = ({ role }: SignInDemoRoleInput): AuthSession => {
  const profile = role === 'parent' ? parentProfile : childProfile;

  return {
    profileId: profile.id,
    role: profile.role,
    name: profile.name,
    isDemo: true,
  };
};

export const localAuthService: AuthService = {
  getSession: async () => {
    const storedSession = await AsyncStorage.getItem(STORAGE_KEY);

    if (!storedSession) {
      return null;
    }

    const parsedSession: unknown = JSON.parse(storedSession);

    return isAuthSession(parsedSession) ? parsedSession : null;
  },
  signIn: async () => {
    throw new Error('Email sign-in is not available in local mode. Use demo login.');
  },
  signInDemoRole: async (input) => {
    const session = createDemoSession(input);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    return session;
  },
  signInAsChild: async () => {
    const session: AuthSession = {
      profileId: childProfile.id,
      role: 'child',
      name: childProfile.name,
      isDemo: true,
      childId: childProfile.id,
      avatarColor: childProfile.avatarColor,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    return session;
  },
  signOut: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
