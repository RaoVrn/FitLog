import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserStats } from "@/types";

function emptyUserStats(userId: string): UserStats {
  return {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
  };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const snapshot = await getDoc(doc(db, "userStats", userId));
  if (!snapshot.exists()) {
    return emptyUserStats(userId);
  }

  return {
    ...emptyUserStats(userId),
    ...(snapshot.data() as Partial<UserStats>),
    userId,
  };
}