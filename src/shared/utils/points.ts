import { PointTransaction, Wish } from '@/shared/types/family';

export const getBalance = (transactions: PointTransaction[], childId: string): number =>
  transactions
    .filter((transaction) => transaction.childId === childId)
    .reduce((balance, transaction) => balance + transaction.points, 0);

export const getProgressPercent = (balance: number, price: number): number => {
  if (price <= 0) {
    return 100;
  }

  return Math.min(Math.round((balance / price) * 100), 100);
};

export const getNearestWish = (wishList: Wish[], balance: number): Wish | undefined =>
  [...wishList].sort((first, second) => {
    const firstRemaining = Math.max(first.price - balance, 0);
    const secondRemaining = Math.max(second.price - balance, 0);
    return firstRemaining - secondRemaining;
  })[0];
