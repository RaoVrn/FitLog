import { Exercise } from "@/types";
import { getTodayLog, saveLog, todayDateStr } from "./logService";
import { updateUserStreak } from "@/utils/updateStreak";

/** Strip undefined fields so Firestore never receives them */
function cleanExercise(e: Exercise): Exercise {
  return Object.fromEntries(
    Object.entries(e).filter(([, v]) => v !== undefined)
  ) as Exercise;
}

/** CREATE — append a new exercise to today's log */
export async function logExercise(
  userId: string,
  exercise: Exercise
): Promise<void> {
  const today = todayDateStr();
  const existingLog = await getTodayLog(userId);

  const foods = existingLog?.foods ?? [];
  const exercises = [...(existingLog?.exercises ?? []), cleanExercise(exercise)];
  const foodCalories = foods.reduce((s, f) => s + f.totalCalories, 0);
  const totalBurned = exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

  await saveLog(userId, {
    date: today,
    foods,
    exercises,
    totalCalories: foodCalories,
    totalBurned,
  });

  await updateUserStreak(userId);
}

export async function addExerciseToTodayLog(
  userId: string,
  exercise: Exercise
): Promise<void> {
  await logExercise(userId, exercise);
}

/** UPDATE — replace an existing exercise (matched by id) in today's log */
export async function updateExerciseInTodayLog(
  userId: string,
  updated: Exercise
): Promise<void> {
  const today = todayDateStr();
  const existingLog = await getTodayLog(userId);

  const foods = existingLog?.foods ?? [];
  const exercises = (existingLog?.exercises ?? []).map((e) =>
    e.id === updated.id ? cleanExercise(updated) : e
  );
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

/** DELETE ALL — clear every exercise from today's log */
export async function clearAllExercisesFromTodayLog(
  userId: string
): Promise<void> {
  const today = todayDateStr();
  const existingLog = await getTodayLog(userId);

  const foods = existingLog?.foods ?? [];
  const foodCalories = foods.reduce((s, f) => s + f.totalCalories, 0);

  await saveLog(userId, {
    date: today,
    foods,
    exercises: [],
    totalCalories: foodCalories,
    totalBurned: 0,
  });
}

export async function deleteExerciseFromTodayLog(
  userId: string,
  exerciseId: string
): Promise<void> {
  const today = todayDateStr();
  const existingLog = await getTodayLog(userId);

  const foods = existingLog?.foods ?? [];
  const exercises = (existingLog?.exercises ?? []).filter((e) => e.id !== exerciseId);
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
