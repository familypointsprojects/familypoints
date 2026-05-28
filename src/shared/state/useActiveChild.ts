import { useMemo } from 'react';

import { useAuth } from '@/shared/auth';
import type { ChildProfile } from '@/shared/types/family';

import { useFamilyPoints } from './FamilyPointsProvider';

type ActiveChildState = {
  activeChild?: ChildProfile;
  activeChildId: string;
  activeChildName: string;
  getChildName: (childId: string) => string;
};

const getSessionChildId = (session: ReturnType<typeof useAuth>['session']): string | undefined =>
  session?.role === 'child' ? session.childId ?? session.profileId : undefined;

export const useActiveChild = (): ActiveChildState => {
  const { session } = useAuth();
  const { activeChildId, children } = useFamilyPoints();

  return useMemo(() => {
    const sessionChildId = getSessionChildId(session);
    const resolvedChildId = sessionChildId ?? activeChildId ?? children[0]?.id ?? '';
    const activeChild = children.find((child) => child.id === resolvedChildId);
    const activeChildName =
      activeChild?.name ?? (session?.role === 'child' ? session.name : '');

    const getChildName = (childId: string): string => {
      const child = children.find((item) => item.id === childId);

      if (child) {
        return child.name;
      }

      if (session?.role === 'child' && childId === sessionChildId) {
        return session.name;
      }

      return childId;
    };

    return {
      activeChild,
      activeChildId: resolvedChildId,
      activeChildName,
      getChildName,
    };
  }, [activeChildId, children, session]);
};
