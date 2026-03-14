"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Scale, Plus, Trash2, TrendingDown, TrendingUp, Loader2, ChevronDown, Pencil, Check, X,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { logWeight, getWeights, deleteWeight, updateWeight } from "@/services/weightService";
import { WeightEntry } from "@/types";
import { SkeletonChart, SkeletonList } from "@/components/Skeleton";
import toast from "react-hot-toast";

type SortOption = "newest" | "oldest" | "heaviest" | "lightest";
type FilterOption = "all" | "7days" | "30days" | "90days";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function WeightTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-bold text-pink-400">{payload[0].value} kg</p>
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
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [entriesOpen, setEntriesOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editNote, setEditNote] = useState("");

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [dropdownOpen]);

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
      const id = await logWeight(user.uid, { weight: val, date: today, note: note.trim() || undefined });
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

  const startEdit = (entry: WeightEntry) => {
    setEditingId(entry.id!);
    setEditWeight(String(entry.weight));
    setEditNote(entry.note ?? "");
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (id: string) => {
    if (!user) return;
    const val = parseFloat(editWeight);
    if (isNaN(val) || val <= 0 || val > 500) {
      toast.error("Enter a valid weight (0–500 kg).");
      return;
    }
    try {
      await updateWeight(user.uid, id, { weight: val, note: editNote.trim() || undefined });
      setEntries((prev) =>
        prev.map((e) => e.id === id ? { ...e, weight: val, note: editNote.trim() || undefined } : e)
      );
      setEditingId(null);
      toast.success("Entry updated.");
    } catch {
      toast.error("Failed to update entry.");
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

  const filteredSortedEntries = useMemo(() => {
    let list = [...entries];
    // filter
    if (filterBy !== "all") {
      const days = filterBy === "7days" ? 7 : filterBy === "30days" ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      list = list.filter((e) => e.date >= cutoffStr);
    }
    // sort
    switch (sortBy) {
      case "newest":   list.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "oldest":   list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "heaviest": list.sort((a, b) => b.weight - a.weight); break;
      case "lightest": list.sort((a, b) => a.weight - b.weight); break;
    }
    return list;
  }, [entries, sortBy, filterBy]);

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest first", oldest: "Oldest first",
    heaviest: "Heaviest first", lightest: "Lightest first",
  };
  const filterLabels: Record<FilterOption, string> = {
    all: "All time", "7days": "Last 7 days",
    "30days": "Last 30 days", "90days": "Last 90 days",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/15 ring-1 ring-pink-500/30">
            <Scale className="h-4 w-4 text-pink-400" />
          </div>
          <div>
            <h1 className="select-none text-xl font-bold text-slate-100">Weight Tracker</h1>
            <p className="select-none text-xs text-slate-500">Monitor your weight progress over time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input autoFocus type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                placeholder="kg goal"
                className="w-24 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-100 ring-1 ring-slate-600 focus:outline-none focus:ring-pink-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveGoal(); if (e.key === "Escape") setEditingGoal(false); }} />
              <button onClick={handleSaveGoal} className="rounded-lg bg-pink-500 p-1.5 text-white hover:bg-pink-400"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditingGoal(false)} className="rounded-lg bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => { setGoalInput(String(weightGoal ?? "")); setEditingGoal(true); }}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-700 transition hover:ring-pink-500 hover:text-slate-200">
              <Scale className="h-3 w-3 text-pink-400" />
              {weightGoal ? `Goal: ${weightGoal} kg` : "Set weight goal"}
              <Pencil className="h-3 w-3 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-3">
        <div className="rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Scale className="h-3.5 w-3.5 text-pink-400" /> Current Weight
          </div>
          <p className="text-xl font-bold text-slate-100">{latest ? `${latest.weight} kg` : "—"}</p>
        </div>
        <div className="rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            {change !== null && change < 0
              ? <TrendingDown className="h-3.5 w-3.5 text-green-400" />
              : <TrendingUp className="h-3.5 w-3.5 text-red-400" />}
            Last Change
          </div>
          <p className={`text-xl font-bold ${change === null ? "text-slate-500" : change < 0 ? "text-green-400" : change === 0 ? "text-slate-400" : "text-red-400"}`}>
            {change === null ? "—" : change === 0 ? "±0 kg" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Scale className="h-3.5 w-3.5 text-indigo-400" /> Goal Progress
          </div>
          {latest && weightGoal ? (
            <p className={`text-xl font-bold ${Math.abs(latest.weight - weightGoal) < 0.5 ? "text-green-400" : "text-slate-200"}`}>
              {latest.weight <= weightGoal
                ? `${(weightGoal - latest.weight).toFixed(1)} kg to go`
                : `${(latest.weight - weightGoal).toFixed(1)} kg over`}
            </p>
          ) : (
            <p className="text-xl font-bold text-slate-500">—</p>
          )}
        </div>
      </div>

      {/* Log form + chart side by side on larger screens */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Log weight form */}
        <div className="lg:col-span-2 rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
            <Plus className="h-3.5 w-3.5 text-pink-400" /> Log Today&apos;s Weight
          </h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-2">
            <input type="number" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)}
              min="1" max="500" step="0.1" required
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-pink-500" />
            <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-pink-500" />
            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Log Weight"}
            </button>
          </form>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="lg:col-span-3"><SkeletonChart /></div>
        ) : entries.length >= 2 ? (
          <div className="lg:col-span-3 rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">Weight Progress</h2>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ec4899" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip content={<WeightTooltip />} />
                <Area type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={2}
                  fill="url(#weightGrad)"
                  dot={{ fill: "#ec4899", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "#ec4899", stroke: "#0f172a", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="lg:col-span-3 flex items-center justify-center rounded-xl border border-dashed border-slate-700 p-6 text-center">
            <p className="text-xs text-slate-500">Log at least 2 entries to see the chart.</p>
          </div>
        )}
      </div>

      {/* Entry list */}
      <div className="rounded-xl bg-slate-800 ring-1 ring-slate-700/50 overflow-hidden">
        {/* Accordion header */}
        <div
          className="flex cursor-pointer items-center justify-between px-4 py-3 select-none"
          onClick={() => setEntriesOpen((o) => !o)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${entriesOpen ? "rotate-180" : ""}`} />
            All Entries
            {entries.length > 0 && (
              <span className="text-xs text-slate-500 font-normal">({filteredSortedEntries.length})</span>
            )}
          </div>
          {entriesOpen && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-700/60 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-600 transition hover:ring-slate-500 hover:text-slate-200"
              >
                {filterLabels[filterBy]} · {sortLabels[sortBy]}
                <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-80 rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-xl">
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Filter</p>
                      {(["all", "7days", "30days", "90days"] as FilterOption[]).map((f) => (
                        <button key={f} onClick={() => { setFilterBy(f); setDropdownOpen(false); }}
                          className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition hover:bg-slate-700 ${filterBy === f ? "text-pink-400 font-medium" : "text-slate-300"}`}>
                          {filterLabels[f]}
                        </button>
                      ))}
                    </div>
                    <div className="border-l border-slate-700 pl-1">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sort</p>
                      {(["newest", "oldest", "heaviest", "lightest"] as SortOption[]).map((s) => (
                        <button key={s} onClick={() => { setSortBy(s); setDropdownOpen(false); }}
                          className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition hover:bg-slate-700 ${sortBy === s ? "text-pink-400 font-medium" : "text-slate-300"}`}>
                          {sortLabels[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible body */}
        {entriesOpen && (
          <div className="border-t border-slate-700/50 px-3 pb-3 pt-2 max-h-80 overflow-y-auto">
            {loading ? (
              <SkeletonList rows={4} />
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Scale className="mb-2 h-7 w-7 text-slate-600" />
                <p className="text-sm text-slate-500">No weight entries yet. Log your first weight above!</p>
              </div>
            ) : filteredSortedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-slate-500">No entries match the current filter.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredSortedEntries.map((entry) => {
                  const entryDate = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  });
                  const isEditing = editingId === entry.id;
                  return (
                    <div key={entry.id}
                      className="group rounded-xl bg-slate-700/40 px-4 py-3 ring-1 ring-slate-700/50 transition hover:ring-slate-600">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            autoFocus
                            type="number" min="1" max="500" step="0.1"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            className="w-24 rounded-lg bg-slate-700 px-2 py-1 text-sm text-slate-100 outline-none ring-1 ring-pink-500"
                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(entry.id!); if (e.key === "Escape") cancelEdit(); }}
                          />
                          <input
                            type="text" placeholder="Note (optional)"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="flex-1 min-w-[120px] rounded-lg bg-slate-700 px-2 py-1 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 focus:ring-pink-500"
                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(entry.id!); if (e.key === "Escape") cancelEdit(); }}
                          />
                          <div className="flex gap-1 ml-auto">
                            <button onClick={() => handleSaveEdit(entry.id!)}
                              className="rounded-lg p-1.5 text-green-400 hover:bg-green-500/10">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={cancelEdit}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
                              <Scale className="h-4 w-4 text-pink-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-100">{entry.weight} kg</p>
                              <p className="text-xs text-slate-500">{entryDate}</p>
                              {entry.note && <p className="text-xs text-slate-500 italic">{entry.note}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                            <button onClick={() => startEdit(entry)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-500/10 hover:text-blue-400">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(entry.id!)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
