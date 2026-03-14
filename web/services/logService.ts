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
import { DailyLog, WeeklyData } from "@/types";
import { updateUserStreak } from "@/utils/updateStreak";

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

export async function getLogByDate(
  userId: string,
  date: string
): Promise<DailyLog | null> {
  const snap = await getDoc(doc(db, "users", userId, "logs", date));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as DailyLog;
  }
  return null;
}

export async function saveLog(
  userId: string,
  log: Omit<DailyLog, "id" | "userId">
): Promise<void> {
  const totalBurned = log.exercises.reduce(
    (s, e) => s + (e.caloriesBurned || 0),
    0
  );
  const totalProtein = log.foods.reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs = log.foods.reduce((s, f) => s + (f.carbs || 0), 0);
  const totalFat = log.foods.reduce((s, f) => s + (f.fat || 0), 0);
  const netCalories = log.totalCalories - totalBurned;
  const logRef = doc(db, "users", userId, "logs", log.date);
  await setDoc(logRef, {
    ...log,
    userId,
    totalBurned,
    netCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  });
}

export async function logDiet(
  userId: string,
  log: Omit<DailyLog, "id" | "userId">
): Promise<void> {
  await saveLog(userId, log);
  await updateUserStreak(userId);
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

export async function getWeeklyLogs(userId: string): Promise<WeeklyData[]> {
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
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return snapshots.map((snap, i) => {
    const date = dates[i];
    const dayName = dayNames[new Date(date + "T00:00:00").getDay()];
    if (snap.exists()) {
      const data = snap.data() as DailyLog;
      return {
        day: dayName,
        date,
        calories: data.totalCalories ?? 0,
        burned: data.totalBurned ?? 0,
        net: data.netCalories ?? (data.totalCalories ?? 0) - (data.totalBurned ?? 0),
      };
    }
    return { day: dayName, date, calories: 0, burned: 0, net: 0 };
  });
}
