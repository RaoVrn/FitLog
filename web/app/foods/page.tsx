"use client";

import { useState, useEffect } from "react";
import { Food } from "@/types";
import FoodItem from "@/components/FoodItem";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getFoods, addFood, deleteFood, foodExists } from "@/services/foodService";
import { Plus, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function FoodsContent() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [unit, setUnit] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      };
      const id = await addFood(user.uid, newFood);
      setFoods((prev) =>
        [...prev, { ...newFood, id }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
      setCalories("");
      setUnit("");
      toast.success(`${newFood.name} added to your food database!`);
    } catch (e) {
      console.error("Failed to add food:", e);
      toast.error("Failed to add food. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const food = foods.find((f) => f.id === id);
    try {
      await deleteFood(user.uid, id);
      setFoods((prev) => prev.filter((f) => f.id !== id));
      toast.success(food ? `${food.name} deleted.` : "Food deleted.");
    } catch (e) {
      console.error("Failed to delete food:", e);
      toast.error("Failed to delete food.");
    }
  };

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Food Database</h1>
        <p className="mt-1 text-slate-400">Manage your personal food items with calorie info.</p>
      </div>

      {/* Add food form */}
      <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
        <h2 className="mb-4 font-semibold text-slate-200">Add New Food</h2>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Food name (e.g. Chapati)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-2 rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
            required
          />
          <input
            type="number"
            placeholder="Calories per unit"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
            min="0"
            step="0.1"
            required
          />
          <input
            type="text"
            placeholder="Unit (e.g. piece)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="col-span-full flex items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 font-semibold text-slate-950 transition hover:bg-green-400 disabled:opacity-50 sm:col-span-1"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving..." : "Add Food"}
          </button>
        </form>
      </div>

      {/* Search & list */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-800 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-700 transition focus:ring-green-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-400" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((food) => (
              <FoodItem key={food.id} food={food} onDelete={handleDelete} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-slate-500">
                {foods.length === 0
                  ? "No foods yet. Add your first food above!"
                  : "No foods match your search."}
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
