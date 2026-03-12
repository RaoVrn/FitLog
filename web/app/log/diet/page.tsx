"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Utensils, UtensilsCrossed, Plus, Trash2, Loader2, CheckCircle,
  Pencil, Check, X, Search, ChevronDown, SlidersHorizontal, Star,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getFoods } from "@/services/foodService";
import { getTodayLog, saveLog, todayDateStr } from "@/services/logService";
import { getUserProfile, saveUserProfile } from "@/services/userService";
import { calculateCalories } from "@/utils/calorieCalculator";
import { Food, FoodEntry, Exercise, MealType } from "@/types";
import MealSection from "@/components/MealSection";

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
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [foodDropdownOpen, setFoodDropdownOpen] = useState(false);
  const foodDropdownRef = useRef<HTMLDivElement>(null);
  const [mealSearch, setMealSearch] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ type: "single"; index: number } | { type: "all" } | { type: "meal"; mealType: MealType } | null>(null);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [carbsGoal, setCarbsGoal] = useState(200);
  const [fatGoal, setFatGoal] = useState(67);
  const [editingMacros, setEditingMacros] = useState(false);
  const [macroInputs, setMacroInputs] = useState({ calorie: "2000", protein: "150", carbs: "200", fat: "67" });
  const [savingMacros, setSavingMacros] = useState(false);
  // cache existing exercises so we never overwrite them on diet saves
  const exercisesRef = useRef<Exercise[]>([]);

  // Close food dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (foodDropdownRef.current && !foodDropdownRef.current.contains(e.target as Node)) {
        setFoodDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        const cg = profile?.calorieGoal ?? 2000;
        setProteinGoal(profile?.proteinGoal ?? Math.round(cg * 0.30 / 4));
        setCarbsGoal(profile?.carbsGoal ?? Math.round(cg * 0.40 / 4));
        setFatGoal(profile?.fatGoal ?? Math.round(cg * 0.30 / 9));
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

  const favoriteFoods = useMemo(
    () => foods.filter((f) => f.favorite),
    [foods]
  );

  const filteredQuickAddFoods = useMemo(() => {
    if (!quickAddSearch.trim()) return foods;
    return foods.filter((f) =>
      f.name.toLowerCase().includes(quickAddSearch.toLowerCase())
    );
  }, [foods, quickAddSearch]);

  const filteredFavoriteQuickAddFoods = useMemo(() => {
    if (!quickAddSearch.trim()) return favoriteFoods;
    return favoriteFoods.filter((f) =>
      f.name.toLowerCase().includes(quickAddSearch.toLowerCase())
    );
  }, [favoriteFoods, quickAddSearch]);

  const selectedFood = foods.find((f) => f.id === selectedFoodId);
  const previewCalories = selectedFood
    ? calculateCalories(selectedFood.caloriesPerUnit, parseFloat(quantity) || 0)
    : 0;

  const totalCalories = entries.reduce((s, e) => s + e.totalCalories, 0);
  const totalProtein  = entries.reduce((s, e) => s + (e.protein || 0), 0);
  const totalCarbs    = entries.reduce((s, e) => s + (e.carbs || 0), 0);
  const totalFat      = entries.reduce((s, e) => s + (e.fat || 0), 0);


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

  const handleSaveGoals = async () => {
    const cal = parseInt(macroInputs.calorie);
    const p   = parseInt(macroInputs.protein);
    const c   = parseInt(macroInputs.carbs);
    const f   = parseInt(macroInputs.fat);
    if (!cal || cal <= 0 || !p || p <= 0 || !c || c <= 0 || !f || f <= 0 || !user) return;
    setSavingMacros(true);
    try {
      await saveUserProfile(user.uid, { calorieGoal: cal, proteinGoal: p, carbsGoal: c, fatGoal: f });
      setCalorieGoal(cal);
      setProteinGoal(p);
      setCarbsGoal(c);
      setFatGoal(f);
      setEditingMacros(false);
      toast.success("Goals updated.");
    } catch {
      toast.error("Failed to save goals.");
    } finally {
      setSavingMacros(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedFood || !quantity || parseFloat(quantity) <= 0) return;
    const qty = parseFloat(quantity);
    // Match on both foodId AND mealType so the same food can appear in multiple meals
    const existingIdx = entries.findIndex(
      (e) => e.foodId === selectedFood.id! && (e.mealType ?? "breakfast") === selectedMealType
    );
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
        mealType: selectedMealType,
      };
      next = [...entries, entry];
      toast.success(`${selectedFood.name} added to ${selectedMealType}.`);
    }
    setEntries(next);
    setSelectedFoodId("");
    setQuantity("1");
    await persistEntries(next);
  };

  const handleQuickAdd = async (food: Food) => {
    const existingIdx = entries.findIndex(
      (e) => e.foodId === food.id! && (e.mealType ?? "breakfast") === selectedMealType
    );
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
        mealType: selectedMealType,
      };
      next = [...entries, entry];
      toast.success(`${food.name} added to ${selectedMealType}.`);
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
    } else if (confirmDialog.type === "meal") {
      const mt = confirmDialog.mealType;
      const next = entries.filter((e) => (e.mealType ?? "breakfast") !== mt);
      setEntries(next);
      toast(`${mt.charAt(0).toUpperCase() + mt.slice(1)} cleared.`, { icon: "🗑️" });
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
      onKeyDown={(e) => { if (e.key === "Escape") setConfirmDialog(null); }}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); handleConfirmDelete(); }}
        className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700 shadow-2xl"
      >
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            {confirmDialog.type === "all" ? "Clear All Items" : confirmDialog.type === "meal" ? `Clear ${confirmDialog.mealType.charAt(0).toUpperCase() + confirmDialog.mealType.slice(1)}` : "Remove Item"}
          </h2>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          {confirmDialog.type === "all"
            ? "This will permanently remove all food entries for today. This action cannot be undone."
            : confirmDialog.type === "meal"
            ? `Remove all items logged under ${confirmDialog.mealType}? This cannot be undone.`
            : `Remove "${entries[confirmDialog.index]?.foodName}" from today's log?`}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmDialog(null)}
            className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 focus:ring-offset-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            autoFocus
            className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            {confirmDialog.type === "all" ? "Clear All" : confirmDialog.type === "meal" ? "Clear" : "Remove"}
          </button>
        </div>
      </form>
    </div>
  ) : null;

  const MacroModal = editingMacros ? (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) setEditingMacros(false); }}
      onKeyDown={(e) => { if (e.key === "Escape") setEditingMacros(false); }}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); handleSaveGoals(); }}
        className="w-full max-w-md rounded-t-3xl bg-slate-900 p-6 pb-8 shadow-2xl ring-1 ring-slate-700/60 sm:rounded-2xl sm:pb-6"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Daily Goals</h2>
            <p className="mt-0.5 text-sm text-slate-500">Adjust your calorie &amp; macro targets</p>
          </div>
          <button type="button" onClick={() => setEditingMacros(false)}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Calorie goal */}
        <div className="mb-5">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Calorie Target</label>
          <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700/60">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <span className="text-sm">🔥</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500">Per day</p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={macroInputs.calorie}
                onChange={(e) => setMacroInputs((prev) => ({ ...prev, calorie: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveGoals(); } }}
                className="w-20 rounded-lg bg-slate-700/80 px-2 py-1.5 text-center text-sm font-semibold text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-green-500/60"
                min="500"
                step="50"
              />
              <span className="text-sm font-medium text-slate-400">kcal</span>
            </div>
          </div>
        </div>

        {/* Macro goals */}
        <div className="mb-5">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-slate-500">Macro Targets</label>
          <div className="divide-y divide-slate-800 rounded-xl bg-slate-800 ring-1 ring-slate-700/60 overflow-hidden">
            {([
              { key: "protein" as const, label: "Protein", icon: "🥩", color: "text-blue-400",  ringFocus: "focus:ring-blue-500/60",  kcalPer: 4 },
              { key: "carbs"   as const, label: "Carbs",   icon: "🍚", color: "text-amber-400", ringFocus: "focus:ring-amber-500/60", kcalPer: 4 },
              { key: "fat"     as const, label: "Fat",     icon: "🥑", color: "text-pink-400",  ringFocus: "focus:ring-pink-500/60",  kcalPer: 9 },
            ]).map(({ key, label, icon, color, ringFocus, kcalPer }) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3">
                <span className="text-base">{icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${color}`}>{label}</p>
                  <p className="text-xs text-slate-600">{kcalPer} kcal per gram</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={macroInputs[key]}
                    onChange={(e) => setMacroInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveGoals(); } }}
                    className={`w-16 rounded-lg bg-slate-700/80 px-2 py-1.5 text-center text-sm font-semibold text-slate-100 outline-none ring-1 ring-slate-600 ${ringFocus}`}
                    min="1"
                    step="1"
                  />
                  <span className="w-3 text-sm font-medium text-slate-400">g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total from macros */}
        <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-800/60 px-4 py-2.5 ring-1 ring-slate-700/40">
          <span className="text-xs text-slate-500">Total from macros</span>
          <span className="text-sm font-semibold text-slate-200">
            {(parseInt(macroInputs.protein || "0") * 4) + (parseInt(macroInputs.carbs || "0") * 4) + (parseInt(macroInputs.fat || "0") * 9)}{" "}
            <span className="text-xs font-normal text-slate-500">kcal</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditingMacros(false)}
            className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-slate-700/60 transition hover:bg-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={savingMacros}
            className="flex-1 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-green-400 disabled:opacity-50">
            {savingMacros ? "Saving…" : "Save Goals"}
          </button>
        </div>
      </form>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="h-8 w-40 rounded-lg bg-slate-700 animate-pulse" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  const caloriePercent = Math.min((totalCalories / calorieGoal) * 100, 100);
  const remaining = calorieGoal - totalCalories;
  const isOverGoal = totalCalories > calorieGoal;
  const progressColor = isOverGoal ? "bg-red-500" : caloriePercent >= 85 ? "bg-yellow-400" : "bg-green-500";
  const statusText = isOverGoal ? "Over goal" : caloriePercent >= 100 ? "Goal reached!" : caloriePercent >= 75 ? "Almost there!" : caloriePercent >= 40 ? "Good progress" : caloriePercent > 0 ? "Great start!" : "Start logging";
  const statusColor = isOverGoal ? "text-red-400" : caloriePercent >= 100 ? "text-green-400" : caloriePercent >= 75 ? "text-yellow-400" : caloriePercent > 0 ? "text-green-400" : "text-slate-600";

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {ConfirmModal}
      {MacroModal}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
            <UtensilsCrossed className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h1 className="select-none text-2xl font-bold text-slate-100">Log Diet</h1>
            <p className="select-none text-xs text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {syncing && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
          {!syncing && savedAt && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <CheckCircle className="h-3 w-3 text-green-500" /> Saved
            </span>
          )}
          <button
            onClick={() => { setMacroInputs({ calorie: String(calorieGoal), protein: String(proteinGoal), carbs: String(carbsGoal), fat: String(fatGoal) }); setEditingMacros(true); }}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-700/50 transition hover:bg-slate-700 hover:text-slate-100 hover:ring-slate-600"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-green-400" />
            Edit Goals
          </button>
        </div>
      </div>

      {/* ── Stats bar — calories + macros unified ── */}
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700/50 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-700/50 sm:grid-cols-[1fr_2fr_1fr_auto]">
          <div className="flex flex-col items-center justify-center px-4 py-3">
            <span className="text-lg font-bold tabular-nums text-slate-100">{totalCalories}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">consumed</span>
          </div>
          <div className="flex flex-col justify-center gap-1.5 px-4 py-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div className={`h-1.5 rounded-full transition-all duration-700 ${progressColor}`} style={{ width: `${caloriePercent}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{Math.round(caloriePercent)}%</span>
              <span className={`font-medium ${statusColor}`}>{statusText}</span>
              <span className="text-slate-500">Goal {calorieGoal} kcal</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center px-4 py-3">
            <span className={`text-lg font-bold tabular-nums ${isOverGoal ? "text-red-400" : "text-green-400"}`}>
              {isOverGoal ? `+${Math.abs(remaining)}` : remaining}
            </span>
            <span className={`text-[10px] uppercase tracking-wider ${isOverGoal ? "text-red-500/60" : "text-slate-500"}`}>
              {isOverGoal ? "over goal" : "remaining"}
            </span>
          </div>
          <div className="col-span-3 flex items-center justify-around border-t border-slate-700/50 px-5 py-3 sm:col-span-1 sm:justify-center sm:gap-5 sm:border-l sm:border-t-0">
            {([
              { label: "Protein", value: totalProtein, target: proteinGoal, barColor: "bg-blue-400",  textColor: "text-blue-400"  },
              { label: "Carbs",   value: totalCarbs,   target: carbsGoal,   barColor: "bg-amber-400", textColor: "text-amber-400" },
              { label: "Fat",     value: totalFat,     target: fatGoal,     barColor: "bg-pink-400",  textColor: "text-pink-400"  },
            ] as const).map(({ label, value, target, barColor, textColor }) => (
              <div key={label} className="min-w-[52px] text-center">
                <p className={`text-sm font-bold tabular-nums ${textColor}`}>
                  {value.toFixed(0)}
                  <span className="text-[10px] font-normal text-slate-600">/{target}g</span>
                </p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-1 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">

        {/* LEFT — Add Food */}
        <div className="space-y-4 self-start rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Add Food</p>

          {foods.length === 0 ? (
            <div className="rounded-lg bg-slate-700/40 px-4 py-5 text-center">
              <p className="text-sm text-slate-400">No foods in your database yet.</p>
              <a href="/foods" className="mt-1 inline-block text-xs text-green-400 hover:text-green-300">Go to Foods →</a>
            </div>
          ) : (
            <>
              {/* Quick Add chips */}
              <div>
                <div className="mb-2 rounded-xl bg-slate-700/25 p-2.5 ring-1 ring-slate-700/50">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/90">Favorite Foods</p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/20">
                      {favoriteFoods.length}
                    </span>
                  </div>

                  {favoriteFoods.length === 0 ? (
                    <p className="px-1 text-xs text-slate-500">No favorites yet. Mark foods with a star in Foods.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {filteredFavoriteQuickAddFoods.slice(0, quickAddOpen ? undefined : 6).map((food) => (
                        <button
                          key={`fav-${food.id}`}
                          type="button"
                          onClick={() => handleQuickAdd(food)}
                          className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200 transition hover:border-amber-400/40 hover:bg-amber-500/20 hover:text-amber-100"
                        >
                          {food.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-600">All foods</p>
                  <button type="button" onClick={() => setQuickAddOpen((o) => !o)}
                    className="text-[11px] text-slate-600 transition hover:text-slate-400">
                    {quickAddOpen ? "less" : `all ${foods.length}`}
                  </button>
                </div>
                {quickAddOpen && (
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Search…" value={quickAddSearch}
                      onChange={(e) => setQuickAddSearch(e.target.value)}
                      className="w-full rounded-lg bg-slate-700/50 py-1.5 pl-7 pr-3 text-xs text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-700/50 focus:ring-green-500/40" />
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {(quickAddOpen
                    ? filteredQuickAddFoods
                    : foods.slice(0, 5)
                  ).map(food => (
                    <button key={food.id} type="button" onClick={() => handleQuickAdd(food)}
                      className="rounded-full border border-slate-700/60 bg-slate-700/40 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-green-500/30 hover:text-green-300">
                      {food.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-700/50" />

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-3">
                {/* Food picker */}
                <div ref={foodDropdownRef} className="relative">
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-600">Food</label>
                  <button type="button" onClick={() => setFoodDropdownOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-lg bg-slate-700/50 px-3 py-2 text-sm outline-none ring-1 ring-slate-700/60 transition hover:ring-slate-600">
                    <span className={selectedFood ? "text-slate-100" : "text-slate-500"}>
                      {selectedFood ? `${selectedFood.name} · ${selectedFood.caloriesPerUnit} kcal` : "Select a food…"}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-150 ${foodDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {foodDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl bg-slate-900 shadow-2xl ring-1 ring-slate-700/60">
                      <div className="border-b border-slate-700/60 p-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                          <input type="text" placeholder="Search foods…" value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                            className="w-full rounded-lg bg-slate-800 py-2 pl-8 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-green-500/50" />
                        </div>
                      </div>
                      <ul className="max-h-48 overflow-y-auto py-1 [scrollbar-width:thin]">
                        {filteredFoods.length === 0 ? (
                          <li className="px-4 py-3 text-sm text-slate-500">No results.</li>
                        ) : filteredFoods.map(food => (
                          <li key={food.id}
                            onClick={() => { setSelectedFoodId(food.id ?? ""); setFoodDropdownOpen(false); setSearchQuery(""); }}
                            className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm transition-colors ${
                              selectedFoodId === food.id ? "bg-green-500/10 text-green-300" : "text-slate-200 hover:bg-slate-800"
                            }`}>
                            <span>{food.name}</span>
                            <span className="text-[11px] text-slate-500">{food.caloriesPerUnit} kcal</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Qty + Meal on same row */}
                <div className="grid grid-cols-[72px_1fr] gap-3 items-start">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-600">Qty</label>
                    <input type="number" placeholder="1" value={quantity}
                      onChange={(e) => setQuantity(e.target.value)} min="0.1" step="any"
                      className="w-full rounded-lg bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-700/60 transition focus:ring-green-500/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-600">Meal</label>
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        { value: "breakfast" as MealType, label: "Breakfast" },
                        { value: "lunch"     as MealType, label: "Lunch"     },
                        { value: "dinner"    as MealType, label: "Dinner"    },
                        { value: "snack"     as MealType, label: "Snacks"    },
                      ]).map(({ value, label }) => (
                        <button key={value} type="button" onClick={() => setSelectedMealType(value)}
                          className={`flex items-center justify-center rounded-lg py-1.5 text-[11px] font-medium transition ${
                            selectedMealType === value
                              ? "bg-green-500/15 text-green-300 ring-1 ring-green-500/30"
                              : "bg-slate-700/40 text-slate-500 hover:bg-slate-700/70 hover:text-slate-300"
                          }`}>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {selectedFood && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-700/30 px-3 py-2 ring-1 ring-slate-700/40">
                    <span className="text-xs font-semibold text-green-400">{previewCalories} kcal</span>
                    {selectedFood.protein !== undefined && (
                      <span className="text-xs text-slate-500">
                        · P {(selectedFood.protein * (parseFloat(quantity) || 0)).toFixed(1)}g
                        · C {((selectedFood.carbs ?? 0) * (parseFloat(quantity) || 0)).toFixed(1)}g
                        · F {((selectedFood.fat ?? 0) * (parseFloat(quantity) || 0)).toFixed(1)}g
                      </span>
                    )}
                  </div>
                )}

                <button type="submit"
                  disabled={!selectedFood || !quantity || parseFloat(quantity) <= 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40">
                  <Plus className="h-3.5 w-3.5" />
                  Add to Log
                </button>
              </form>
            </>
          )}
        </div>

        {/* RIGHT — Today's meals */}
        <div className="space-y-3">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">Today&apos;s Meals</span>
              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-500">{entries.length}</span>
            </div>
            {entries.length > 0 && (
              <button type="button" onClick={() => setConfirmDialog({ type: "all" })}
                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {entries.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
              <input type="text" placeholder="Search meals…" value={mealSearch}
                onChange={(e) => setMealSearch(e.target.value)}
                className="w-full rounded-xl bg-slate-800 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-700/50 transition focus:ring-slate-600" />
            </div>
          )}

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-800/40 py-16 text-center ring-1 ring-slate-700/40">
              <Utensils className="mb-3 h-8 w-8 text-slate-700" />
              <p className="text-sm font-medium text-slate-500">Nothing logged yet</p>
              <p className="mt-0.5 text-xs text-slate-600">Add a food from the form</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((meal) => {
                const mealEntries = entries.filter((e) => {
                  const mt = e.mealType ?? "breakfast";
                  const nameMatch = !mealSearch || e.foodName.toLowerCase().includes(mealSearch.toLowerCase());
                  return mt === meal && nameMatch;
                });
                const globalIndices: number[] = [];
                entries.forEach((e, gi) => {
                  const mt = e.mealType ?? "breakfast";
                  const nameMatch = !mealSearch || e.foodName.toLowerCase().includes(mealSearch.toLowerCase());
                  if (mt === meal && nameMatch) globalIndices.push(gi);
                });
                if (mealEntries.length === 0) return null;
                return (
                  <MealSection
                    key={meal}
                    mealType={meal}
                    foods={mealEntries}
                    allFoods={foods}
                    getGlobalIndex={(localIdx) => globalIndices[localIdx]}
                    editIdx={editIdx}
                    editQty={editQty}
                    onEditStart={handleEditStart}
                    onEditQtyChange={setEditQty}
                    onEditSave={handleEditSave}
                    onEditCancel={() => setEditIdx(null)}
                    onDeleteRequest={(gi) => setConfirmDialog({ type: "single", index: gi })}
                    onClearMeal={() => setConfirmDialog({ type: "meal", mealType: meal })}
                  />
                );
              })}
            </div>
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
