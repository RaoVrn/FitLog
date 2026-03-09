"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Utensils, Plus, Trash2, Flame, Loader2, CheckCircle,
  Pencil, Check, X, Zap, Search, ChevronDown,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getFoods } from "@/services/foodService";
import { getTodayLog, saveLog, todayDateStr } from "@/services/logService";
import { getUserProfile, saveUserProfile } from "@/services/userService";
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
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [foodDropdownOpen, setFoodDropdownOpen] = useState(false);
  const foodDropdownRef = useRef<HTMLDivElement>(null);
  const [mealSearch, setMealSearch] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [mealsOpen, setMealsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ type: "single"; index: number } | { type: "all" } | null>(null);
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

  const handleSaveGoal = async () => {
    const val = parseInt(goalInput);
    if (!val || val <= 0 || !user) return;
    setSavingGoal(true);
    try {
      await saveUserProfile(user.uid, { calorieGoal: val });
      setCalorieGoal(val);
      setEditingGoal(false);
      toast.success("Calorie goal updated.");
    } catch {
      toast.error("Failed to save goal.");
    } finally {
      setSavingGoal(false);
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
            {confirmDialog.type === "all" ? "Clear All" : "Remove"}
          </button>
        </div>
      </form>
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
      <div className="flex items-center gap-4 rounded-xl bg-slate-800/60 px-4 py-3 ring-1 ring-slate-600">
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

        {/* Remaining */}
        <div className="shrink-0 text-right">
          {isOverGoal ? (
            <span className="text-sm font-semibold text-red-400">+{Math.abs(remaining)} over</span>
          ) : (
            <span className="text-sm font-semibold text-green-400">{remaining} left</span>
          )}
        </div>

        {/* Calorie Goal card */}
        <div className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 ring-1 ring-slate-600 text-right">
          <div className="flex items-center gap-1.5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Calorie Goal</div>
              {editingGoal ? (
                <div className="mt-0.5 flex items-center gap-1">
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveGoal(); if (e.key === "Escape") setEditingGoal(false); }}
                    className="w-16 rounded bg-slate-700 px-1.5 py-0.5 text-sm font-bold text-green-400 outline-none ring-1 ring-green-500"
                    autoFocus
                  />
                  <button type="button" onClick={handleSaveGoal} disabled={savingGoal} className="rounded p-0.5 text-green-400 hover:bg-green-500/10">
                    {savingGoal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </button>
                  <button type="button" onClick={() => setEditingGoal(false)} className="rounded p-0.5 text-slate-500 hover:bg-slate-700">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-base font-bold text-green-400">{calorieGoal}</span>
                  <span className="text-[10px] text-slate-500">kcal</span>
                  <button
                    type="button"
                    onClick={() => { setGoalInput(String(calorieGoal)); setEditingGoal(true); }}
                    className="rounded p-0.5 text-slate-600 transition hover:text-slate-400"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Add (collapsible) ── */}
      {foods.length > 0 && (
        <div className="rounded-xl bg-slate-800/60 ring-1 ring-slate-600 overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setQuickAddOpen((o) => !o)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setQuickAddOpen((o) => !o); }}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition hover:bg-slate-700/40"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Quick Add</span>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{foods.length} foods</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${quickAddOpen ? "rotate-180" : ""}`} />
          </div>
          {quickAddOpen && (
            <div className="border-t border-slate-700/50 px-4 pb-3 pt-2.5 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search foods…"
                  value={quickAddSearch}
                  onChange={(e) => setQuickAddSearch(e.target.value)}
                  className="w-full rounded-lg bg-slate-700/60 py-1.5 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {foods
                  .filter((f) => !quickAddSearch || f.name.toLowerCase().includes(quickAddSearch.toLowerCase()))
                  .map((food) => (
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
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">

        {/* LEFT — Add food form (collapsible) */}
        <div className="rounded-xl bg-slate-800 ring-1 ring-slate-600 self-start">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setAddFormOpen((o) => !o)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAddFormOpen((o) => !o); }}
            className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 transition hover:bg-slate-700/40 rounded-t-xl"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/15">
                <Plus className="h-3.5 w-3.5 text-green-400" />
              </span>
              Add a Food Item
            </h2>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${addFormOpen ? "rotate-180" : ""}`} />
          </div>

          {addFormOpen && (
            <div className="border-t border-slate-700/50 p-5">
              {foods.length === 0 ? (
                <div className="rounded-lg bg-slate-700/50 px-4 py-4 text-sm text-slate-400">
                  No foods in your database yet.{" "}
                  <a href="/foods" className="text-green-400 underline hover:text-green-300">Add foods here</a> first.
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-3">
                  {/* Food picker with inline search */}
                  <div ref={foodDropdownRef} className="relative">
                    <label className="mb-1 block text-xs text-slate-500">Food</label>
                    <button
                      type="button"
                      onClick={() => setFoodDropdownOpen((o) => !o)}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition hover:ring-slate-500 focus:ring-green-500"
                    >
                      <span className={selectedFood ? "text-slate-100" : "text-slate-500"}>
                        {selectedFood ? `${selectedFood.name} — ${selectedFood.caloriesPerUnit} kcal / ${selectedFood.unit || "unit"}` : "Select a food…"}
                      </span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-150 ${foodDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {foodDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl bg-slate-900 ring-1 ring-slate-600 shadow-2xl">
                        {/* Search inside dropdown */}
                        <div className="p-2.5 border-b border-slate-700/80">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search foods…"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              autoFocus
                              className="w-full rounded-lg bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        {/* Options list */}
                        <ul className="max-h-56 overflow-y-auto py-1 [scrollbar-color:theme(colors.slate.600)_transparent] [scrollbar-width:thin]">
                          {filteredFoods.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-slate-500">No foods match your search.</li>
                          ) : (
                            filteredFoods.map((food) => (
                              <li
                                key={food.id}
                                onClick={() => { setSelectedFoodId(food.id ?? ""); setFoodDropdownOpen(false); setSearchQuery(""); }}
                                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  selectedFoodId === food.id
                                    ? "bg-green-500/15 text-green-300"
                                    : "text-slate-200 hover:bg-slate-800"
                                }`}
                              >
                                <span className="font-medium">{food.name}</span>
                                <span className="shrink-0 rounded-full bg-slate-700/80 px-2 py-0.5 text-[11px] text-slate-400">
                                  {food.caloriesPerUnit} kcal / {food.unit || "unit"}
                                </span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
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
                      step="any"
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
          )}
        </div>

        {/* RIGHT — Today's meals (collapsible) */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl bg-slate-800/60 ring-1 ring-slate-600">
            {/* Toggle header */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setMealsOpen((o) => !o)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setMealsOpen((o) => !o); }}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition hover:bg-slate-700/40"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Today&apos;s Meals</span>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{entries.length}</span>
                {totalCalories > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 ring-1 ring-green-500/20">
                    <Flame className="h-3 w-3 text-green-400" />
                    <span className="text-xs font-bold text-green-400">{totalCalories} kcal</span>
                  </div>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${mealsOpen ? "rotate-180" : ""}`} />
            </div>

            {mealsOpen && (
              <div className="border-t border-slate-700/50 px-3 pb-3 pt-2.5">
                {/* Search + Clear All */}
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search meals..."
                      value={mealSearch}
                      onChange={(e) => setMealSearch(e.target.value)}
                      className="w-full rounded-lg bg-slate-700/60 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                    />
                  </div>
                  {entries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmDialog({ type: "all" })}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  )}
                </div>

                {/* Meal list */}
                {entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-800/40 py-10 text-center ring-1 ring-slate-700/40">
                    <Utensils className="mb-2 h-8 w-8 text-slate-700" />
                    <p className="text-sm text-slate-500">No foods logged today yet.</p>
                    <p className="mt-0.5 text-xs text-slate-600">Add a food from the form on the left</p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto space-y-1.5 px-0.5 pb-0.5 [scrollbar-color:theme(colors.slate.600)_transparent] [scrollbar-width:thin]">
                    {entries
                      .filter((e) => !mealSearch || e.foodName.toLowerCase().includes(mealSearch.toLowerCase()))
                      .map((entry, i) => (
                      <div
                        key={i}
                        className="group flex items-center justify-between rounded-lg bg-slate-800 p-3 border-2 border-slate-700/60 transition hover:border-slate-600"
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
                                min="0.1" step="any" autoFocus
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
                )}

              </div>
            )}
          </div>

          {/* Macro summary — outside Today's Meals */}
          {hasMacros && (
            <div className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-600">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Zap className="h-3.5 w-3.5 text-indigo-400" />
                Macro Totals
              </div>
              <MacroSummary protein={totalProtein} carbs={totalCarbs} fat={totalFat} />
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
