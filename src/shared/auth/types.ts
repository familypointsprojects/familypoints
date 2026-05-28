import type { UserRole } from '@/shared/types/family';

export type AuthSession = {
  profileId: string;
  role: UserRole;
  name: string;
  isDemo: boolean;
  // Только для child-сессий (вход по инвайту)
  childId?: string;
  avatarColor?: string;
};

export type SignInDemoRoleInput = {
  role: UserRole;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = SignInInput & {
  parentName: string;
};

export type SignInAsChildInput = {
  token: string;
};

export type AuthService = {
  getSession: () => Promise<AuthSession | null>;
  signIn: (input: SignInInput) => Promise<AuthSession>;
  signUp: (input: SignUpInput) => Promise<AuthSession>;
  signInDemoRole: (input: SignInDemoRoleInput) => Promise<AuthSession>;
  signInAsChild: (input: SignInAsChildInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  subscribeToAuthChanges?: (callback: (session: AuthSession | null) => void) => () => void;
};
