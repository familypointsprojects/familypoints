export type MissionCountdown = {
  days: number;
  hours: number;
  minutes: number;
  ready: boolean;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const getMissionCountdown = (
  maturesAt: string,
  nowMs = Date.now(),
): MissionCountdown => {
  const diffMs = new Date(maturesAt).getTime() - nowMs;

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, ready: true };
  }

  const days = Math.floor(diffMs / DAY_MS);
  const hours = Math.floor((diffMs % DAY_MS) / HOUR_MS);
  const minutes = Math.max(1, Math.ceil((diffMs % HOUR_MS) / MINUTE_MS));

  return { days, hours, minutes, ready: false };
};
