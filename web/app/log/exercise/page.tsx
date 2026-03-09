"use client";

import { useState, useEffect } from "react";
import {
  Dumbbell, Plus, Trash2, Timer, Repeat, Flame, Loader2, CheckCircle,
  Pencil, Check, X,
} from "lucide-react";
import ExerciseItem from "@/components/ExerciseItem";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getTodayLog, saveLog, todayDateStr } from "@/services/logService";
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<EditingExercise | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const todayLog = await getTodayLog(user.uid);
        if (todayLog) setExercises(todayLog.exercises);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleTemplateSelect = (t: { name: string; caloriesBurned: number }) => {
    setExerciseName(t.name);
    setCaloriesBurned(t.caloriesBurned.toString());
  };

  const handleAdd = () => {
    if (!exerciseName.trim()) return;
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName.trim(),
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
      ...(exerciseType === "sets-reps"
        ? { sets: parseInt(sets) || 1, reps: parseInt(reps) || 1 }
        : { duration: parseInt(duration) || 1 }),
    };
    setExercises((prev) => [...prev, exercise]);
    setExerciseName(""); setCaloriesBurned(""); setSets("3"); setReps("10"); setDuration("30");
    setSaved(false);
    toast.success(`${exercise.name} added to workout.`);
  };

  const handleDelete = (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
    setSaved(false);
    if (ex) toast(`${ex.name} removed.`, { icon: "ðŸ—‘ï¸" });
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

  const handleEditSave = () => {
    if (!editing) return;
    const updated: Exercise = {
      id: editing.id,
      name: editing.name.trim(),
      caloriesBurned: editing.calories ? parseInt(editing.calories) : undefined,
      ...(editing.type === "sets-reps"
        ? { sets: parseInt(editing.sets) || 1, reps: parseInt(editing.reps) || 1 }
        : { duration: parseInt(editing.duration) || 1 }),
    };
    setExercises((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
    setSaved(false);
    toast.success(`${updated.name} updated.`);
    setEditing(null);
  };

  const totalCalsBurned = exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

  const handleSave = async () => {
    if (!user || exercises.length === 0) return;
    setSaving(true);
    try {
      const today = todayDateStr();
      const existingLog = await getTodayLog(user.uid);
      await saveLog(user.uid, {
        date: today,
        foods: existingLog?.foods ?? [],
        exercises,
        totalCalories: existingLog?.foods.reduce((s, f) => s + f.totalCalories, 0) ?? 0,
        totalBurned: exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0),
      });
      setSaved(true);
      toast.success(`Workout saved — ${exercises.length} exercise${exercises.length !== 1 ? "s" : ""} logged!`);
    } catch (err) {
      console.error("Failed to save exercises:", err);
      toast.error("Failed to save workout log.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-40 rounded bg-slate-700 animate-pulse" />
          <div className="mt-2 h-4 w-56 rounded bg-slate-700 animate-pulse" />
        </div>
        <SkeletonList rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Log Exercise</h1>
        <p className="mt-1 text-slate-400">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Quick Select */}
      <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
        <h2 className="mb-3 font-semibold text-slate-200">Quick Select</h2>
        <div className="flex flex-wrap gap-2">
          {EXERCISE_TEMPLATES.map((t) => (
            <button key={t.name} onClick={() => handleTemplateSelect(t)}
              className={`rounded-lg px-3 py-1.5 text-sm ring-1 transition ${
                exerciseName === t.name
                  ? "bg-blue-500 text-slate-950 ring-blue-500"
                  : "bg-slate-700 text-slate-300 ring-slate-600 hover:bg-slate-600"
              }`}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add Exercise */}
      <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-slate-700/50">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-200">
          <Dumbbell className="h-4 w-4 text-blue-400" />
          Add Exercise
        </h2>
        <div className="space-y-3">
          <input type="text" placeholder="Exercise name (e.g. Bench Press)"
            value={exerciseName} onChange={(e) => setExerciseName(e.target.value)}
            className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={() => setExerciseType("sets-reps")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                exerciseType === "sets-reps"
                  ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                  : "bg-slate-700 text-slate-400 hover:text-slate-200"
              }`}>
              <Repeat className="h-3.5 w-3.5" /> Sets & Reps
            </button>
            <button onClick={() => setExerciseType("duration")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                exerciseType === "duration"
                  ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
                  : "bg-slate-700 text-slate-400 hover:text-slate-200"
              }`}>
              <Timer className="h-3.5 w-3.5" /> Duration
            </button>
          </div>
          {exerciseType === "sets-reps" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Sets</label>
                <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} min="1"
                  className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Reps</label>
                <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} min="1"
                  className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Duration (minutes)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1"
                className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-slate-500">Calories burned (optional)</label>
            <div className="relative">
              <Flame className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <input type="number" placeholder="e.g. 150" value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)} min="0"
                className="w-full rounded-lg bg-slate-700 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none ring-1 ring-slate-600 transition focus:ring-blue-500" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={!exerciseName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus className="h-4 w-4" />
            Add Exercise
          </button>
        </div>
      </div>

      {/* Edit Exercise Modal */}
      {editing && (
        <div className="rounded-xl bg-slate-800 p-6 shadow-lg ring-1 ring-blue-500/50">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-400" /> Edit Exercise
            </h2>
            <button onClick={() => setEditing(null)} className="rounded p-1 text-slate-500 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-blue-500" />
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...editing, type: "sets-reps" })}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${editing.type === "sets-reps" ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30" : "bg-slate-700 text-slate-400"}`}>
                <Repeat className="h-3.5 w-3.5" /> Sets & Reps
              </button>
              <button onClick={() => setEditing({ ...editing, type: "duration" })}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${editing.type === "duration" ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30" : "bg-slate-700 text-slate-400"}`}>
                <Timer className="h-3.5 w-3.5" /> Duration
              </button>
            </div>
            {editing.type === "sets-reps" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Sets</label>
                  <input type="number" value={editing.sets} onChange={(e) => setEditing({ ...editing, sets: e.target.value })}
                    className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Reps</label>
                  <input type="number" value={editing.reps} onChange={(e) => setEditing({ ...editing, reps: e.target.value })}
                    className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-blue-500" />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs text-slate-500">Duration (minutes)</label>
                <input type="number" value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                  className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-slate-500">Calories burned</label>
              <div className="relative">
                <Flame className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <input type="number" value={editing.calories} onChange={(e) => setEditing({ ...editing, calories: e.target.value })}
                  className="w-full rounded-lg bg-slate-700 py-2.5 pl-10 pr-4 text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-blue-500" />
              </div>
            </div>
            <button onClick={handleEditSave}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 font-semibold text-white transition hover:bg-blue-400">
              <Check className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Exercise List */}
      {exercises.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-300">Today&apos;s Workout ({exercises.length})</h2>
            {totalCalsBurned > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-1.5">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="font-bold text-orange-400">-{totalCalsBurned} kcal</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <ExerciseItem key={exercise.id} exercise={exercise} onDelete={handleDelete} onEdit={handleEditStart} />
            ))}
          </div>
          <button onClick={handleSave} disabled={saving || saved}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Workout Log"}
          </button>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-center">
          <Dumbbell className="mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-500">No exercises logged today. Add one above!</p>
        </div>
      )}
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
