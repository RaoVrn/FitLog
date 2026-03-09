import { Flame, Trash2, Pencil } from "lucide-react";
import { Food } from "@/types";

interface FoodItemProps {
  food: Food;
  onDelete?: (id: string) => void;
  onEdit?:   (food: Food) => void;
}

export default function FoodItem({ food, onDelete, onEdit }: FoodItemProps) {
  const hasMacros = food.protein !== undefined || food.carbs !== undefined || food.fat !== undefined;
  return (
    <div className="group flex items-center justify-between rounded-xl bg-slate-800 p-4 shadow-lg ring-1 ring-slate-700/50 transition-all hover:ring-slate-600">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
          <Flame className="h-5 w-5 text-green-400" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-100 truncate">{food.name}</p>
          <p className="text-sm text-slate-400">
            {food.caloriesPerUnit} kcal / {food.unit || "unit"}
          </p>
          {hasMacros && (
            <div className="mt-1 flex gap-2 text-xs text-slate-500">
              {food.protein !== undefined && <span className="text-blue-400">P: {food.protein}g</span>}
              {food.carbs   !== undefined && <span className="text-yellow-400">C: {food.carbs}g</span>}
              {food.fat     !== undefined && <span className="text-pink-400">F: {food.fat}g</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
        {onEdit && food.id && (
          <button
            onClick={() => onEdit(food)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {onDelete && food.id && (
          <button
            onClick={() => onDelete(food.id!)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
