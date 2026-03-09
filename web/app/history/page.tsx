"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown, ChevronUp, Flame, Dumbbell, Utensils, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLogs } from "@/services/logService";
import { DailyLog } from "@/types";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LogCard({ log }: { log: DailyLog }) {
  const [expanded, setExpanded] = useState(false);
  const totalFoodCalories = log.foods.reduce((s, f) => s + f.totalCalories, 0);
  const totalCalsBurned = log.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  const netCalories = totalFoodCalories - totalCalsBurned;

  return (
    <div className="rounded-xl bg-slate-800 shadow-lg ring-1 ring-slate-700/50 transition-all hover:ring-slate-600">
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700">
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-100">{formatDate(log.date)}</p>
            <p className="text-sm text-slate-500">
              {log.foods.length} foods · {log.exercises.length} exercises
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-500">Net calories</p>
            <p className="font-bold text-green-400">{netCalories.toLocaleString()} kcal</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-700 px-5 pb-5 pt-4 space-y-5">
          {/* Food */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Utensils className="h-4 w-4 text-green-400" />
              Foods consumed
              <span className="ml-auto text-green-400">{totalFoodCalories} kcal</span>
            </h3>
            <div className="space-y-2">
              {log.foods.map((food, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{food.foodName}</p>
                    <p className="text-xs text-slate-500">Qty: {food.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-300">{food.totalCalories} kcal</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exercises */}
          {log.exercises.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
                <Dumbbell className="h-4 w-4 text-blue-400" />
                Exercises
                {totalCalsBurned > 0 && (
                  <span className="ml-auto text-orange-400">−{totalCalsBurned} kcal burned</span>
                )}
              </h3>
              <div className="space-y-2">
                {log.exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{ex.name}</p>
                      <p className="text-xs text-slate-500">
                        {ex.sets && ex.reps && `${ex.sets} sets × ${ex.reps} reps`}
                        {ex.duration && `${ex.duration} min`}
                      </p>
                    </div>
                    {ex.caloriesBurned && (
                      <span className="text-sm font-semibold text-orange-400">−{ex.caloriesBurned} kcal</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-700/30 p-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">Consumed</p>
              <p className="font-bold text-green-400">{totalFoodCalories}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Burned</p>
              <p className="font-bold text-orange-400">−{totalCalsBurned}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Net</p>
              <p className="font-bold text-slate-100">{netCalories}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryContent() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const fetched = await getLogs(user.uid, 30);
        setLogs(fetched);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalConsumed = logs.reduce((s, l) => s + l.foods.reduce((a, f) => a + f.totalCalories, 0), 0);
  const totalBurned = logs.reduce((s, l) => s + l.exercises.reduce((a, e) => a + (e.caloriesBurned || 0), 0), 0);
  const avgCalories = logs.length > 0 ? Math.round(totalConsumed / logs.length) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">History</h1>
        <p className="mt-1 text-slate-400">Your recent daily logs</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4" /> Total logs
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{logs.length} logs</p>
        </div>
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Flame className="h-4 w-4 text-green-400" /> Avg daily calories
          </div>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {logs.length > 0 ? `${avgCalories.toLocaleString()} kcal` : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Dumbbell className="h-4 w-4 text-orange-400" /> Total burned
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-400">
            {totalBurned > 0 ? `−${totalBurned.toLocaleString()} kcal` : "—"}
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-20 text-center">
          <Calendar className="mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-500">No logs yet. Start by logging your diet or exercise!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <LogCard key={log.id ?? log.date} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
