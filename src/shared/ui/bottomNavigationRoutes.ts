const bottomNavigationRoutes = new Set([
  '/parent/dashboard',
  '/parent/tasks',
  '/parent/submissions',
  '/parent/rewards',
  '/parent/redemptions',
  '/child/dashboard',
  '/child/tasks',
  '/child/balance',
  '/child/rewards',
]);

export const shouldShowBottomNavigation = (pathname: string): boolean =>
  bottomNavigationRoutes.has(pathname);
