const bottomNavigationRoutes = new Set([
  '/parent/dashboard',
  '/parent/tasks',
  '/parent/submissions',
  '/parent/rewards',
  '/parent/redemptions',
  '/parent/growth-missions',
  '/child/dashboard',
  '/child/tasks',
  '/child/balance',
  '/child/rewards',
  '/child/growth-missions',
]);

export const shouldShowBottomNavigation = (pathname: string): boolean =>
  bottomNavigationRoutes.has(pathname);
