export function calculateCalories(caloriesPerUnit: number, quantity: number): number {
  return Math.round(caloriesPerUnit * quantity);
}

export function calculateTotalCalories(
  entries: { caloriesPerUnit: number; quantity: number }[]
): number {
  return entries.reduce((sum, e) => sum + calculateCalories(e.caloriesPerUnit, e.quantity), 0);
}

/** Mifflin-St Jeor BMR (kcal/day) */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" | "other"
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return Math.round(base + 5);
  if (gender === "female") return Math.round(base - 161);
  return Math.round(base - 78); // average for "other"
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** TDEE = BMR × activity multiplier */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2));
}

/** BMI rounded to 1 decimal */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
  if (bmi < 25)   return { label: "Normal weight", color: "text-green-400" };
  if (bmi < 30)   return { label: "Overweight", color: "text-yellow-400" };
  return { label: "Obese", color: "text-red-400" };
}
