"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame, Dumbbell, PlusCircle, UtensilsCrossed, TrendingUp,
  Zap, Target, Scale, Pencil, Check, X, ChevronRight, Utensils,
} from "lucide-react";
import CalorieChart from "@/components/CalorieChart";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MacroBar } from "@/components/MacroDisplay";
import { SkeletonCard, SkeletonChart } from "@/components/Skeleton";
import StreakAchievements from "@/components/StreakAchievements";
import { useAuth } from "@/hooks/useAuth";
import { getTodayLog, getWeeklyLogs } from "@/services/logService";
import { getUserStats } from "@/services/userStatsService";
import { WeeklyData, DailyLog, UserStats } from "@/types";
import toast from "react-hot-toast";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
  bgClass?: string;
}

function StatCard({ icon: Icon, label, value, sub, iconClass = "text-green-400", bgClass = "bg-green-500/10" }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
        <Icon className={`h-6 w-6 ${iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate text-2xl font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, userProfile, updateProfile } = useAuth();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [log, weekly, stats] = await Promise.all([
          getTodayLog(user.uid),
          getWeeklyLogs(user.uid),
          getUserStats(user.uid),
        ]);
        setTodayLog(log);
        setWeeklyData(weekly);
        setUserStats(stats);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const goal = userProfile?.calorieGoal ?? 2000;
  const consumed = todayLog?.totalCalories ?? 0;
  const burned = todayLog?.totalBurned ?? 0;
  const net = todayLog?.netCalories ?? consumed - burned;
  const protein = todayLog?.totalProtein ?? 0;
  const carbs = todayLog?.totalCarbs ?? 0;
  const fat = todayLog?.totalFat ?? 0;

  const remaining = goal - consumed;
  const over = consumed > goal;
  const pct = Math.min(100, Math.round((consumed / goal) * 100));

  // Recommended macro targets based on calorie goal
  const proteinGoalG = Math.round((goal * 0.30) / 4);
  const carbsGoalG   = Math.round((goal * 0.50) / 4);
  const fatGoalG     = Math.round((goal * 0.20) / 9);

  // Today's recent entries (show last 3, newest first)
  const recentFoods     = (todayLog?.foods     ?? []).slice(-3).reverse();
  const recentExercises = (todayLog?.exercises ?? []).slice(-3).reverse();
  const currentStreak = userStats?.currentStreak ?? 0;
  const longestStreak = userStats?.longestStreak ?? 0;
  const lastActiveDate = userStats?.lastActiveDate ?? "";

  const handleSaveGoal = async () => {
    const g = parseInt(goalInput);
    if (!g || g < 500 || g > 10000) { toast.error("Enter a valid goal (500–10000)"); return; }
    try {
      await updateProfile({ calorieGoal: g });
      toast.success("Calorie goal updated!");
      setEditingGoal(false);
    } catch {
      toast.error("Failed to save goal");
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "there";

  const quickActions = [
    { href: "/log/diet",     icon: UtensilsCrossed, label: "Log Diet",     color: "text-green-400",  bg: "bg-green-500/10 hover:bg-green-500/20"  },
    { href: "/log/exercise", icon: Dumbbell,        label: "Log Exercise", color: "text-blue-400",   bg: "bg-blue-500/10 hover:bg-blue-500/20"    },
    { href: "/foods",        icon: PlusCircle,      label: "Manage Foods", color: "text-purple-400", bg: "bg-purple-500/10 hover:bg-purple-500/20" },
    { href: "/weight",       icon: Scale,           label: "Track Weight", color: "text-pink-400",   bg: "bg-pink-500/10 hover:bg-pink-500/20"    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-100 select-none">
              {greeting},{" "}
              <span className="capitalize text-green-400">{displayName}</span>
            </h1>
          </div>

          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveGoal()}
                placeholder="kcal goal"
                className="w-28 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-100 ring-1 ring-slate-600 focus:outline-none focus:ring-green-500"
              />
              <button onClick={handleSaveGoal} className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-500">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditingGoal(false)} className="rounded-lg bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-700 transition hover:ring-green-500"
            >
              <Target className="h-4 w-4" /> Goal: {goal} kcal
              <Pencil className="h-3 w-3 ml-1" />
            </button>
          )}
        </div>

        {/* ── Stats Grid ── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Flame}
              label="Consumed"
              value={`${consumed} kcal`}
              sub={over ? `${consumed - goal} kcal over goal` : `${goal - consumed} kcal left`}
              iconClass="text-orange-400"
              bgClass="bg-orange-500/10"
            />
            <StatCard
              icon={Dumbbell}
              label="Burned"
              value={`${burned} kcal`}
              sub={burned > 0 ? "from workouts" : "No workouts yet"}
              iconClass="text-blue-400"
              bgClass="bg-blue-500/10"
            />
            <StatCard
              icon={TrendingUp}
              label="Net Calories"
              value={`${net} kcal`}
              sub={net <= goal ? "On track" : "Above goal"}
              iconClass={net <= goal ? "text-green-400" : "text-red-400"}
              bgClass={net <= goal ? "bg-green-500/10" : "bg-red-500/10"}
            />
          </div>
        )}

        {!loading && (
          <StreakAchievements
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            lastActiveDate={lastActiveDate}
          />
        )}

        {/* ── Calorie Progress + Macros ── */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Calorie progress */}
            <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Daily Calorie Goal</span>
                <span className={`text-sm font-bold ${over ? "text-red-400" : "text-green-400"}`}>
                  {consumed} / {goal} kcal
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${over ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{pct}% of goal</span>
                <span className={over ? "font-semibold text-red-400" : "font-semibold text-slate-400"}>
                  {over ? `${consumed - goal} kcal over` : `${remaining} kcal remaining`}
                </span>
              </div>
              {burned > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2 ring-1 ring-blue-500/20">
                  <span className="text-xs text-blue-300">Calories burned today</span>
                  <span className="text-xs font-bold text-blue-400">{burned} kcal</span>
                </div>
              )}
            </div>

            {/* Macros */}
            <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Zap className="h-4 w-4 text-indigo-400" /> Today&apos;s Macros
                </div>
                <span className="text-xs text-slate-600">vs. recommended</span>
              </div>
              <div className="space-y-4">
                <MacroBar label="Protein" value={protein} max={proteinGoalG} color="#60a5fa" />
                <MacroBar label="Carbs"   value={carbs}   max={carbsGoalG}   color="#facc15" />
                <MacroBar label="Fat"     value={fat}     max={fatGoalG}     color="#f472b6" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-700/40 py-2">
                  <p className="text-sm font-bold text-blue-400">{protein.toFixed(1)}g</p>
                  <p className="text-[10px] text-slate-500">Protein</p>
                </div>
                <div className="rounded-lg bg-slate-700/40 py-2">
                  <p className="text-sm font-bold text-yellow-400">{carbs.toFixed(1)}g</p>
                  <p className="text-[10px] text-slate-500">Carbs</p>
                </div>
                <div className="rounded-lg bg-slate-700/40 py-2">
                  <p className="text-sm font-bold text-pink-400">{fat.toFixed(1)}g</p>
                  <p className="text-[10px] text-slate-500">Fat</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Today's Entries ── */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Foods */}
            <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Utensils className="h-4 w-4 text-green-400" /> Today&apos;s Foods
                </div>
                <Link href="/log/diet" className="flex items-center gap-0.5 text-xs text-slate-500 transition hover:text-green-400">
                  Add <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {recentFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Utensils className="mb-2 h-8 w-8 text-slate-700" />
                  <p className="text-sm text-slate-600">Nothing logged yet today</p>
                  <Link href="/log/diet" className="mt-2 text-xs text-green-500 hover:text-green-400">
                    Log your first meal →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentFoods.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-700/40 px-3 py-2.5">
                      <span className="truncate text-sm text-slate-300">{f.foodName}</span>
                      <span className="ml-2 shrink-0 rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                        {f.totalCalories} kcal
                      </span>
                    </div>
                  ))}
                  {(todayLog?.foods?.length ?? 0) > 3 && (
                    <Link href="/history" className="block pt-1 text-center text-xs text-slate-500 hover:text-slate-300">
                      +{(todayLog?.foods?.length ?? 0) - 3} more entries
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Exercises */}
            <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Dumbbell className="h-4 w-4 text-blue-400" /> Today&apos;s Exercises
                </div>
                <Link href="/log/exercise" className="flex items-center gap-0.5 text-xs text-slate-500 transition hover:text-blue-400">
                  Add <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {recentExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Dumbbell className="mb-2 h-8 w-8 text-slate-700" />
                  <p className="text-sm text-slate-600">No exercises logged yet</p>
                  <Link href="/log/exercise" className="mt-2 text-xs text-blue-500 hover:text-blue-400">
                    Log a workout →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentExercises.map((e, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-700/40 px-3 py-2.5">
                      <span className="truncate text-sm text-slate-300">{e.name}</span>
                      <span className="ml-2 shrink-0 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                        {e.caloriesBurned
                          ? `${e.caloriesBurned} kcal`
                          : e.duration
                          ? `${e.duration} min`
                          : e.sets && e.reps
                          ? `${e.sets}×${e.reps}`
                          : "—"}
                      </span>
                    </div>
                  ))}
                  {(todayLog?.exercises?.length ?? 0) > 3 && (
                    <Link href="/history" className="block pt-1 text-center text-xs text-slate-500 hover:text-slate-300">
                      +{(todayLog?.exercises?.length ?? 0) - 3} more exercises
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Weekly Chart ── */}
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h2 className="font-semibold text-slate-200">Weekly Overview</h2>
          </div>
          {loading ? <SkeletonChart /> : <CalorieChart data={weeklyData} />}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Zap className="h-3.5 w-3.5" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ href, icon: Icon, label, color, bg }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 ring-1 ring-slate-700/50 transition ${bg}`}
              >
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-center text-xs font-medium text-slate-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── History Link ── */}
        <div className="flex justify-end">
          <Link
            href="/history"
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-400 ring-1 ring-slate-700 transition hover:text-slate-100 hover:ring-slate-500"
          >
            View Full History <TrendingUp className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}


