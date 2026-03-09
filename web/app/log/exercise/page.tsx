"use client";

import { useState, useEffect } from "react";
import {
  Dumbbell, Plus, Timer, Repeat, Flame, Loader2, CheckCircle,
  Pencil, Check, X, Trash2, AlertCircle, Search, ChevronDown,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getTodayLog } from "@/services/logService";
import {
  addExerciseToTodayLog,
  updateExerciseInTodayLog,
  deleteExerciseFromTodayLog,
  clearAllExercisesFromTodayLog,
} from "@/services/exerciseService";
import { getUserProfile, saveUserProfile } from "@/services/userService";
import { Exercise } from "@/types";
import { SkeletonList } from "@/components/Skeleton";
import toast from "react-hot-toast";

const EXERCISE_TEMPLATES = [
  { name: "Push-ups",           caloriesBurned: 50  },
  { name: "Running (30 min)",   caloriesBurned: 300 },
  { name: "Bench Press",        caloriesBurned: 80  },
  { name: "Pull-ups",           caloriesBurned: 60  },
  { name: "Squats",             caloriesBurned: 70  },
  { name: "Plank (1 min)",      caloriesBurned: 15  },
  { name: "Cycling (30 min)",   caloriesBurned: 250 },
  { name: "Jump Rope (15 min)", caloriesBurned: 180 },
];

type ExerciseType = "sets-reps" | "duration";

interface EditingExercise {
  id: string;
  name: string;
  type: ExerciseType;
  sets: string;
  reps: string;
  duration: string;
  calories: string;
}

