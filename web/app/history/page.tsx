"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar, ChevronDown, ChevronUp, Flame, Dumbbell,
  Utensils, Activity, Search, X, TrendingUp, TrendingDown,
  BarChart2, SlidersHorizontal,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLogs, getWeeklyLogs } from "@/services/logService";
import { DailyLog, WeeklyData } from "@/types";
import { MacroSummary } from "@/components/MacroDisplay";
import { SkeletonList } from "@/components/Skeleton";
import CalorieChart from "@/components/CalorieChart";

/* ─────────────────────────── helpers ─────────────────────────── */

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function exerciseDetail(ex: { sets?: number; reps?: number; duration?: number }) {
  const parts: string[] = [];
  if (ex.sets && ex.reps) parts.push(`${ex.sets} sets × ${ex.reps} reps`);
  else if (ex.sets) parts.push(`${ex.sets} sets`);
  if (ex.duration) parts.push(`${ex.duration} min`);
  return parts.join(" · ") || null;
}

/* ─────────────────────────── LogCard ─────────────────────────── */

function LogCard({ log }: { log: DailyLog }) {
  const [expanded, setExpanded] = useState(false);

  const totalFoodCalories = log.foods.reduce((s, f) => s + f.totalCalories, 0);
  const totalCalsBurned   = log.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  const netCalories       = totalFoodCalories - totalCalsBurned;
  const totalProtein = log.foods.reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs   = log.foods.reduce((s, f) => s + (f.carbs   || 0), 0);
  const totalFat     = log.foods.reduce((s, f) => s + (f.fat     || 0), 0);
  const hasMacros    = totalProtein > 0 || totalCarbs > 0 || totalFat > 0;

  const netColor =
    netCalories > 2500 ? "text-red-400" :
    netCalories > 2000 ? "text-yellow-400" :
    netCalories <= 0   ? "text-green-400" :
    "text-slate-100";

  return (
    <div className="rounded-xl bg-slate-800 shadow-lg ring-1 ring-slate-700/50 transition-all duration-200 hover:ring-slate-600 hover:shadow-xl">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/80">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{formatDate(log.date)}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">
              {log.foods.length > 0 && (
                <span className="flex items-center gap-1">
                  <Utensils className="h-3 w-3 text-green-500" />
                  {log.foods.length} food{log.foods.length !== 1 ? "s" : ""}
                </span>
              )}
              {log.exercises.length > 0 && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3 text-blue-400" />
                  {log.exercises.length} exercise{log.exercises.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {/* Pill badges */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
              {totalFoodCalories.toLocaleString()} in
            </span>
            {totalCalsBurned > 0 && (
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400">
                {totalCalsBurned.toLocaleString()} out
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Net</p>
            <p className={`text-sm font-bold leading-tight ${netColor}`}>
              {netCalories.toLocaleString()} kcal
            </p>
          </div>
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${expanded ? "bg-slate-700" : "bg-slate-700/50"}`}>
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-700/70 px-4 pb-4 pt-3 space-y-4 max-h-[380px] overflow-y-auto">

          {/* Foods */}
          {log.foods.length > 0 && (
            <section>
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Utensils className="h-3.5 w-3.5 text-green-400" />
                Foods consumed
                <span className="ml-auto text-green-400 normal-case text-sm font-bold">
                  {totalFoodCalories.toLocaleString()} kcal
                </span>
              </h3>
              <div className="space-y-1.5">
                {log.foods.map((food, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-slate-700/40 px-3 py-2 transition hover:bg-slate-700/60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{food.foodName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Qty: {food.quantity}
                        {food.protein !== undefined && (
                          <>
                            <span className="mx-1.5 text-slate-700">·</span>
                            <span className="text-blue-400/80">P {food.protein}g</span>
                            <span className="mx-1 text-slate-700">·</span>
                            <span className="text-yellow-400/80">C {food.carbs ?? 0}g</span>
                            <span className="mx-1 text-slate-700">·</span>
                            <span className="text-pink-400/80">F {food.fat ?? 0}g</span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 text-sm font-semibold text-slate-300">
                      {food.totalCalories.toLocaleString()} kcal
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Macros */}
          {hasMacros && (
            <section>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Macronutrients
              </h3>
              <MacroSummary protein={totalProtein} carbs={totalCarbs} fat={totalFat} />
            </section>
          )}

          {/* Exercises */}
          {log.exercises.length > 0 && (
            <section>
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Dumbbell className="h-3.5 w-3.5 text-blue-400" />
                Exercises
                {totalCalsBurned > 0 && (
                  <span className="ml-auto text-orange-400 normal-case text-sm font-bold">
                    -{totalCalsBurned.toLocaleString()} kcal
                  </span>
                )}
              </h3>
              <div className="space-y-1.5">
                {log.exercises.map((ex, i) => {
                  const detail = exerciseDetail(ex);
                  return (
                    <div
                      key={ex.id ?? i}
                      className="flex items-center justify-between rounded-lg bg-slate-700/40 px-3 py-2 transition hover:bg-slate-700/60"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{ex.name}</p>
                        {detail && (
                          <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
                        )}
                      </div>
                      {ex.caloriesBurned ? (
                        <span className="ml-3 shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400">
                          -{ex.caloriesBurned} kcal
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Daily summary footer */}
          <div className="grid grid-cols-3 divide-x divide-slate-700 rounded-lg bg-slate-700/25 ring-1 ring-slate-700/50">
            <div className="flex flex-col items-center py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Consumed</p>
              <p className="mt-0.5 text-sm font-bold text-green-400">{totalFoodCalories.toLocaleString()} kcal</p>
            </div>
            <div className="flex flex-col items-center py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Burned</p>
              <p className="mt-0.5 text-sm font-bold text-orange-400">
                {totalCalsBurned > 0 ? `-${totalCalsBurned.toLocaleString()} kcal` : "—"}
              </p>
            </div>
            <div className="flex flex-col items-center py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Net</p>
              <p className={`mt-0.5 text-sm font-bold ${netColor}`}>{netCalories.toLocaleString()} kcal</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── stat card ─────────────────────────── */

function StatCard({
  icon, label, value, sub, color = "text-slate-100",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <div>
        <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────── filter tabs ─────────────────────────── */

type FilterTab = "all" | "diet" | "exercise";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "All logs" },
  { key: "diet",     label: "Has food" },
  { key: "exercise", label: "Has exercise" },
];

/* ─────────────────────────── main page ─────────────────────────── */

function HistoryContent() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [visibleCount, setVisibleCount] = useState(15);
  const [sortAsc, setSortAsc] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [fetched, weekly] = await Promise.all([
          getLogs(user.uid, 90),
          getWeeklyLogs(user.uid),
        ]);
        setLogs(fetched);
        setWeeklyData(weekly);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  /* stats */
  const totalConsumed    = logs.reduce((s, l) => s + l.foods.reduce((a, f) => a + f.totalCalories, 0), 0);
  const totalBurned      = logs.reduce((s, l) => s + l.exercises.reduce((a, e) => a + (e.caloriesBurned || 0), 0), 0);
  const avgCalories      = logs.length > 0 ? Math.round(totalConsumed / logs.length) : 0;
  const totalNetCalories = totalConsumed - totalBurned;
  const activeDays       = logs.filter((l) => l.exercises.length > 0).length;

  /* filter + search + sort */
  const filtered = useMemo(() => {
    let result = logs;

    if (activeFilter === "diet")     result = result.filter((l) => l.foods.length > 0);
    if (activeFilter === "exercise") result = result.filter((l) => l.exercises.length > 0);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.date.includes(q) ||
          formatShortDate(l.date).toLowerCase().includes(q) ||
          l.foods.some((f) => f.foodName.toLowerCase().includes(q)) ||
          l.exercises.some((e) => e.name.toLowerCase().includes(q))
      );
    }

    if (sortAsc) result = [...result].reverse();
    return result;
  }, [logs, search, activeFilter, sortAsc]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
            <Activity className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h1 className="select-none text-2xl font-bold text-slate-100">History</h1>
            <p className="mt-0.5 text-xs text-slate-500">Your recent daily logs</p>
          </div>
        </div>
        {!loading && logs.length > 0 && (
          <p className="text-xs text-slate-500">
            {logs.length} log{logs.length !== 1 ? "s" : ""} recorded
          </p>
        )}
      </div>

      {/* Summary stats */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50 animate-pulse h-[84px]">
              <div className="h-3.5 w-20 rounded bg-slate-700 mb-2.5" />
              <div className="h-6 w-28 rounded bg-slate-700" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Calendar className="h-4 w-4" />}
            label="Total logs"
            value={logs.length > 0 ? `${logs.length} days` : "—"}
            sub={activeDays > 0 ? `${activeDays} active days` : undefined}
          />
          <StatCard
            icon={<Flame className="h-4 w-4 text-green-400" />}
            label="Avg daily intake"
            value={logs.length > 0 ? `${avgCalories.toLocaleString()} kcal` : "—"}
            color="text-green-400"
          />
          <StatCard
            icon={<Dumbbell className="h-4 w-4 text-orange-400" />}
            label="Total burned"
            value={totalBurned > 0 ? `${totalBurned.toLocaleString()} kcal` : "—"}
            color="text-orange-400"
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-indigo-400" />}
            label="Total net"
            value={logs.length > 0 ? `${totalNetCalories.toLocaleString()} kcal` : "—"}
            sub={totalNetCalories < 0 ? "Overall deficit 🎯" : totalNetCalories > 0 ? "Overall surplus" : undefined}
            color={totalNetCalories < 0 ? "text-green-400" : totalNetCalories > 15000 ? "text-red-400" : "text-slate-100"}
          />
        </div>
      )}

      {/* Weekly trend chart */}
      {!loading && weeklyData.length > 0 && (
        <div className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50">
          <div className="mb-0.5 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300">7-day trend</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">Calorie overview for the past week</p>
          <CalorieChart data={weeklyData} />
        </div>
      )}

      {/* Log list — outer collapsible */}
      {loading ? (
        <SkeletonList rows={6} />
      ) : (
        <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700/50 shadow-lg">
          {/* Outer header toggle */}
          <button
            onClick={() => setLogsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/80">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {filtered.length === 0
                    ? logs.length === 0 ? "No logs yet" : "No results found"
                    : `${filtered.length} log${filtered.length !== 1 ? "s" : ""}`}
                </p>
                <p className="text-xs text-slate-500">
                  {filtered.length !== logs.length
                    ? `Filtered from ${logs.length} total`
                    : logs.length > 0 ? "Click to browse" : ""}
                </p>
              </div>
            </div>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
              logsOpen ? "bg-slate-700" : "bg-slate-700/50"
            }`}>
              {logsOpen
                ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
            </div>
          </button>

          {/* Outer body */}
          {logsOpen && (
            <div className="border-t border-slate-700/70">
              {/* Search + filter bar */}
              <div className="flex flex-col gap-2 p-3 border-b border-slate-700/70 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by date, food, or exercise…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setVisibleCount(15); }}
                    className="w-full rounded-lg bg-slate-700/50 py-2 pl-9 pr-8 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-green-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 rounded-lg bg-slate-700/50 p-1 ring-1 ring-slate-600">
                    {FILTER_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => { setActiveFilter(tab.key); setVisibleCount(15); }}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          activeFilter === tab.key
                            ? "bg-green-500 text-slate-900"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSortAsc((v) => !v)}
                    title={sortAsc ? "Oldest first" : "Newest first"}
                    className="flex items-center gap-1 rounded-lg bg-slate-700/50 px-2.5 py-2 text-xs font-medium text-slate-400 ring-1 ring-slate-600 transition hover:text-slate-200"
                  >
                    {sortAsc
                      ? <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                      : <TrendingDown className="h-3.5 w-3.5 text-slate-400" />}
                    <span className="hidden sm:inline">{sortAsc ? "Oldest" : "Newest"}</span>
                  </button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="mb-3 h-10 w-10 text-slate-700" />
                  <p className="text-base font-medium text-slate-400">
                    {logs.length === 0 ? "No logs yet" : "No results found"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {logs.length === 0
                      ? "Start by logging your diet or exercise."
                      : "Try a different search term or filter."}
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 transition"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Scrollable inner list */}
                  <div className="max-h-[460px] overflow-y-auto px-3 pt-2.5 pb-2 space-y-2">
                    {visible.map((log) => (
                      <LogCard key={log.id ?? log.date} log={log} />
                    ))}
                  </div>

                  {/* Footer: count + load more */}
                  <div className="flex flex-col items-center gap-2 border-t border-slate-700/70 px-4 py-3">
                    <p className="text-xs text-slate-600">
                      Showing {visible.length} of {filtered.length} log{filtered.length !== 1 ? "s" : ""}
                      {filtered.length !== logs.length && ` (filtered from ${logs.length})`}
                    </p>
                    {hasMore && (
                      <button
                        onClick={() => setVisibleCount((v) => v + 15)}
                        className="rounded-lg bg-slate-700 px-6 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-600 transition hover:bg-slate-600 hover:text-slate-100"
                      >
                        Load more ({filtered.length - visibleCount} remaining)
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
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
