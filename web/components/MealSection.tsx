"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Trash2, Check, X } from "lucide-react";
import { FoodEntry, MealType, Food } from "@/types";

const MEAL_META: Record<MealType, { label: string; icon: string; color: string }> = {
  breakfast: { label: "Breakfast", icon: "🍳", color: "text-orange-400" },
  lunch:     { label: "Lunch",     icon: "🍛", color: "text-amber-400"  },
  dinner:    { label: "Dinner",    icon: "🍽",  color: "text-violet-400" },
  snack:     { label: "Snacks",    icon: "🍎", color: "text-emerald-400" },
};

export interface MealSectionProps {
  mealType: MealType;
  foods: FoodEntry[];
  allFoods: Food[];
  getGlobalIndex: (localIdx: number) => number;
  editIdx: number | null;
  editQty: string;
  onEditStart: (globalIdx: number) => void;
  onEditQtyChange: (val: string) => void;
  onEditSave: (globalIdx: number) => void;
  onEditCancel: () => void;
  onDeleteRequest: (globalIdx: number) => void;
  onClearMeal: () => void;
  defaultOpen?: boolean;
}

function calcTotals(foods: FoodEntry[]) {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.totalCalories,
      protein:  acc.protein  + (f.protein ?? 0),
      carbs:    acc.carbs    + (f.carbs   ?? 0),
      fat:      acc.fat      + (f.fat     ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export default function MealSection({
  mealType,
  foods,
  getGlobalIndex,
  editIdx,
  editQty,
  onEditStart,
  onEditQtyChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onClearMeal,
  defaultOpen = false,
}: MealSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const meta     = MEAL_META[mealType];
  const totals   = calcTotals(foods);
  const hasMacros = foods.some((f) => f.protein !== undefined);

  return (
    <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700/50 overflow-hidden">

      {/* ── Header ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((o) => !o); }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 transition hover:bg-slate-700/20"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
          <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {foods.length === 0 ? "empty" : foods.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {totals.calories > 0 && (
            <span className="text-sm font-semibold tabular-nums text-slate-300">
              {totals.calories}
              <span className="ml-1 text-xs font-normal text-slate-500">kcal</span>
            </span>
          )}
          {foods.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClearMeal(); }}
              className="rounded-md p-1 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
              title={`Clear all ${meta.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* ── Body ── */}
      {open && (
        <>
          {foods.length === 0 ? (
            <div className="border-t border-slate-700/40 px-4 py-6 text-center">
              <p className="text-sm text-slate-500">Nothing logged for {meta.label.toLowerCase()} yet.</p>
            </div>
          ) : (
            <>
              {/* Food rows */}
              <div className="border-t border-slate-700/40 px-3 py-2 space-y-1">
                {foods.map((entry, localIdx) => {
                  const globalIdx = getGlobalIndex(localIdx);
                  const isEditing = editIdx === globalIdx;
                  const perUnit   = (entry.totalCalories / entry.quantity).toFixed(0);

                  return (
                    <div
                      key={globalIdx}
                      className="group flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2.5 transition hover:border-slate-600/70 hover:bg-slate-700/20"
                    >
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-100">{entry.foodName}</p>
                        {isEditing ? (
                          <div className="mt-1.5 flex items-center gap-2">
                            <input
                              type="number"
                              value={editQty}
                              onChange={(e) => onEditQtyChange(e.target.value)}
                              className="w-16 rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-green-500/60"
                              min="0.1"
                              step="any"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter")  onEditSave(globalIdx);
                                if (e.key === "Escape") onEditCancel();
                              }}
                            />
                            <button onClick={() => onEditSave(globalIdx)} className="rounded p-1 text-green-400 hover:bg-green-500/10">
                              <Check className="h-3 w-3" />
                            </button>
                            <button onClick={onEditCancel} className="rounded p-1 text-slate-500 hover:bg-slate-700">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {entry.quantity} × {perUnit} kcal
                            {entry.protein !== undefined && (
                              <span className="ml-1.5 text-slate-600">
                                · P&nbsp;{entry.protein}g · C&nbsp;{entry.carbs ?? 0}g · F&nbsp;{entry.fat ?? 0}g
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Actions + calorie */}
                      <div className="ml-3 flex shrink-0 items-center gap-0.5">
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => onEditStart(globalIdx)}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onDeleteRequest(globalIdx)}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                        <span className="ml-2 min-w-[36px] text-right text-sm font-semibold tabular-nums text-slate-200">
                          {entry.totalCalories}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Totals footer ── */}
              <div className="flex items-center justify-between border-t border-slate-700/40 bg-slate-800/40 px-4 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Total</span>
                <div className="flex items-center gap-4 text-xs tabular-nums">
                  {hasMacros && (
                    <>
                      <span className="text-slate-500">P <span className="font-medium text-slate-300">{totals.protein.toFixed(1)}g</span></span>
                      <span className="text-slate-500">C <span className="font-medium text-slate-300">{totals.carbs.toFixed(1)}g</span></span>
                      <span className="text-slate-500">F <span className="font-medium text-slate-300">{totals.fat.toFixed(1)}g</span></span>
                    </>
                  )}
                  <span className="font-semibold text-slate-200">{totals.calories} kcal</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
