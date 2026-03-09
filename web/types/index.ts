export interface UserProfile {
  email: string;
  calorieGoal: number;
  calorieBurnGoal?: number;
  weightGoal?: number;
  displayName?: string;
}

export interface Food {
  id?: string;
  userId?: string;
  name: string;
  caloriesPerUnit: number;
  unit?: string;
  protein?: number;   // g per unit
  carbs?: number;     // g per unit
  fat?: number;       // g per unit
}

export interface FoodEntry {
  foodId: string;
  foodName: string;
  quantity: number;
  totalCalories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
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
  totalBurned?: number;
  netCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
}

export interface WeeklyData {
  day: string;
  date: string;
  calories: number;
  burned: number;
  net: number;
}

export interface WeightEntry {
  id?: string;
  userId?: string;
  weight: number;
  date: string;
  note?: string;
}

export interface DailyMacros {
  protein: number;
  carbs: number;
  fat: number;
}
