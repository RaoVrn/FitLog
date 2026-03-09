import { Flame, Trash2 } from "lucide-react";
import { Food } from "@/types";

interface FoodItemProps {
  food: Food;
  onDelete?: (id: string) => void;
}

export default function FoodItem({ food, onDelete }: FoodItemProps) {
  return (
    <div className="group flex items-center justify-between rounded-xl bg-slate-800 p-4 shadow-lg ring-1 ring-slate-700/50 transition-all hover:ring-slate-600">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
          <Flame className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-100">{food.name}</p>
          <p className="text-sm text-slate-400">
            {food.caloriesPerUnit} kcal / {food.unit || "unit"}
          </p>
        </div>
      </div>

      {onDelete && food.id && (
        <button
          onClick={() => onDelete(food.id!)}
          className="rounded-lg p-2 text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
