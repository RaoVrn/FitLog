import { todayDateStr } from "@/services/logService";

export interface StreakAchievement {
  days: number;
  title: string;
}

export const STREAK_ACHIEVEMENTS: StreakAchievement[] = [
  { days: 3, title: "Warm Up" },
  { days: 7, title: "On Fire" },
  { days: 14, title: "Momentum" },
  { days: 30, title: "Locked In" },
  { days: 60, title: "Relentless" },
  { days: 100, title: "Legend" },
];

export function isStreakActiveToday(lastActiveDate: string): boolean {
  return Boolean(lastActiveDate) && lastActiveDate === todayDateStr();
}

export function getStreakStatusMessage(
  currentStreak: number,
  lastActiveDate: string
): string {
  if (currentStreak === 0) {
    return "Log activity today to start your streak.";
  }

  return isStreakActiveToday(lastActiveDate)
    ? "You logged activity today — keep it going."
    : "Log something today to protect your streak.";
}

export function getNextMilestone(currentStreak: number): number | null {
  return (
    STREAK_ACHIEVEMENTS.find((achievement) => achievement.days > currentStreak)
      ?.days ?? null
  );
}

export function getStreakProgress(currentStreak: number): {
  nextMilestone: number | null;
  progressPercent: number;
  progressLabel: string;
} {
  const nextMilestone = getNextMilestone(currentStreak);

  if (!nextMilestone) {
    return {
      nextMilestone: null,
      progressPercent: 100,
      progressLabel: `${currentStreak} / ${currentStreak} days`,
    };
  }

  return {
    nextMilestone,
    progressPercent: Math.max(
      0,
      Math.min(100, Math.round((currentStreak / nextMilestone) * 100))
    ),
    progressLabel: `${currentStreak} / ${nextMilestone} days`,
  };
}

export function getUnlockedAchievements(
  currentStreak: number
): StreakAchievement[] {
  return STREAK_ACHIEVEMENTS.filter(
    (achievement) => currentStreak >= achievement.days
  );
}