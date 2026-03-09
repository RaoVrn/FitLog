"use client";

import { useState, useEffect } from "react";
import {
  Scale, Plus, Trash2, TrendingDown, TrendingUp, Loader2, Minus,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { addWeight, getWeights, deleteWeight } from "@/services/weightService";
import { WeightEntry } from "@/types";
import { SkeletonChart, SkeletonList } from "@/components/Skeleton";
import toast from "react-hot-toast";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function WeightTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 shadow-xl">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-lg font-bold text-pink-400">{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
}

function WeightContent() {
  const { user, userProfile, updateProfile } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getWeights(user.uid, 60);
        setEntries(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !weight) return;
    const val = parseFloat(weight);
    if (isNaN(val) || val <= 0 || val > 500) {
      toast.error("Enter a valid weight (0–500 kg).");
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const id = await addWeight(user.uid, { weight: val, date: today, note: note.trim() || undefined });
      const newEntry: WeightEntry = { id, weight: val, date: today, note: note.trim() || undefined };
      setEntries((prev) => [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date)));
      setWeight(""); setNote("");
      toast.success(`Weight ${val} kg logged!`);
    } catch {
      toast.error("Failed to log weight.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteWeight(user.uid, id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry deleted.");
    } catch {
      toast.error("Failed to delete entry.");
    }
  };

  const handleSaveGoal = async () => {
    const val = parseFloat(goalInput);
    if (isNaN(val) || val <= 0 || val > 500) {
      toast.error("Enter a valid weight goal (0–500 kg).");
      return;
    }
    await updateProfile({ weightGoal: val });
    toast.success(`Weight goal set to ${val} kg`);
    setEditingGoal(false);
  };

  const latest   = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  const change   = latest && previous ? latest.weight - previous.weight : null;
  const weightGoal = userProfile?.weightGoal;

  const chartData = entries.map((e) => ({
    date: new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: e.weight,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Weight Tracker</h1>
          <p className="mt-1 text-slate-400">Monitor your weight progress over time</p>
        </div>
        {/* Weight goal */}
        <div className="flex items-center gap-2">
          {editingGoal ? (
            <>
              <input autoFocus type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                className="w-24 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-100 outline-none ring-1 ring-pink-500"
                placeholder="Goal kg" onKeyDown={(e) => e.key === "Enter" && handleSaveGoal()} />
              <button onClick={handleSaveGoal} className="rounded-lg p-1.5 text-pink-400 hover:bg-pink-500/10 text-sm">✓</button>
              <button onClick={() => setEditingGoal(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 text-sm">✗</button>
            </>
          ) : (
            <button onClick={() => { setGoalInput(String(weightGoal ?? "")); setEditingGoal(true); }}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-400 ring-1 ring-slate-700 transition hover:ring-pink-500 hover:text-slate-200">
              <Scale className="h-3.5 w-3.5 text-pink-400" />
              {weightGoal ? `Goal: ${weightGoal} kg` : "Set weight goal"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Scale className="h-4 w-4 text-pink-400" /> Current Weight
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {latest ? `${latest.weight} kg` : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            {change !== null && change < 0
              ? <TrendingDown className="h-4 w-4 text-green-400" />
              : <TrendingUp className="h-4 w-4 text-red-400" />}
            Last Change
          </div>
          <p className={`text-2xl font-bold ${change === null ? "text-slate-500" : change < 0 ? "text-green-400" : change === 0 ? "text-slate-400" : "text-red-400"}`}>
            {change === null ? "—" : change === 0 ? "No change" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800 p-5 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Scale className="h-4 w-4 text-indigo-400" /> Goal Progress
          </div>
          {latest && weightGoal ? (
            <p className={`text-2xl font-bold ${Math.abs(latest.weight - weightGoal) < 0.5 ? "text-green-400" : "text-slate-200"}`}>
              {(latest.weight - weightGoal).toFixed(1)} kg {latest.weight > weightGoal ? "over" : "to go"}
            </p>
          ) : (
            <p className="text-2xl font-bold text-slate-500">—</p>
          )}
        </div>
      </div>

      {/* Log weight form */}
      <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-200">
          <Plus className="h-4 w-4 text-pink-400" />
          Log Today&apos;s Weight
        </h2>
        <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
          <input type="number" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)}
            min="1" max="500" step="0.1" required
            className="flex-1 min-w-[140px] rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-pink-500" />
          <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
            className="flex-1 min-w-[160px] rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-pink-500" />
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-pink-500 px-5 py-2.5 font-semibold text-white transition hover:bg-pink-400 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving..." : "Log Weight"}
          </button>
        </form>
      </div>

      {/* Chart */}
      {loading ? (
        <SkeletonChart />
      ) : entries.length >= 2 ? (
        <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
          <h2 className="mb-4 font-semibold text-slate-100">Weight Progress</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ec4899" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false} tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<WeightTooltip />} />
              <Area type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={2}
                fill="url(#weightGrad)"
                dot={{ fill: "#ec4899", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#ec4899", stroke: "#0f172a", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Entry list */}
      <div>
        <h2 className="mb-4 font-semibold text-slate-300">All Entries</h2>
        {loading ? (
          <SkeletonList rows={4} />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-center">
            <Scale className="mb-3 h-8 w-8 text-slate-600" />
            <p className="text-slate-500">No weight entries yet. Log your first weight above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map((entry) => {
              const entryDate = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", year: "numeric",
              });
              return (
                <div key={entry.id}
                  className="group flex items-center justify-between rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50 transition hover:ring-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                      <Scale className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{entry.weight} kg</p>
                      <p className="text-sm text-slate-500">{entryDate}</p>
                      {entry.note && <p className="text-xs text-slate-600 italic">{entry.note}</p>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(entry.id!)}
                    className="rounded-lg p-2 text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WeightPage() {
  return (
    <ProtectedRoute>
      <WeightContent />
    </ProtectedRoute>
  );
}
