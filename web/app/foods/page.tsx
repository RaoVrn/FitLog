"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Food } from "@/types";
import FoodItem from "@/components/FoodItem";
import FavoriteFoodsSection from "@/components/FavoriteFoodsSection";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getFoods, addFood, deleteFood, deleteAllFoods, foodExists, updateFood, toggleFavorite } from "@/services/foodService";
import { Plus, Search, Loader2, Pencil, X, Check, Flame, Trash2, Database, ChevronDown } from "lucide-react";
import { SkeletonList } from "@/components/Skeleton";
import toast from "react-hot-toast";

const QUICK_ADD_FOODS: Omit<Food, "id">[] = [
  { name: "Egg",        caloriesPerUnit: 78,  unit: "piece", protein: 6,  carbs: 1,  fat: 5  },
  { name: "Banana",     caloriesPerUnit: 89,  unit: "piece", protein: 1,  carbs: 23, fat: 0  },
  { name: "Chapati",    caloriesPerUnit: 104, unit: "piece", protein: 3,  carbs: 18, fat: 3  },
  { name: "Rice (1 cup)", caloriesPerUnit: 206, unit: "cup",protein: 4,  carbs: 45, fat: 0  },
  { name: "Milk (1 cup)", caloriesPerUnit: 149, unit: "cup",protein: 8,  carbs: 12, fat: 8  },
  { name: "Apple",      caloriesPerUnit: 95,  unit: "piece", protein: 0,  carbs: 25, fat: 0  },
  { name: "Chicken Breast (100g)", caloriesPerUnit: 165, unit: "100g", protein: 31, carbs: 0, fat: 4 },
  { name: "Oats (100g)",           caloriesPerUnit: 389, unit: "100g", protein: 17, carbs: 66, fat: 7 },
];

interface EditState {
  id: string;
  name: string;
  calories: string;
  unit: string;
  protein: string;
  carbs: string;
  fat: string;
}

