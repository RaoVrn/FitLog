export function calculateCalories(caloriesPerUnit: number, quantity: number): number {
  return Math.round(caloriesPerUnit * quantity);
}

export function calculateTotalCalories(
  entries: { caloriesPerUnit: number; quantity: number }[]
): number {
  return entries.reduce((sum, e) => sum + calculateCalories(e.caloriesPerUnit, e.quantity), 0);
}
