import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserStats } from "@/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatDate(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

function createInitialStats(userId: string, today: string): UserStats {
  return {
    userId,
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: today,
  };
}

export async function updateUserStreak(userId: string): Promise<UserStats> {
  const today = formatDate();
  const statsRef = doc(db, "userStats", userId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(statsRef);

    if (!snapshot.exists()) {
      const initialStats = createInitialStats(userId, today);
      transaction.set(statsRef, initialStats);
      return initialStats;
    }

    const existing = snapshot.data() as Partial<UserStats>;
    const lastActiveDate = existing.lastActiveDate;

    if (!lastActiveDate) {
      const initialStats = createInitialStats(userId, today);
      transaction.set(statsRef, initialStats, { merge: true });
      return initialStats;
    }

    if (lastActiveDate === today) {
      return {
        userId,
        currentStreak: existing.currentStreak ?? 0,
        longestStreak: existing.longestStreak ?? 0,
        lastActiveDate,
      };
    }

    const dayGap = Math.floor(
      (parseDate(today).getTime() - parseDate(lastActiveDate).getTime()) / DAY_IN_MS
    );
    const currentStreak = dayGap === 1 ? (existing.currentStreak ?? 0) + 1 : 1;
    const longestStreak = Math.max(existing.longestStreak ?? 0, currentStreak);

    const updatedStats: UserStats = {
      userId,
      currentStreak,
      longestStreak,
      lastActiveDate: today,
    };

    transaction.set(statsRef, updatedStats, { merge: true });
    return updatedStats;
  });
}