function LogExerciseContent() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("sets-reps");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [duration, setDuration] = useState("30");
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editing, setEditing] = useState<EditingExercise | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [search, setSearch] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [burnGoal, setBurnGoal] = useState(500);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [todayLog, profile] = await Promise.all([
          getTodayLog(user.uid),
          getUserProfile(user.uid),
        ]);
        if (todayLog) setExercises(todayLog.exercises);
        if (profile?.calorieBurnGoal) setBurnGoal(profile.calorieBurnGoal);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSaveGoal = async () => {
    const val = parseInt(goalInput);
    if (!user || isNaN(val) || val <= 0) { setEditingGoal(false); return; }
    setSavingGoal(true);
    try {
      await saveUserProfile(user.uid, { calorieBurnGoal: val });
      setBurnGoal(val);
    } finally {
      setSavingGoal(false);
      setEditingGoal(false);
    }
  };

  const handleQuickAdd = async (t: { name: string; caloriesBurned: number }) => {
    if (!user) return;
    const isDuration = /\d+\s*min/i.test(t.name);
    const existingIdx = exercises.findIndex(
      (e) => e.name.toLowerCase() === t.name.toLowerCase()
    );
    setSyncing(true);
    try {
      if (existingIdx !== -1) {
        const existing = exercises[existingIdx];
        const newCalories = (existing.caloriesBurned || 0) + t.caloriesBurned;
        const updated: Exercise = isDuration
          ? { id: existing.id, name: existing.name, duration: (existing.duration || 0) + 30, caloriesBurned: newCalories }
          : { id: existing.id, name: existing.name, sets: (existing.sets || 0) + 3, reps: existing.reps || 10, caloriesBurned: newCalories };
        await updateExerciseInTodayLog(user.uid, updated);
        setExercises((prev) => prev.map((e, i) => (i === existingIdx ? updated : e)));
        toast.success(`${t.name} updated.`);
      } else {
        const exercise: Exercise = {
          id: Date.now().toString(),
          name: t.name,
          caloriesBurned: t.caloriesBurned,
          ...(isDuration ? { duration: 30 } : { sets: 3, reps: 10 }),
        };
        await addExerciseToTodayLog(user.uid, exercise);
        setExercises((prev) => [...prev, exercise]);
        toast.success(`${t.name} added.`);
      }
      setListOpen(true);
      markSaved();
    } catch {
      toast.error("Failed to save exercise.");
    } finally {
      setSyncing(false);
    }
  };

  const markSaved = () => setSavedAt(new Date());

  // CREATE
  const handleAdd = async () => {
    if (!user || !exerciseName.trim()) return;
    const name = exerciseName.trim();
    const existingIdx = exercises.findIndex(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );

    setAdding(true); setSyncing(true);
    try {
      if (existingIdx !== -1) {
        // Merge into existing exercise — never include undefined fields
        const existing = exercises[existingIdx];
        const newCalories = caloriesBurned
          ? (existing.caloriesBurned || 0) + parseInt(caloriesBurned)
          : existing.caloriesBurned;
        const updated: Exercise =
          exerciseType === "sets-reps"
            ? {
                id: existing.id,
                name: existing.name,
                sets: (existing.sets || 0) + (parseInt(sets) || 1),
                reps: parseInt(reps) || existing.reps || 1,
                ...(newCalories !== undefined && { caloriesBurned: newCalories }),
              }
            : {
                id: existing.id,
                name: existing.name,
                duration: (existing.duration || 0) + (parseInt(duration) || 1),
                ...(newCalories !== undefined && { caloriesBurned: newCalories }),
              };
        await updateExerciseInTodayLog(user.uid, updated);
        setExercises((prev) => prev.map((e, i) => (i === existingIdx ? updated : e)));
        toast.success(`${name} updated.`);
      } else {
        // New exercise
        const exercise: Exercise = {
          id: Date.now().toString(),
          name,
          caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
          ...(exerciseType === "sets-reps"
            ? { sets: parseInt(sets) || 1, reps: parseInt(reps) || 1 }
            : { duration: parseInt(duration) || 1 }),
        };
        await addExerciseToTodayLog(user.uid, exercise);
        setExercises((prev) => [...prev, exercise]);
        toast.success(`${exercise.name} added.`);
      }
      setExerciseName(""); setCaloriesBurned(""); setSets("3"); setReps("10"); setDuration("30");
      markSaved();
    } catch {
      toast.error("Failed to save exercise.");
    } finally {
      setAdding(false); setSyncing(false);
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    if (!user) return;
    const ex = exercises.find((e) => e.id === id);
    setDeletingId(id); setSyncing(true);
    try {
      await deleteExerciseFromTodayLog(user.uid, id);
      setExercises((prev) => prev.filter((e) => e.id !== id));
      markSaved();
      if (ex) toast(`${ex.name} removed.`, { icon: "???" });
    } catch {
      toast.error("Failed to delete exercise.");
    } finally {
      setDeletingId(null); setSyncing(false); setConfirmDelete(null);
    }
  };

  const handleDeleteAllExercises = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await clearAllExercisesFromTodayLog(user.uid);
      setExercises([]);
      markSaved();
      toast.success("All exercises cleared.");
    } catch {
      toast.error("Failed to clear exercises.");
    } finally {
      setSyncing(false);
      setConfirmDeleteAll(false);
    }
  };

  const handleEditStart = (exercise: Exercise) => {
    setEditing({
      id: exercise.id!,
      name: exercise.name,
      type: exercise.duration ? "duration" : "sets-reps",
      sets: String(exercise.sets ?? 3),
      reps: String(exercise.reps ?? 10),
      duration: String(exercise.duration ?? 30),
      calories: String(exercise.caloriesBurned ?? ""),
    });
  };

  // UPDATE
  const handleEditSave = async () => {
    if (!user || !editing) return;
    const updated: Exercise = {
      id: editing.id,
      name: editing.name.trim(),
      caloriesBurned: editing.calories ? parseInt(editing.calories) : undefined,
      ...(editing.type === "sets-reps"
        ? { sets: parseInt(editing.sets) || 1, reps: parseInt(editing.reps) || 1 }
        : { duration: parseInt(editing.duration) || 1 }),
    };
    setSavingEdit(true); setSyncing(true);
    try {
      await updateExerciseInTodayLog(user.uid, updated);
      setExercises((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
      markSaved();
      toast.success(`${updated.name} updated.`);
      setEditing(null);
    } catch {
      toast.error("Failed to update exercise.");
    } finally {
      setSavingEdit(false); setSyncing(false);
    }
  };

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCalsBurned = exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

  /* -- Confirm Delete All Modal -- */
  const ConfirmDeleteAllModal = confirmDeleteAll ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onKeyDown={(e) => { if (e.key === "Escape") setConfirmDeleteAll(false); }}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); handleDeleteAllExercises(); }}
        className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700 shadow-2xl"
      >
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">Clear All Exercises</h2>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          This will remove all {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} from today&apos;s workout. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(false)}
            className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            autoFocus
            className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Clear All
          </button>
        </div>
      </form>
    </div>
  ) : null;

  /* -- Confirm Delete Modal -- */
  const ConfirmModal = confirmDelete ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onKeyDown={(e) => { if (e.key === "Escape") setConfirmDelete(null); }}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); handleDelete(confirmDelete); }}
        className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700 shadow-2xl"
      >
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">Remove Exercise</h2>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          Remove &ldquo;{exercises.find((e) => e.id === confirmDelete)?.name}&rdquo; from today&apos;s workout?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmDelete(null)}
            className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            autoFocus
            className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Remove
          </button>
        </div>
      </form>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="h-9 w-48 rounded-xl bg-slate-700 animate-pulse" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      {ConfirmDeleteAllModal}
      {ConfirmModal}

      {/* -- Header -- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/30">
            <Dumbbell className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h1 className="select-none text-xl font-bold text-slate-100">Log Exercise</h1>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {syncing && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {!syncing && savedAt && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* -- Calories Burned Strip -- */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-4 py-2.5 ring-1 ring-slate-600">
        {/* Left — total burned */}
        <div className="shrink-0">
          <span className="text-base font-bold text-slate-100">{totalCalsBurned}</span>
          <span className="ml-1 text-[11px] text-slate-500">kcal burned</span>
        </div>

        {/* Center — progress bar */}
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-2 rounded-full bg-orange-500 transition-all duration-700"
              style={{ width: totalCalsBurned > 0 ? `${Math.min((totalCalsBurned / burnGoal) * 100, 100)}%` : "0%" }}
            />
          </div>
        </div>

        {/* Right — goal + exercises */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Goal card */}
          {editingGoal ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 ring-1 ring-blue-500/60">
              <input
                autoFocus
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveGoal(); if (e.key === "Escape") setEditingGoal(false); }}
                className="w-14 bg-transparent text-sm font-bold text-slate-100 outline-none"
              />
              <span className="text-xs text-slate-400">kcal</span>
              <button onClick={handleSaveGoal} disabled={savingGoal} className="rounded bg-green-500/20 p-0.5 text-green-400 hover:bg-green-500/30">
                {savingGoal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </button>
              <button onClick={() => setEditingGoal(false)} className="rounded bg-slate-700 p-0.5 text-slate-400 hover:text-slate-200">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setGoalInput(burnGoal.toString()); setEditingGoal(true); }}
              className="group flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 ring-1 ring-slate-600 transition hover:ring-orange-500/60"
              title="Click to edit burn goal"
            >
              <div className="text-left">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Burn Goal</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-orange-400">{burnGoal}</span>
                  <span className="text-[11px] text-slate-500">kcal</span>
                </div>
              </div>
              <Pencil className="h-3 w-3 text-slate-600 transition group-hover:text-orange-400" />
            </button>
          )}

          {/* Exercises card */}
          <div className="rounded-lg bg-slate-800 px-3 py-1.5 ring-1 ring-slate-600">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Exercises</div>
            <div className="text-sm font-bold text-blue-400">{exercises.length}</div>
          </div>
        </div>
      </div>

      {/* -- Quick Add Dropdown -- */}
      <div className="rounded-xl bg-slate-800/60 ring-1 ring-slate-600 overflow-hidden">
        <button
          type="button"
          onClick={() => setQuickAddOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-2.5 transition hover:bg-slate-700/40"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Quick Add</span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-400">{EXERCISE_TEMPLATES.length} exercises</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${quickAddOpen ? "rotate-180" : ""}`} />
        </button>
        {quickAddOpen && (
          <div className="border-t border-slate-700/50 px-4 py-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full rounded-lg bg-slate-700/60 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXERCISE_TEMPLATES.filter((t) =>
                t.name.toLowerCase().includes(quickSearch.toLowerCase())
              ).map((t) => (
                <button
                  key={t.name}
                  onClick={() => { handleQuickAdd(t); setQuickSearch(""); }}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    exerciseName === t.name
                      ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                      : "border-slate-600 bg-slate-700/70 text-slate-300 hover:border-blue-500/60 hover:bg-blue-500/10 hover:text-blue-300"
                  }`}
                >
                  {t.name} <span className="text-slate-500">+{t.caloriesBurned}</span>
                </button>
              ))}
              {EXERCISE_TEMPLATES.filter((t) =>
                t.name.toLowerCase().includes(quickSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-slate-500">No exercises match &ldquo;{quickSearch}&rdquo;</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* -- Two-column layout -- */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">

        {/* LEFT — Add exercise form */}
        <div className="rounded-xl bg-slate-800 ring-1 ring-slate-600 self-start overflow-hidden">
          {/* Toggle header */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setAddFormOpen((o) => !o)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAddFormOpen((o) => !o); }}
            className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 transition hover:bg-slate-700/40"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/15">
                <Plus className="h-3.5 w-3.5 text-blue-400" />
              </span>
              Add an Exercise
            </h2>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${addFormOpen ? "rotate-180" : ""}`} />
          </div>

          {addFormOpen && (
            <div className="border-t border-slate-700/50 p-5">
          <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-3">
            <input
              type="text"
              placeholder="Exercise name (e.g. Bench Press)"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500"
            />

            {/* Type toggle */}
            <div>
              <label className="mb-1 block text-xs text-slate-500">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExerciseType("sets-reps")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition ${
                    exerciseType === "sets-reps"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Repeat className="h-3.5 w-3.5" /> Sets &amp; Reps
                </button>
                <button
                  type="button"
                  onClick={() => setExerciseType("duration")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition ${
                    exerciseType === "duration"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Timer className="h-3.5 w-3.5" /> Duration
                </button>
              </div>
            </div>

            {exerciseType === "sets-reps" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Sets</label>
                  <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} min="1"
                    className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Reps</label>
                  <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} min="1"
                    className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs text-slate-500">Duration (minutes)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1"
                  className="w-full rounded-lg bg-slate-700/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-slate-500">Calories burned (optional)</label>
              <div className="relative">
                <Flame className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-orange-400" />
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  min="0"
                  className="w-full rounded-lg bg-slate-700/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Preview */}
            {exerciseName.trim() && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2">
                <Dumbbell className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-slate-300">
                  <strong className="text-blue-400">{exerciseName}</strong>
                  {exerciseType === "sets-reps"
                    ? <> &mdash; {sets} &times; {reps}</>
                    : <> &mdash; {duration} min</>}
                  {caloriesBurned && <span className="ml-1 text-orange-400">&middot; {caloriesBurned} kcal</span>}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={!exerciseName.trim() || adding}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? "Saving..." : "Add Exercise"}
            </button>
          </form>
            </div>
          )}
        </div>

        {/* RIGHT — Today's exercises */}
        <div className="flex flex-col gap-3">

          {/* Section header — collapsible toggle */}
          <div className="overflow-hidden rounded-xl bg-slate-800/60 ring-1 ring-slate-600">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setListOpen((o) => !o)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setListOpen((o) => !o); }}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 transition hover:bg-slate-700/40"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Today&apos;s Exercises</span>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                  {exercises.length}
                </span>
                {totalCalsBurned > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 ring-1 ring-orange-500/20">
                    <Flame className="h-3 w-3 text-orange-400" />
                    <span className="text-xs font-bold text-orange-400">{totalCalsBurned} kcal</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${listOpen ? "rotate-180" : ""}`} />
              </div>
            </div>

            {listOpen && (
              <div className="border-t border-slate-700/50 px-3 pb-3 pt-2.5">
                {/* Search bar + Clear all */}
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search exercises..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg bg-slate-700/60 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500"
                    />
                  </div>
                  {exercises.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAll(true)}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  )}
                </div>

                {/* Exercise list */}
                {exercises.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-800/40 py-10 text-center ring-1 ring-slate-700/40">
                    <Dumbbell className="mb-2 h-8 w-8 text-slate-700" />
                    <p className="text-sm text-slate-500">No exercises logged today yet.</p>
                    <p className="mt-0.5 text-xs text-slate-600">Add an exercise from the form on the left</p>
                  </div>
                ) : (
                  <>
                    {filtered.length === 0 && search && (
                      <div className="rounded-lg bg-slate-800/40 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-700/40">
                        No exercises match &ldquo;{search}&rdquo;
                      </div>
                    )}
                    <div className="max-h-[420px] space-y-1.5 overflow-y-auto px-0.5 pb-0.5 [scrollbar-color:theme(colors.slate.600)_transparent] [scrollbar-width:thin]">
                {filtered.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="group flex items-center justify-between rounded-lg bg-slate-800 p-3 border-2 border-slate-700/60 transition hover:border-slate-600"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-100">{exercise.name}</p>
                      {editing && editing.id === exercise.id ? (
                        <div className="mt-1.5 space-y-2">
                          <input
                            type="text"
                            value={editing!.name}
                            onChange={(e) => setEditing({ ...editing!, name: e.target.value })}
                            className="w-full rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-blue-500"
                            autoFocus
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditing({ ...editing!, type: "sets-reps" })}
                              className={`rounded px-2 py-1 text-xs ${editing!.type === "sets-reps" ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400"}`}
                            >
                              Sets &amp; Reps
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing({ ...editing!, type: "duration" })}
                              className={`rounded px-2 py-1 text-xs ${editing!.type === "duration" ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400"}`}
                            >
                              Duration
                            </button>
                          </div>
                          {editing!.type === "sets-reps" ? (
                            <div className="flex gap-2">
                              <input type="number" value={editing!.sets} onChange={(e) => setEditing({ ...editing!, sets: e.target.value })}
                                placeholder="Sets" className="w-16 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-600" />
                              <input type="number" value={editing!.reps} onChange={(e) => setEditing({ ...editing!, reps: e.target.value })}
                                placeholder="Reps" className="w-16 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-600" />
                            </div>
                          ) : (
                            <input type="number" value={editing!.duration} onChange={(e) => setEditing({ ...editing!, duration: e.target.value })}
                              placeholder="Duration (min)" className="w-28 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-600" />
                          )}
                          <div className="relative">
                            <Flame className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-orange-400" />
                            <input type="number" value={editing!.calories} onChange={(e) => setEditing({ ...editing!, calories: e.target.value })}
                              placeholder="Calories" className="w-28 rounded bg-slate-700 py-1 pl-6 pr-2 text-xs text-slate-100 outline-none ring-1 ring-slate-600" />
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={handleEditSave} disabled={savingEdit}
                              className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-400 disabled:opacity-60">
                              {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Save
                            </button>
                            <button onClick={() => setEditing(null)}
                              className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-600">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {exercise.sets && exercise.reps && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Repeat className="h-3 w-3" />
                              {exercise.sets} sets &times; {exercise.reps} reps
                            </span>
                          )}
                          {exercise.duration && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Timer className="h-3 w-3" />
                              {exercise.duration} min
                            </span>
                          )}
                          {exercise.caloriesBurned && (
                            <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[11px] text-orange-400">
                              -{exercise.caloriesBurned} kcal
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      {editing?.id !== exercise.id && (
                        <button
                          onClick={() => handleEditStart(exercise)}
                          className="rounded-lg p-1.5 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-400"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(exercise.id!)}
                        disabled={deletingId === exercise.id}
                        className="rounded-lg p-1.5 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        {deletingId === exercise.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Workout Summary */}
          {totalCalsBurned > 0 && (
            <div className="rounded-xl bg-slate-800 p-4 ring-1 ring-slate-700/50">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                Workout Summary
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-700/50 p-3 text-center">
                  <div className="text-lg font-bold text-orange-400">{totalCalsBurned}</div>
                  <div className="text-xs text-slate-500">kcal burned</div>
                </div>
                <div className="rounded-lg bg-slate-700/50 p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">{exercises.length}</div>
                  <div className="text-xs text-slate-500">exercise{exercises.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function LogExercisePage() {
  return (
    <ProtectedRoute>
      <LogExerciseContent />
    </ProtectedRoute>
  );
}