function FoodsContent() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [unit, setUnit] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(true);
  const [foodsOpen, setFoodsOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchFoods = async () => {
      setLoading(true);
      try {
        const data = await getFoods(user.uid);
        setFoods(data);
      } catch (e) {
        console.error("Failed to load foods:", e);
        toast.error("Failed to load your food database.");
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !calories) return;
    setSaving(true);
    try {
      const duplicate = await foodExists(user.uid, name.trim());
      if (duplicate) {
        toast.error(`"${name.trim()}" already exists in your database.`);
        setSaving(false);
        return;
      }
      const newFood: Omit<Food, "id"> = {
        name: name.trim(),
        caloriesPerUnit: parseFloat(calories),
        unit: unit.trim() || "piece",
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        favorite: false,
      };
      const id = await addFood(user.uid, newFood);
      setFoods((prev) =>
        [...prev, { ...newFood, id }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName(""); setCalories(""); setUnit(""); setProtein(""); setCarbs(""); setFat("");
      toast.success(`${newFood.name} added to your food database!`);
    } catch (e) {
      console.error("Failed to add food:", e);
      toast.error("Failed to add food. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (template: Omit<Food, "id">) => {
    if (!user) return;
    try {
      const duplicate = await foodExists(user.uid, template.name);
      if (duplicate) {
        toast(`"${template.name}" already in your database.`, { icon: "ℹ️" });
        return;
      }
      const id = await addFood(user.uid, { ...template, favorite: false });
      setFoods((prev) =>
        [...prev, { ...template, id, favorite: false }].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`${template.name} added!`);
    } catch {
      toast.error("Failed to quick-add food.");
    }
  };

  const handleToggleFavorite = useCallback(async (foodId: string, nextValue: boolean) => {
    if (!user) return;

    // Optimistic update for immediate feedback.
    setFoods((prev) =>
      prev.map((f) => (f.id === foodId ? { ...f, favorite: nextValue } : f))
    );

    try {
      await toggleFavorite(user.uid, foodId, nextValue);
    } catch {
      setFoods((prev) =>
        prev.map((f) => (f.id === foodId ? { ...f, favorite: !nextValue } : f))
      );
      toast.error("Failed to update favorite.");
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    const food = foods.find((f) => f.id === id);
    try {
      await deleteFood(user.uid, id);
      setFoods((prev) => prev.filter((f) => f.id !== id));
      toast.success(food ? `${food.name} deleted.` : "Food deleted.");
    } catch {
      toast.error("Failed to delete food.");
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    try {
      await deleteAllFoods(user.uid);
      setFoods([]);
      setConfirmDeleteAll(false);
      toast.success("All foods deleted.");
    } catch {
      toast.error("Failed to delete all foods.");
    }
  };

  const handleEditStart = (food: Food) => {
    setEditState({
      id: food.id!,
      name: food.name,
      calories: String(food.caloriesPerUnit),
      unit: food.unit ?? "",
      protein: food.protein !== undefined ? String(food.protein) : "",
      carbs: food.carbs !== undefined ? String(food.carbs) : "",
      fat: food.fat !== undefined ? String(food.fat) : "",
    });
  };

  const handleEditSave = async () => {
    if (!user || !editState) return;
    try {
      const updates: Partial<Omit<Food, "id">> = {
        name: editState.name.trim(),
        caloriesPerUnit: parseFloat(editState.calories),
        unit: editState.unit.trim() || "piece",
        protein: editState.protein ? parseFloat(editState.protein) : undefined,
        carbs: editState.carbs ? parseFloat(editState.carbs) : undefined,
        fat: editState.fat ? parseFloat(editState.fat) : undefined,
      };
      await updateFood(user.uid, editState.id, updates);
      setFoods((prev) =>
        prev.map((f) => (f.id === editState.id ? { ...f, ...updates } : f))
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`${updates.name} updated.`);
      setEditState(null);
    } catch {
      toast.error("Failed to update food.");
    }
  };

  const filtered = useMemo(
    () => foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [foods, search]
  );

  const favorites = useMemo(
    () => filtered.filter((f) => Boolean(f.favorite)),
    [filtered]
  );

  const nonFavorites = useMemo(
    () => filtered.filter((f) => !f.favorite),
    [filtered]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
            <Database className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h1 className="select-none text-xl font-bold text-slate-100">Food Database</h1>
            <p className="text-xs text-slate-500">Manage your personal food library</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-700">
          {foods.length} {foods.length === 1 ? "food" : "foods"}
        </span>
      </div>

      {/* ── Quick Add (collapsible) ── */}
      <div className="overflow-hidden rounded-xl bg-slate-800/60 ring-1 ring-slate-600">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setQuickAddOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setQuickAddOpen((o) => !o); }}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition hover:bg-slate-700/40"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Quick Add</span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{QUICK_ADD_FOODS.length} presets</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${quickAddOpen ? "rotate-180" : ""}`} />
        </div>
        {quickAddOpen && (
          <div className="border-t border-slate-700/50 px-4 pb-3 pt-2.5 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search presets…"
                value={quickAddSearch}
                onChange={(e) => setQuickAddSearch(e.target.value)}
                className="w-full rounded-lg bg-slate-700/60 py-1.5 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ADD_FOODS
                .filter((f) => !quickAddSearch || f.name.toLowerCase().includes(quickAddSearch.toLowerCase()))
                .map((f) => (
                <button
                  key={f.name}
                  onClick={() => handleQuickAdd(f)}
                  className="rounded-full border border-slate-600 bg-slate-700/70 px-3 py-1 text-xs text-slate-300 transition hover:border-green-500/60 hover:bg-green-500/10 hover:text-green-300"
                >
                  {f.name} <span className="text-slate-500">{f.caloriesPerUnit} kcal</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main two-column layout ── */}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">

        {/* LEFT — Add / Edit form */}
        <div>
          {editState ? (
            /* ── Edit panel ── */
            <div className="rounded-xl bg-slate-800 p-5 shadow ring-1 ring-green-500/40">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/15">
                    <Pencil className="h-3.5 w-3.5 text-green-400" />
                  </span>
                  Edit Food
                </h2>
                <button onClick={() => setEditState(null)} className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-700 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); handleEditSave(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleEditSave(); } }}
                className="space-y-3"
              >
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Food name</label>
                  <input
                    type="text" value={editState.name}
                    onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                    className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Calories</label>
                    <input
                      type="number" value={editState.calories}
                      onChange={(e) => setEditState({ ...editState, calories: e.target.value })}
                      className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Unit</label>
                    <input
                      type="text" value={editState.unit}
                      onChange={(e) => setEditState({ ...editState, unit: e.target.value })}
                      className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-blue-400">Protein g</label>
                    <input type="number" value={editState.protein}
                      onChange={(e) => setEditState({ ...editState, protein: e.target.value })}
                      className="w-full rounded-lg bg-slate-700/80 px-2 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-yellow-400">Carbs g</label>
                    <input type="number" value={editState.carbs}
                      onChange={(e) => setEditState({ ...editState, carbs: e.target.value })}
                      className="w-full rounded-lg bg-slate-700/80 px-2 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-pink-400">Fat g</label>
                    <input type="number" value={editState.fat}
                      onChange={(e) => setEditState({ ...editState, fat: e.target.value })}
                      className="w-full rounded-lg bg-slate-700/80 px-2 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-pink-400" />
                  </div>
                </div>
                <button type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
                  <Check className="h-3.5 w-3.5" /> Save Changes
                </button>
              </form>
            </div>
          ) : (
            /* ── Add form (collapsible) ── */
            <div className="rounded-xl bg-slate-800 ring-1 ring-slate-600">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAddFormOpen((o) => !o)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAddFormOpen((o) => !o); }}
                className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 transition hover:bg-slate-700/40 rounded-xl"
              >
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/15">
                    <Plus className="h-3.5 w-3.5 text-green-400" />
                  </span>
                  Add New Food
                </h2>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${addFormOpen ? "rotate-180" : ""}`} />
              </div>
              {addFormOpen && (
              <div className="border-t border-slate-700/50 p-5">
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Food name *</label>
                  <input
                    type="text" placeholder="e.g. Brown Rice" value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Calories *</label>
                    <input
                      type="number" placeholder="0" value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                      min="0" step="0.1" required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Unit</label>
                    <input
                      type="text" placeholder="piece / cup / 100g" value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Macros <span className="text-slate-600">(optional)</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Protein g" value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="rounded-lg bg-slate-700/80 px-2 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-blue-400"
                      min="0" step="0.1" />
                    <input type="number" placeholder="Carbs g" value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      className="rounded-lg bg-slate-700/80 px-2 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-yellow-400"
                      min="0" step="0.1" />
                    <input type="number" placeholder="Fat g" value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      className="rounded-lg bg-slate-700/80 px-2 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-pink-400"
                      min="0" step="0.1" />
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-green-400 disabled:opacity-50">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {saving ? "Saving..." : "Add Food"}
                </button>
              </form>
              </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Foods collapsible */}
        <div className="flex flex-col gap-0">
          <div className="overflow-hidden rounded-xl bg-slate-800/60 ring-1 ring-slate-600">
            {/* Toggle header */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setFoodsOpen((o) => !o)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFoodsOpen((o) => !o); }}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition hover:bg-slate-700/40"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">My Foods</span>
                {!loading && (
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{filtered.length}</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${foodsOpen ? "rotate-180" : ""}`} />
            </div>

            {foodsOpen && (
              <div className="border-t border-slate-700/50 px-3 pb-3 pt-2.5">
                {/* Search + Delete All */}
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text" placeholder="Search foods..." value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg bg-slate-700/60 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                    />
                  </div>
                  {!loading && foods.length > 0 && (
                    <button
                      onClick={() => setConfirmDeleteAll(true)}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete All
                    </button>
                  )}
                </div>

                {/* Food list */}
                {loading ? (
                  <SkeletonList rows={6} />
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-800/40 py-10 text-center ring-1 ring-slate-700/40">
                    <Flame className="mb-2 h-8 w-8 text-slate-700" />
                    <p className="text-sm text-slate-500">
                      {foods.length === 0 ? "No foods yet. Add your first food." : "No foods match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="food-list-scroll">
                    <FavoriteFoodsSection
                      foods={favorites}
                      onDelete={handleDelete}
                      onEdit={handleEditStart}
                      onToggleFavorite={handleToggleFavorite}
                    />

                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        All Foods
                      </span>
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                        {nonFavorites.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {nonFavorites.map((food) => (
                        <FoodItem
                          key={food.id}
                          food={food}
                          onDelete={handleDelete}
                          onEdit={handleEditStart}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Delete All Modal ── */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl ring-1 ring-slate-700">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-100">Delete all foods?</h3>
            <p className="mt-1.5 text-sm text-slate-400">
              This will permanently delete all <span className="font-medium text-slate-200">{foods.length} foods</span> from your database. This action cannot be undone.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleDeleteAll(); }} className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(false)}
                className="flex-1 rounded-xl border border-slate-600 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                autoFocus
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Yes, delete all
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FoodsPage() {
  return (
    <ProtectedRoute>
      <FoodsContent />
    </ProtectedRoute>
  );
}
