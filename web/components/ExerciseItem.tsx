import { Dumbbell, Trash2, Timer, Repeat, Pencil } from "lucide-react";
import { Exercise } from "@/types";

interface ExerciseItemProps {
  exercise: Exercise;
  onDelete?: (id: string) => void;
  onEdit?:   (exercise: Exercise) => void;
}

export default function ExerciseItem({ exercise, onDelete, onEdit }: ExerciseItemProps) {
  return (
    <div className="group flex items-center justify-between rounded-xl bg-slate-800 p-4 shadow-lg ring-1 ring-slate-700/50 transition-all hover:ring-slate-600">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <Dumbbell className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-100">{exercise.name}</p>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            {exercise.sets && exercise.reps && (
              <span className="flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5" />
                {exercise.sets} × {exercise.reps}
              </span>
            )}
            {exercise.duration && (
              <span className="flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                {exercise.duration} min
              </span>
            )}
            {exercise.caloriesBurned && (
              <span className="text-orange-400">-{exercise.caloriesBurned} kcal</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
        {onEdit && exercise.id && (
          <button
            onClick={() => onEdit(exercise)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {onDelete && exercise.id && (
          <button
            onClick={() => onDelete(exercise.id!)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
