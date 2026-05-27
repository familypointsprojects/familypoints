import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { authService } from './authService';
import type { AuthSession, SignInAsChildInput, SignInDemoRoleInput, SignInInput } from './types';

type AuthContextValue = {
  session: AuthSession | null;
  hasHydrated: boolean;
  signIn: (input: SignInInput) => Promise<AuthSession>;
  signInDemoRole: (input: SignInDemoRoleInput) => Promise<AuthSession>;
  signInAsChild: (input: SignInAsChildInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges?.((nextSession) => {
      setSession(nextSession);
      setHasHydrated(true);
    });

    if (unsubscribe) {
      return unsubscribe;
    }

    let isMounted = true;

    authService
      .getSession()
      .then((storedSession) => {
        if (isMounted) {
          setSession(storedSession);
        }
      })
      .catch((error: unknown) => {
        console.warn('Failed to hydrate auth session', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      hasHydrated,
      signIn: async (input) => {
        const nextSession = await authService.signIn(input);
        setSession(nextSession);
        return nextSession;
      },
      signInDemoRole: async (input) => {
        const nextSession = await authService.signInDemoRole(input);
        setSession(nextSession);
        return nextSession;
      },
      signInAsChild: async (input) => {
        const nextSession = await authService.signInAsChild(input);
        setSession(nextSession);
        return nextSession;
      },
      signOut: async () => {
        await authService.signOut();
        setSession(null);
      },
    }),
    [hasHydrated, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
