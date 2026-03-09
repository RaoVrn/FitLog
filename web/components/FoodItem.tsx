import { Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { Food } from "@/types";

interface FoodItemProps {
  food: Food;
  onDelete?: (id: string) => void;
  onEdit?:   (food: Food) => void;
}

export default function FoodItem({ food, onDelete, onEdit }: FoodItemProps) {
  const hasMacros = food.protein !== undefined || food.carbs !== undefined || food.fat !== undefined;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      {/* Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onKeyDown={(e) => { if (e.key === "Enter") { setConfirmDelete(false); onDelete!(food.id!); } if (e.key === "Escape") setConfirmDelete(false); }}
        >
          <div className="w-80 rounded-2xl bg-slate-800 p-6 shadow-2xl ring-1 ring-slate-700">
            <h3 className="mb-1 text-base font-semibold text-slate-100">Delete food?</h3>
            <p className="mb-5 text-sm text-slate-400">
              <span className="font-medium text-slate-200">{food.name}</span> will be permanently removed from your database.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                autoFocus
                onClick={() => { setConfirmDelete(false); onDelete!(food.id!); }}
                className="flex-1 rounded-lg bg-red-500/20 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="group flex items-center gap-3 rounded-xl bg-slate-800/70 px-3 py-2.5 ring-1 ring-slate-700/50 transition hover:bg-slate-800 hover:ring-slate-500">
      {/* Calorie badge */}
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-green-500/10 ring-1 ring-green-500/20">
        <span className="text-xs font-bold leading-none text-green-400">{food.caloriesPerUnit}</span>
        <span className="text-[9px] leading-tight text-green-600">kcal</span>
      </div>

      {/* Name + unit + macros */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-100">{food.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-slate-700 px-1.5 py-0.5 text-[11px] text-slate-400">
            {/^\d+$/.test(food.unit || "") ? `1 piece` : /^\d/.test(food.unit || "") ? food.unit : `1 ${food.unit || "piece"}`}
          </span>
          {hasMacros && (
            <>
              {food.protein !== undefined && (
                <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-medium text-blue-400">
                  Protein - {food.protein}g
                </span>
              )}
              {food.carbs !== undefined && (
                <span className="rounded-md bg-yellow-500/10 px-1.5 py-0.5 text-[11px] font-medium text-yellow-400">
                  Carbs - {food.carbs}g
                </span>
              )}
              {food.fat !== undefined && (
                <span className="rounded-md bg-pink-500/10 px-1.5 py-0.5 text-[11px] font-medium text-pink-400">
                  Fat - {food.fat}g
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        {onEdit && food.id && (
          <button
            onClick={() => onEdit(food)}
            className="rounded-md p-1.5 text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && food.id && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md p-1.5 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
    </>
  );
}
