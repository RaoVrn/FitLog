"use client";

import { useState, useEffect } from "react";
import { Utensils, Plus, Trash2, Flame, Loader2, CheckCircle } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getFoods } from "@/services/foodService";
import { getTodayLog, saveLog, todayDateStr } from "@/services/logService";
import { calculateCalories } from "@/utils/calorieCalculator";
import { Food, FoodEntry } from "@/types";
import toast from "react-hot-toast";

function LogDietContent() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [userFoods, todayLog] = await Promise.all([
          getFoods(user.uid),
          getTodayLog(user.uid),
        ]);
        setFoods(userFoods);
        if (todayLog) setEntries(todayLog.foods);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const selectedFood = foods.find((f) => f.id === selectedFoodId);
  const previewCalories = selectedFood
    ? calculateCalories(selectedFood.caloriesPerUnit, parseFloat(quantity) || 0)
    : 0;
  const totalCalories = entries.reduce((s, e) => s + e.totalCalories, 0);

  const handleAdd = () => {
    if (!selectedFood || !quantity || parseFloat(quantity) <= 0) return;
    const qty = parseFloat(quantity);
    const entry: FoodEntry = {
      foodId: selectedFood.id!,
      foodName: selectedFood.name,
      quantity: qty,
      totalCalories: calculateCalories(selectedFood.caloriesPerUnit, qty),
    };
    setEntries((prev) => [...prev, entry]);
    setSelectedFoodId("");
    setQuantity("1");
    setSaved(false);
    toast.success(`${selectedFood.name} added to today's log.`);
  };

  const handleRemove = (index: number) => {
    const removed = entries[index];
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
    toast(`${removed.foodName} removed from log.`, { icon: "🗑️" });
  };

  const handleSave = async () => {
    if (!user || entries.length === 0) return;
    setSaving(true);
    try {
      const today = todayDateStr();
      const existing = await getTodayLog(user.uid);
      await saveLog(user.uid, {
        date: today,
        foods: entries,
        exercises: existing?.exercises ?? [],
        totalCalories,
        totalBurned: existing?.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0) ?? 0,
      });
      setSaved(true);
      toast.success(`Diet log saved — ${totalCalories} kcal recorded!`);
    } catch (err) {
      console.error("Failed to save log:", err);
      toast.error("Failed to save diet log.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Log Diet</h1>
        <p className="mt-1 text-slate-400">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-200">
          <Utensils className="h-4 w-4 text-green-400" />
          Add a Food Item
        </h2>

        {foods.length === 0 ? (
          <div className="rounded-lg bg-slate-700/50 px-4 py-4 text-sm text-slate-400">
            No foods in your database yet.{" "}
            <a href="/foods" className="text-green-400 underline hover:text-green-300">
              Add foods here
            </a>{" "}
            first.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="col-span-2 rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
              >
                <option value="">Select a food...</option>
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} ({food.caloriesPerUnit} kcal / {food.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.1"
                step="0.5"
                className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
              />
            </div>

            {selectedFood && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2.5">
                <Flame className="h-4 w-4 text-green-400" />
                <span className="text-sm text-slate-300">
                  {quantity || "0"} × {selectedFood.caloriesPerUnit} kcal ={" "}
                  <strong className="text-green-400">{previewCalories} kcal</strong>
                </span>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!selectedFood || !quantity}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add to Log
            </button>
          </>
        )}
      </div>

      {entries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-300">Today&apos;s Meals</h2>
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5">
              <Flame className="h-4 w-4 text-green-400" />
              <span className="font-bold text-green-400">{totalCalories} kcal</span>
            </div>
          </div>

          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50"
              >
                <div>
                  <p className="font-medium text-slate-100">{entry.foodName}</p>
                  <p className="text-sm text-slate-400">
                    {entry.quantity} × {(entry.totalCalories / entry.quantity).toFixed(0)} kcal
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-green-400">{entry.totalCalories} kcal</span>
                  <button
                    onClick={() => handleRemove(i)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-semibold text-slate-950 transition hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-4 w-4" />
            ) : null}
            {saving ? "Saving..." : saved ? "Saved!" : `Save Diet Log (${totalCalories} kcal)`}
          </button>
        </div>
      )}

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-center">
          <Utensils className="mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-500">No meals logged today. Add a food above!</p>
        </div>
      )}
    </div>
  );
}

export default function LogDietPage() {
  return (
    <ProtectedRoute>
      <LogDietContent />
    </ProtectedRoute>
  );
}
