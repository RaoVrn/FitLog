"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Dumbbell, PlusCircle, UtensilsCrossed, TrendingUp, Loader2, Zap } from "lucide-react";
import CalorieChart from "@/components/CalorieChart";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getTodayLog, getWeeklyLogs } from "@/services/logService";
import { WeeklyData, DailyLog } from "@/types";

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
    <div className="flex items-center gap-4 rounded-xl bg-slate-800 p-5 shadow-lg ring-1 ring-slate-700/50">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
        <Icon className={`h-6 w-6 ${iconClass}`} />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [today, weekly] = await Promise.all([
          getTodayLog(user.uid),
          getWeeklyLogs(user.uid),
        ]);
        setTodayLog(today);
        const chartData: WeeklyData[] = weekly.map((log) => ({
          day: new Date(log.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
          calories: log.foods.reduce((s, f) => s + f.totalCalories, 0),
        }));
        setWeeklyData(chartData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const todayCalories = todayLog?.foods.reduce((s, f) => s + f.totalCalories, 0) ?? 0;
  const workoutCount  = todayLog?.exercises.length ?? 0;
  const todayBurned   = todayLog?.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0) ?? 0;
  const avgCalories =
    weeklyData.length > 0
      ? Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / weeklyData.length)
      : 0;

  const quickActions = [
    { href: "/log/diet", label: "Log Meal", icon: UtensilsCrossed, color: "text-green-400", bg: "bg-green-500/10 hover:bg-green-500/20" },
    { href: "/log/exercise", label: "Log Exercise", icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/10 hover:bg-blue-500/20" },
    { href: "/foods", label: "Manage Foods", icon: PlusCircle, color: "text-purple-400", bg: "bg-purple-500/10 hover:bg-purple-500/20" },
  ];

  if (dataLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-slate-400">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Today's Calories"
          value={todayCalories > 0 ? `${todayCalories.toLocaleString()} kcal` : "No meals logged"}
          sub={todayCalories > 0 ? `${todayLog?.foods.length ?? 0} food items` : "Log your first meal"}
          iconClass="text-green-400"
          bgClass="bg-green-500/10"
        />
        <StatCard
          icon={Dumbbell}
          label="Today's Workouts"
          value={workoutCount > 0 ? workoutCount : "None logged"}
          sub={workoutCount > 0 ? "exercises completed" : "Log an exercise"}
          iconClass="text-blue-400"
          bgClass="bg-blue-500/10"
        />
        <StatCard
          icon={Zap}
          label="Calories Burned"
          value={todayBurned > 0 ? `−${todayBurned.toLocaleString()} kcal` : "No data"}
          sub={todayBurned > 0 ? "from today's exercises" : "Log an exercise"}
          iconClass="text-orange-400"
          bgClass="bg-orange-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Weekly Average"
          value={avgCalories > 0 ? `${avgCalories.toLocaleString()} kcal` : "No data yet"}
          sub="per day this week"
          iconClass="text-purple-400"
          bgClass="bg-purple-500/10"
        />
      </div>

      <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">Weekly Calories</h2>
          <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-400">Last 7 days</span>
        </div>
        {weeklyData.every((d) => d.calories === 0) ? (
          <div className="flex h-[220px] items-center justify-center text-slate-500">
            No calorie data yet. Start logging meals!
          </div>
        ) : (
          <CalorieChart data={weeklyData} />
        )}
      </div>

      <div>
        <h2 className="mb-4 font-semibold text-slate-300">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map(({ href, label, icon: Icon, color, bg }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl p-4 ring-1 ring-slate-700/50 transition-all ${bg}`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="font-medium text-slate-200">{label}</span>
            </Link>
          ))}
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
