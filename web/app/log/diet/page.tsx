"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Utensils, Plus, Trash2, Flame, Loader2, CheckCircle,
  Pencil, Check, X, Zap, Search, AlertCircle,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getFoods } from "@/services/foodService";
import { getTodayLog, saveLog, todayDateStr } from "@/services/logService";
import { getUserProfile } from "@/services/userService";
import { calculateCalories } from "@/utils/calorieCalculator";
import { Food, FoodEntry, Exercise } from "@/types";
import { MacroSummary } from "@/components/MacroDisplay";
import { SkeletonList } from "@/components/Skeleton";
import toast from "react-hot-toast";

function LogDietContent() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editQty, setEditQty] = useState("");
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ type: "single"; index: number } | { type: "all" } | null>(null);
  // cache existing exercises so we never overwrite them on diet saves
  const exercisesRef = useRef<Exercise[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [userFoods, todayLog, profile] = await Promise.all([
          getFoods(user.uid),
          getTodayLog(user.uid),
          getUserProfile(user.uid),
        ]);
        setFoods(userFoods);
        if (todayLog) {
          setEntries(todayLog.foods ?? []);
          exercisesRef.current = todayLog.exercises ?? [];
        }
        if (profile?.calorieGoal) setCalorieGoal(profile.calorieGoal);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods;
    return foods.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foods, searchQuery]);

  const selectedFood = foods.find((f) => f.id === selectedFoodId);
  const previewCalories = selectedFood
    ? calculateCalories(selectedFood.caloriesPerUnit, parseFloat(quantity) || 0)
    : 0;

  const totalCalories = entries.reduce((s, e) => s + e.totalCalories, 0);
  const totalProtein  = entries.reduce((s, e) => s + (e.protein || 0), 0);
  const totalCarbs    = entries.reduce((s, e) => s + (e.carbs || 0), 0);
  const totalFat      = entries.reduce((s, e) => s + (e.fat || 0), 0);
  const hasMacros     = totalProtein > 0 || totalCarbs > 0 || totalFat > 0;

  /** Immediately persists a given entries array to Firestore. */
  const persistEntries = async (nextEntries: FoodEntry[]) => {
    if (!user) return;
    setSyncing(true);
    try {
      const cal = nextEntries.reduce((s, e) => s + e.totalCalories, 0);
      await saveLog(user.uid, {
        date: todayDateStr(),
        foods: nextEntries,
        exercises: exercisesRef.current,
        totalCalories: cal,
      });
      setSavedAt(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
      toast.error("Failed to save — please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedFood || !quantity || parseFloat(quantity) <= 0) return;
    const qty = parseFloat(quantity);
    const existingIdx = entries.findIndex((e) => e.foodId === selectedFood.id!);
    let next: FoodEntry[];
    if (existingIdx !== -1) {
      const newQty = entries[existingIdx].quantity + qty;
      const updated: FoodEntry = {
        ...entries[existingIdx],
        quantity: newQty,
        totalCalories: calculateCalories(selectedFood.caloriesPerUnit, newQty),
        protein: selectedFood.protein !== undefined ? Math.round(selectedFood.protein * newQty * 10) / 10 : undefined,
        carbs:   selectedFood.carbs   !== undefined ? Math.round(selectedFood.carbs   * newQty * 10) / 10 : undefined,
        fat:     selectedFood.fat     !== undefined ? Math.round(selectedFood.fat     * newQty * 10) / 10 : undefined,
      };
      next = entries.map((e, i) => (i === existingIdx ? updated : e));
      toast.success(`${selectedFood.name} updated (+${qty}).`);
    } else {
      const entry: FoodEntry = {
        foodId: selectedFood.id!,
        foodName: selectedFood.name,
        quantity: qty,
        totalCalories: calculateCalories(selectedFood.caloriesPerUnit, qty),
        protein: selectedFood.protein !== undefined ? Math.round(selectedFood.protein * qty * 10) / 10 : undefined,
        carbs:   selectedFood.carbs   !== undefined ? Math.round(selectedFood.carbs   * qty * 10) / 10 : undefined,
        fat:     selectedFood.fat     !== undefined ? Math.round(selectedFood.fat     * qty * 10) / 10 : undefined,
      };
      next = [...entries, entry];
      toast.success(`${selectedFood.name} added.`);
    }
    setEntries(next);
    setSelectedFoodId("");
    setQuantity("1");
    await persistEntries(next);
  };

  const handleQuickAdd = async (food: Food) => {
    const existingIdx = entries.findIndex((e) => e.foodId === food.id!);
    let next: FoodEntry[];
    if (existingIdx !== -1) {
      const newQty = entries[existingIdx].quantity + 1;
      const updated: FoodEntry = {
        ...entries[existingIdx],
        quantity: newQty,
        totalCalories: calculateCalories(food.caloriesPerUnit, newQty),
        protein: food.protein !== undefined ? Math.round(food.protein * newQty * 10) / 10 : undefined,
        carbs:   food.carbs   !== undefined ? Math.round(food.carbs   * newQty * 10) / 10 : undefined,
        fat:     food.fat     !== undefined ? Math.round(food.fat     * newQty * 10) / 10 : undefined,
      };
      next = entries.map((e, i) => (i === existingIdx ? updated : e));
      toast.success(`${food.name} updated (+1).`);
    } else {
      const entry: FoodEntry = {
        foodId: food.id!,
        foodName: food.name,
        quantity: 1,
        totalCalories: food.caloriesPerUnit,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      };
      next = [...entries, entry];
      toast.success(`${food.name} added.`);
    }
    setEntries(next);
    await persistEntries(next);
  };

  const handleClearAll = async () => {
    setEntries([]);
    toast("All items cleared.", { icon: "🗑️" });
    await persistEntries([]);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === "single") {
      const removed = entries[confirmDialog.index];
      const next = entries.filter((_, i) => i !== confirmDialog.index);
      setEntries(next);
      toast(`${removed.foodName} removed.`, { icon: "🗑️" });
      await persistEntries(next);
    } else {
      await handleClearAll();
    }
    setConfirmDialog(null);
  };

  const handleEditStart = (index: number) => {
    setEditIdx(index);
    setEditQty(String(entries[index].quantity));
  };

  const handleEditSave = async (index: number) => {
    const qty = parseFloat(editQty);
    if (!qty || qty <= 0) return;
    const food = foods.find((f) => f.id === entries[index].foodId);
    if (!food) return;
    const updated: FoodEntry = {
      ...entries[index],
      quantity: qty,
      totalCalories: calculateCalories(food.caloriesPerUnit, qty),
      protein: food.protein !== undefined ? Math.round(food.protein * qty * 10) / 10 : undefined,
      carbs:   food.carbs   !== undefined ? Math.round(food.carbs   * qty * 10) / 10 : undefined,
      fat:     food.fat     !== undefined ? Math.round(food.fat     * qty * 10) / 10 : undefined,
    };
    const next = entries.map((e, i) => (i === index ? updated : e));
    setEntries(next);
    setEditIdx(null);
    toast.success(`${updated.foodName} updated.`);
    await persistEntries(next);
  };

  /* ── Confirmation Modal ── */
  const ConfirmModal = confirmDialog ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); handleConfirmDelete(); }
        if (e.key === "Escape") setConfirmDialog(null);
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            {confirmDialog.type === "all" ? "Clear All Items" : "Remove Item"}
          </h2>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          {confirmDialog.type === "all"
            ? "This will permanently remove all food entries for today. This action cannot be undone."
            : `Remove "${entries[confirmDialog.index]?.foodName}" from today's log?`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmDialog(null)}
            className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 focus:ring-offset-slate-800"
          >
            Cancel
          </button>
          <button
            autoFocus
            onClick={handleConfirmDelete}
            className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {confirmDialog.type === "all" ? "Clear All" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="h-9 w-48 rounded-xl bg-slate-700 animate-pulse" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  const caloriePercent = Math.min((totalCalories / calorieGoal) * 100, 100);
  const remaining = calorieGoal - totalCalories;
  const isOverGoal = totalCalories > calorieGoal;
  const progressColor = isOverGoal ? "bg-red-500" : caloriePercent >= 85 ? "bg-yellow-400" : "bg-green-500";

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      {ConfirmModal}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
            <Utensils className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h1 className="select-none text-xl font-bold text-slate-100">Log Diet</h1>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {syncing && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
          {!syncing && savedAt && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* ── Calorie progress strip ── */}
      <div className="flex items-center gap-4 rounded-xl bg-slate-800/60 px-4 py-3 ring-1 ring-slate-700/50">
        <div className="shrink-0 text-right">
          <span className="text-lg font-bold text-slate-100">{totalCalories}</span>
          <span className="ml-1 text-xs text-slate-500">kcal</span>
        </div>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-600">
            <span>0</span>
            <span>Goal: {calorieGoal} kcal</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {isOverGoal ? (
            <span className="text-sm font-semibold text-red-400">+{Math.abs(remaining)} over</span>
          ) : (
            <span className="text-sm font-semibold text-green-400">{remaining} left</span>
          )}
        </div>
      </div>

      {/* ── Quick Add strip ── */}
      {foods.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-4 py-2.5 ring-1 ring-slate-700/50">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Quick Add</span>
          <div className="flex flex-wrap gap-1.5">
            {foods.slice(0, 12).map((food) => (
              <button
                key={food.id}
                onClick={() => handleQuickAdd(food)}
                className="rounded-full border border-slate-600 bg-slate-700/70 px-3 py-1 text-xs text-slate-300 transition hover:border-green-500/60 hover:bg-green-500/10 hover:text-green-300"
              >
                {food.name} <span className="text-slate-500">+{food.caloriesPerUnit}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">

        {/* LEFT — Add food form */}
        <div className="rounded-xl bg-slate-800 p-5 shadow ring-1 ring-slate-700/50 self-start">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/15">
              <Plus className="h-3.5 w-3.5 text-green-400" />
            </span>
            Add a Food Item
          </h2>

          {foods.length === 0 ? (
            <div className="rounded-lg bg-slate-700/50 px-4 py-4 text-sm text-slate-400">
              No foods in your database yet.{" "}
              <a href="/foods" className="text-green-400 underline hover:text-green-300">Add foods here</a> first.
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search foods…"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedFoodId(""); }}
                  className="w-full rounded-lg bg-slate-700/80 pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                />
              </div>

              {/* Select food */}
              <div>
                <label className="mb-1 block text-xs text-slate-500">Food</label>
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                >
                  <option value="">Select a food…</option>
                  {filteredFoods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} — {food.caloriesPerUnit} kcal / {food.unit || "unit"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-xs text-slate-500">Quantity</label>
                <input
                  type="number"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.1"
                  step="0.5"
                  className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                />
              </div>

              {/* Preview */}
              {selectedFood && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs text-slate-300">
                      <strong className="text-green-400">{previewCalories} kcal</strong>
                    </span>
                  </div>
                  {selectedFood.protein !== undefined && (
                    <div className="flex gap-1 text-[11px]">
                      <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-blue-400">Protein: {(selectedFood.protein * (parseFloat(quantity) || 0)).toFixed(1)}g</span>
                      <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-yellow-400">Carbs: {((selectedFood.carbs ?? 0) * (parseFloat(quantity) || 0)).toFixed(1)}g</span>
                      <span className="rounded-full bg-pink-500/10 px-1.5 py-0.5 text-pink-400">Fat: {((selectedFood.fat ?? 0) * (parseFloat(quantity) || 0)).toFixed(1)}g</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFood || !quantity || parseFloat(quantity) <= 0}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add to Log
              </button>
            </form>
          )}
        </div>

        {/* RIGHT — Today's meals */}
        <div className="flex flex-col gap-3">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Today&apos;s Meals{" "}
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-slate-300">
                {entries.length}
              </span>
            </span>
            {entries.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 ring-1 ring-green-500/20">
                  <Flame className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-bold text-green-400">{totalCalories} kcal</span>
                </div>
                <button
                  onClick={() => setConfirmDialog({ type: "all" })}
                  className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Meal list */}
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-800/40 py-14 text-center ring-1 ring-slate-700/40">
              <Utensils className="mb-2 h-8 w-8 text-slate-700" />
              <p className="text-sm text-slate-500">No foods logged today yet.</p>
              <p className="mt-0.5 text-xs text-slate-600">Add a food from the form on the left</p>
            </div>
          ) : (
            <>
              <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                {entries.map((entry, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between rounded-lg bg-slate-800 p-3 ring-1 ring-slate-700/50 transition hover:ring-slate-600/70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-100 truncate">{entry.foodName}</p>
                      {editIdx === i ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="w-16 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-green-500"
                            min="0.1" step="0.5" autoFocus
                          />
                          <button onClick={() => handleEditSave(i)} className="rounded p-1 text-green-400 hover:bg-green-500/10">
                            <Check className="h-3 w-3" />
                          </button>
                          <button onClick={() => setEditIdx(null)} className="rounded p-1 text-slate-500 hover:bg-slate-700">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-slate-400">
                            {entry.quantity} × {(entry.totalCalories / entry.quantity).toFixed(0)} kcal
                          </span>
                          {entry.protein !== undefined && (
                            <div className="flex gap-1 text-[11px]">
                              <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-blue-400">Protein: {entry.protein}g</span>
                              <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-yellow-400">Carbs: {entry.carbs ?? 0}g</span>
                              <span className="rounded-full bg-pink-500/10 px-1.5 py-0.5 text-pink-400">Fat: {entry.fat ?? 0}g</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      <span className="min-w-[52px] text-right text-xs font-semibold text-green-400">
                        {entry.totalCalories} kcal
                      </span>
                      {editIdx !== i && (
                        <button
                          onClick={() => handleEditStart(i)}
                          className="rounded-lg p-1.5 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-400"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDialog({ type: "single", index: i })}
                        className="rounded-lg p-1.5 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Macro summary */}
              {hasMacros && (
                <div className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
                    Macro Totals
                  </div>
                  <MacroSummary protein={totalProtein} carbs={totalCarbs} fat={totalFat} />
                </div>
              )}

              {/* Sync status strip */}
              <div className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold ring-1 transition ${
                syncing
                  ? "bg-slate-700/50 text-slate-400 ring-slate-700"
                  : savedAt
                  ? "bg-green-500/10 text-green-400 ring-green-500/20"
                  : "bg-slate-700/40 text-slate-500 ring-slate-700/50"
              }`}>
                {syncing
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving to database…</>
                  : savedAt
                  ? <><CheckCircle className="h-3.5 w-3.5" /> All changes saved</>
                  : <><AlertCircle className="h-3.5 w-3.5" /> Not yet saved</>}
              </div>
            </>
          )}
        </div>

      </div>
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
