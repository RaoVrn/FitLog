import { Trash2, Pencil, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Food } from "@/types";

interface FoodItemProps {
  food: Food;
  onDelete?: (id: string) => void;
  onEdit?:   (food: Food) => void;
}

export default function FoodItem({ food, onDelete, onEdit }: FoodItemProps) {
  const hasMacros = food.protein !== undefined || food.carbs !== undefined || food.fat !== undefined;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-slate-800 p-6 shadow-2xl ring-1 ring-slate-700">
            <h3 className="mb-1 text-base font-semibold text-slate-100">Delete food?</h3>
            <p className="mb-5 text-sm text-slate-400">
              <span className="font-medium text-slate-200">{food.name}</span> will be permanently removed from your database.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); setConfirmDelete(false); onDelete!(food.id!); }} className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                autoFocus
                className="flex-1 rounded-lg bg-red-500/20 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}

    <div className="group flex items-center gap-3 rounded-xl bg-slate-800/70 px-3 py-2.5 border-2 border-slate-700/60 transition hover:bg-slate-800 hover:border-slate-600">
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

      {/* ⋮ dropdown menu */}
      {(onEdit || onDelete) && food.id && (
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-700 hover:text-slate-300"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-30 mt-1 w-36 overflow-hidden rounded-xl bg-slate-900 py-1 shadow-2xl ring-1 ring-slate-600">
              {onEdit && (
                <button
                  onClick={() => { setMenuOpen(false); onEdit(food); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-blue-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
