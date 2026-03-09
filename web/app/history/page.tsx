"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown, ChevronUp, Flame, Dumbbell, Utensils, Activity, TrendingUp, Search } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLogs } from "@/services/logService";
import { DailyLog } from "@/types";
import { MacroSummary } from "@/components/MacroDisplay";
import { SkeletonList } from "@/components/Skeleton";

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
  const totalCalsBurned   = log.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  const netCalories       = totalFoodCalories - totalCalsBurned;
  const totalProtein = log.foods.reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs   = log.foods.reduce((s, f) => s + (f.carbs   || 0), 0);
  const totalFat     = log.foods.reduce((s, f) => s + (f.fat     || 0), 0);
  const hasMacros    = totalProtein > 0 || totalCarbs > 0 || totalFat > 0;

  return (
    <div className="rounded-xl bg-slate-800 shadow-lg ring-1 ring-slate-700/50 transition-all hover:ring-slate-600">
      <button onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700">
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-100">{formatDate(log.date)}</p>
            <p className="text-sm text-slate-500">
              {log.foods.length} foods &middot; {log.exercises.length} exercises
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500">Net calories</p>
            <p className={`font-bold ${netCalories < 0 ? "text-green-400" : "text-slate-200"}`}>
              {netCalories.toLocaleString()} kcal
            </p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700 px-5 pb-5 pt-4 space-y-5">
          {/* Food */}
          {log.foods.length > 0 && (
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
                      <p className="text-xs text-slate-500">
                        Qty: {food.quantity}
                        {food.protein !== undefined && (
                          <span className="ml-2 text-slate-600">
                            P:{food.protein}g C:{food.carbs ?? 0}g F:{food.fat ?? 0}g
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-300">{food.totalCalories} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Macros */}
          {hasMacros && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-400">Macros</h3>
              <MacroSummary protein={totalProtein} carbs={totalCarbs} fat={totalFat} />
            </div>
          )}

          {/* Exercises */}
          {log.exercises.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
                <Dumbbell className="h-4 w-4 text-blue-400" />
                Exercises
                {totalCalsBurned > 0 && (
                  <span className="ml-auto text-orange-400">-{totalCalsBurned} kcal burned</span>
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
                      <span className="text-sm font-semibold text-orange-400">-{ex.caloriesBurned} kcal</span>
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
              <p className="font-bold text-orange-400">-{totalCalsBurned}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Net</p>
              <p className={`font-bold ${netCalories < 0 ? "text-green-400" : "text-slate-100"}`}>{netCalories}</p>
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
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const fetched = await getLogs(user.uid, 60);
        setLogs(fetched);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalConsumed  = logs.reduce((s, l) => s + l.foods.reduce((a, f) => a + f.totalCalories, 0), 0);
  const totalBurned    = logs.reduce((s, l) => s + l.exercises.reduce((a, e) => a + (e.caloriesBurned || 0), 0), 0);
  const avgCalories    = logs.length > 0 ? Math.round(totalConsumed / logs.length) : 0;
  const totalNetCalories = totalConsumed - totalBurned;

  const filtered = search.trim()
    ? logs.filter((l) => l.date.includes(search) ||
        l.foods.some((f) => f.foodName.toLowerCase().includes(search.toLowerCase())) ||
        l.exercises.some((e) => e.name.toLowerCase().includes(search.toLowerCase())))
    : logs;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">History</h1>
        <p className="mt-1 text-slate-400">Your recent daily logs</p>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50 animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-700 mb-2" />
              <div className="h-7 w-32 rounded bg-slate-700" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="h-4 w-4" /> Total logs
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-100">{logs.length} days</p>
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
              {totalBurned > 0 ? `-${totalBurned.toLocaleString()} kcal` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Activity className="h-4 w-4 text-indigo-400" /> Total net
            </div>
            <p className={`mt-2 text-2xl font-bold ${totalNetCalories < 0 ? "text-green-400" : "text-slate-200"}`}>
              {logs.length > 0 ? `${totalNetCalories.toLocaleString()} kcal` : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input type="text" placeholder="Search by date, food, or exercise..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-slate-800 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-700 transition focus:ring-green-500" />
      </div>

      {loading ? (
        <SkeletonList rows={5} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-20 text-center">
          <Calendar className="mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-500">
            {logs.length === 0
              ? "No logs yet. Start by logging your diet or exercise!"
              : "No logs match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
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
