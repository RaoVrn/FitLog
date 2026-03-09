import { Dumbbell, Trash2, Timer, Repeat, Pencil, Loader2 } from "lucide-react";
import { Exercise } from "@/types";

interface ExerciseItemProps {
  exercise: Exercise;
  onDelete?: (id: string) => void;
  onEdit?:   (exercise: Exercise) => void;
  deleting?: boolean;
}

export default function ExerciseItem({ exercise, onDelete, onEdit, deleting }: ExerciseItemProps) {
  return (
    <div className="group flex items-center justify-between rounded-lg bg-slate-800/80 p-3 border-2 border-slate-700/60 transition hover:bg-slate-800 hover:border-slate-600">
      {/* Left: icon + info */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <Dumbbell className="h-4 w-4 text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{exercise.name}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {exercise.sets && exercise.reps && (
              <span className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                {exercise.sets} sets × {exercise.reps} reps
              </span>
            )}
            {exercise.duration && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {exercise.duration} min
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: kcal + actions */}
      <div className="flex shrink-0 items-center gap-1">
        {exercise.caloriesBurned ? (
          <span className="mr-2 text-xs font-medium text-orange-400">
            -{exercise.caloriesBurned} kcal
          </span>
        ) : null}
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          {onEdit && exercise.id && (
            <button
              onClick={() => onEdit(exercise)}
              className="rounded p-1.5 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && exercise.id && (
            <button
              onClick={() => !deleting && onDelete(exercise.id!)}
              disabled={deleting}
              className="rounded p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            >
              {deleting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
