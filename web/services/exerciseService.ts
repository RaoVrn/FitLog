import { Exercise } from "@/types";
import { getTodayLog, saveLog, todayDateStr } from "./logService";

export async function addExerciseToTodayLog(
  userId: string,
  exercise: Exercise
): Promise<void> {
  const today = todayDateStr();
  const existingLog = await getTodayLog(userId);

  const foods = existingLog?.foods ?? [];
  const exercises = [...(existingLog?.exercises ?? []), exercise];
  const foodCalories = foods.reduce((s, f) => s + f.totalCalories, 0);
  const totalBurned = exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

  await saveLog(userId, {
    date: today,
    foods,
    exercises,
    totalCalories: foodCalories,
    totalBurned,
  });
}
