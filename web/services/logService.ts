import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DailyLog } from "@/types";

export function todayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getTodayLog(userId: string): Promise<DailyLog | null> {
  const today = todayDateStr();
  const snap = await getDoc(doc(db, "users", userId, "logs", today));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as DailyLog;
  }
  return null;
}

export async function saveLog(
  userId: string,
  log: Omit<DailyLog, "id" | "userId">
): Promise<void> {
  const logRef = doc(db, "users", userId, "logs", log.date);
  await setDoc(logRef, { ...log, userId });
}

export async function getLogs(
  userId: string,
  limitCount = 30
): Promise<DailyLog[]> {
  const q = query(
    collection(db, "users", userId, "logs"),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyLog));
}

export async function getWeeklyLogs(userId: string): Promise<DailyLog[]> {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const promises = dates.map((date) =>
    getDoc(doc(db, "users", userId, "logs", date))
  );
  const snapshots = await Promise.all(promises);

  return snapshots.map((snap, i) => {
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as DailyLog;
    }
    return {
      id: dates[i],
      userId,
      date: dates[i],
      foods: [],
      exercises: [],
      totalCalories: 0,
    };
  });
}
