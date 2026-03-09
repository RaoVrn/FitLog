"use client";

import { useState, useEffect } from "react";
import { Food } from "@/types";
import FoodItem from "@/components/FoodItem";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getFoods, addFood, deleteFood, foodExists, updateFood } from "@/services/foodService";
import { Plus, Search, Loader2, Pencil, X, Check } from "lucide-react";
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
        unit: unit.trim() || "unit",
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
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
      const id = await addFood(user.uid, template);
      setFoods((prev) =>
        [...prev, { ...template, id }].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`${template.name} added!`);
    } catch {
      toast.error("Failed to quick-add food.");
    }
  };

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
        unit: editState.unit.trim() || "unit",
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

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Food Database</h1>
        <p className="mt-1 text-slate-400">Manage your personal food items with calorie and macro info.</p>
      </div>

      {/* Quick Add */}
      <div className="rounded-xl bg-slate-800 p-5 shadow-lg ring-1 ring-slate-700/50">
        <h2 className="mb-3 text-sm font-semibold text-slate-400">Quick Add Common Foods</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD_FOODS.map((f) => (
            <button
              key={f.name}
              onClick={() => handleQuickAdd(f)}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-300 ring-1 ring-slate-600 transition hover:bg-slate-600 hover:text-slate-100"
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add food form */}
      <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
        <h2 className="mb-4 font-semibold text-slate-200">Add New Food</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <input type="text" placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)}
              className="col-span-2 rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500" required />
            <input type="number" placeholder="Calories per unit" value={calories} onChange={(e) => setCalories(e.target.value)}
              className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500" min="0" step="0.1" required />
            <input type="text" placeholder="Unit (e.g. piece)" value={unit} onChange={(e) => setUnit(e.target.value)}
              className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="number" placeholder="Protein (g)" value={protein} onChange={(e) => setProtein(e.target.value)}
              className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-blue-400" min="0" step="0.1" />
            <input type="number" placeholder="Carbs (g)" value={carbs} onChange={(e) => setCarbs(e.target.value)}
              className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-yellow-400" min="0" step="0.1" />
            <input type="number" placeholder="Fat (g)" value={fat} onChange={(e) => setFat(e.target.value)}
              className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-pink-400" min="0" step="0.1" />
          </div>
          <button type="submit" disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 font-semibold text-slate-950 transition hover:bg-green-400 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving..." : "Add Food"}
          </button>
        </form>
      </div>

      {/* Edit modal */}
      {editState && (
        <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-green-500/50">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-green-400" /> Edit Food
            </h2>
            <button onClick={() => setEditState(null)} className="rounded p-1 text-slate-500 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <input type="text" value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                className="col-span-2 rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-green-500" />
              <input type="number" value={editState.calories} onChange={(e) => setEditState({ ...editState, calories: e.target.value })}
                className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-green-500" />
              <input type="text" value={editState.unit} onChange={(e) => setEditState({ ...editState, unit: e.target.value })}
                className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-green-500" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="number" placeholder="Protein (g)" value={editState.protein} onChange={(e) => setEditState({ ...editState, protein: e.target.value })}
                className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-blue-400" />
              <input type="number" placeholder="Carbs (g)" value={editState.carbs} onChange={(e) => setEditState({ ...editState, carbs: e.target.value })}
                className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-yellow-400" />
              <input type="number" placeholder="Fat (g)" value={editState.fat} onChange={(e) => setEditState({ ...editState, fat: e.target.value })}
                className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-pink-400" />
            </div>
            <button onClick={handleEditSave}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 font-semibold text-slate-950 transition hover:bg-green-400">
              <Check className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Search & list */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search foods..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-800 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-700 transition focus:ring-green-500" />
        </div>

        {loading ? (
          <SkeletonList rows={5} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((food) => (
              <FoodItem key={food.id} food={food} onDelete={handleDelete} onEdit={handleEditStart} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-slate-500">
                {foods.length === 0 ? "No foods yet. Add your first food above!" : "No foods match your search."}
              </p>
            )}
          </div>
        )}
      </div>
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
