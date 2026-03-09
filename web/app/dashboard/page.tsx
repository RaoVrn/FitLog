"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame, Dumbbell, PlusCircle, UtensilsCrossed, TrendingUp,
  Zap, Activity, Target, Scale, Pencil, Check, X,
} from "lucide-react";
import CalorieChart from "@/components/CalorieChart";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MacroSummary } from "@/components/MacroDisplay";
import { SkeletonCard, SkeletonChart } from "@/components/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { getTodayLog, getWeeklyLogs, getWorkoutStreak } from "@/services/logService";
import { WeeklyData, DailyLog } from "@/types";
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

function GoalProgressBar({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(100, Math.round((consumed / goal) * 100));
  const over = consumed > goal;
  return (
    <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-300">Daily Calorie Goal</span>
        <span className={over ? "font-bold text-red-400" : "font-bold text-green-400"}>
          {consumed} / {goal} kcal
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-slate-500">{pct}% of goal</p>
    </div>
  );
}

function DashboardContent() {
  const { user, userProfile, updateProfile } = useAuth();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [log, weekly, s] = await Promise.all([
          getTodayLog(user.uid),
          getWeeklyLogs(user.uid),
          getWorkoutStreak(user.uid),
        ]);
        setTodayLog(log);
        setWeeklyData(weekly);
        setStreak(s);
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
  const hasMacros = (todayLog?.totalProtein ?? 0) > 0 || (todayLog?.totalCarbs ?? 0) > 0 || (todayLog?.totalFat ?? 0) > 0;

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

  const quickActions = [
    { href: "/log/diet", icon: UtensilsCrossed, label: "Log Diet", color: "text-green-400", bg: "bg-green-500/10 hover:bg-green-500/20" },
    { href: "/log/exercise", icon: Dumbbell, label: "Log Exercise", color: "text-blue-400", bg: "bg-blue-500/10 hover:bg-blue-500/20" },
    { href: "/foods", icon: PlusCircle, label: "Manage Foods", color: "text-purple-400", bg: "bg-purple-500/10 hover:bg-purple-500/20" },
    { href: "/weight", icon: Scale, label: "Track Weight", color: "text-pink-400", bg: "bg-pink-500/10 hover:bg-pink-500/20" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="mt-1 text-slate-400">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input autoFocus type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                placeholder="kcal goal"
                className="w-28 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-100 ring-1 ring-slate-600 focus:outline-none focus:ring-green-500" />
              <button onClick={handleSaveGoal} className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-500"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditingGoal(false)} className="rounded-lg bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-700 transition hover:ring-green-500">
              <Target className="h-4 w-4" /> Goal: {goal} kcal
              <Pencil className="h-3 w-3 ml-1" />
            </button>
          )}
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Flame} label="Consumed" value={`${consumed} kcal`}
              sub={consumed < goal ? `${goal - consumed} kcal left to goal` : `${consumed - goal} kcal over goal`}
              iconClass="text-orange-400" bgClass="bg-orange-500/10" />
            <StatCard icon={Dumbbell} label="Burned" value={`${burned} kcal`} iconClass="text-blue-400" bgClass="bg-blue-500/10" />
            <StatCard icon={TrendingUp} label="Net Calories" value={`${net} kcal`}
              iconClass={net <= 0 ? "text-green-400" : "text-slate-300"}
              bgClass={net <= 0 ? "bg-green-500/10" : "bg-slate-700/30"} />
            <StatCard icon={Activity} label="Workout Streak" value={`${streak} days`}
              sub={streak > 0 ? "Keep it up! 🔥" : "Start today!"}
              iconClass="text-yellow-400" bgClass="bg-yellow-500/10" />
          </div>
        )}

        {/* Calorie Goal Progress */}
        {!loading && <GoalProgressBar consumed={consumed} goal={goal} />}

        {/* Macro Summary */}
        {!loading && hasMacros && (
          <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Zap className="h-4 w-4 text-indigo-400" /> Today&apos;s Macros
            </div>
            <MacroSummary
              protein={todayLog?.totalProtein ?? 0}
              carbs={todayLog?.totalCarbs ?? 0}
              fat={todayLog?.totalFat ?? 0}
            />
          </div>
        )}

        {/* Weekly Chart */}
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h2 className="font-semibold text-slate-200">Weekly Overview</h2>
          </div>
          {loading ? <SkeletonChart /> : <CalorieChart data={weeklyData} />}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            <Zap className="h-4 w-4" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ href, icon: Icon, label, color, bg }) => (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 ring-1 ring-slate-700/50 transition ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-center text-xs font-medium text-slate-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent History Link */}
        <div className="flex justify-end">
          <Link href="/history" className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-400 ring-1 ring-slate-700 transition hover:text-slate-100 hover:ring-slate-500">
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

