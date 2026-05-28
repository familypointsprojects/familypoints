import type { FavoriteGoal, FavoriteGoalType } from '@/shared/state/types';

export const getFavoriteGoalForChild = (
  favoriteGoals: FavoriteGoal[],
  childId: string,
): FavoriteGoal | undefined =>
  favoriteGoals.find((goal) => goal.childId === childId);

export const isFavoriteGoal = (
  favoriteGoal: FavoriteGoal | undefined,
  type: FavoriteGoalType,
  itemId: string,
): boolean => favoriteGoal?.type === type && favoriteGoal.itemId === itemId;

export const canSelectFavoriteGoal = (
  favoriteGoal: FavoriteGoal | undefined,
  type: FavoriteGoalType,
  itemId: string,
): boolean => !favoriteGoal || isFavoriteGoal(favoriteGoal, type, itemId);

export const moveFavoriteGoalsToFront = <TItem>(
  items: TItem[],
  favoriteGoals: FavoriteGoal[],
  type: FavoriteGoalType,
  getItemId: (item: TItem) => string,
  visibleOrder: string[] = [],
): TItem[] => {
  const orderById = new Map(visibleOrder.map((id, index) => [id, index]));
  const orderedItems = [...items].sort((firstItem, secondItem) => {
    const firstIndex = orderById.get(getItemId(firstItem));
    const secondIndex = orderById.get(getItemId(secondItem));

    if (firstIndex === undefined && secondIndex === undefined) {
      return 0;
    }

    if (firstIndex === undefined) {
      return 1;
    }

    if (secondIndex === undefined) {
      return -1;
    }

    return firstIndex - secondIndex;
  });
  const favoriteItems: TItem[] = [];
  const regularItems: TItem[] = [];

  orderedItems.forEach((item) => {
    const isFavorite = favoriteGoals.some((goal) =>
      isFavoriteGoal(goal, type, getItemId(item)),
    );

    if (isFavorite) {
      favoriteItems.push(item);
      return;
    }

    regularItems.push(item);
  });

  return [...favoriteItems, ...regularItems];
};
