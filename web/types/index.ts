export interface Food {
  id?: string;
  name: string;
  caloriesPerUnit: number;
  unit?: string;
}

export interface FoodEntry {
  foodId: string;
  foodName: string;
  quantity: number;
  totalCalories: number;
}

export interface Exercise {
  id?: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  caloriesBurned?: number;
}

export interface DailyLog {
  id?: string;
  userId: string;
  date: string;
  foods: FoodEntry[];
  exercises: Exercise[];
  totalCalories: number;
}

export interface WeeklyData {
  day: string;
  calories: number;
}
