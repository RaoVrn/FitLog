import { Flame } from "lucide-react";

interface StreakBadgeProps {
  title: string;
  days: number;
  unlocked: boolean;
}

export default function StreakBadge({
  title,
  days,
  unlocked,
}: StreakBadgeProps) {
  return (
    <div
      className={`rounded-xl p-4 ring-1 transition-all duration-200 ${
        unlocked
          ? "bg-emerald-500/8 ring-emerald-400/25"
          : "bg-slate-800/45 ring-slate-700/45"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
            unlocked
              ? "bg-emerald-400/12 ring-emerald-300/20"
              : "bg-slate-900/60 ring-slate-700/50"
          }`}
        >
          <Flame
            className={`h-5 w-5 ${unlocked ? "text-emerald-300" : "text-slate-500"}`}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-semibold ${
                unlocked ? "text-slate-100" : "text-slate-300"
              }`}
            >
              {title}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                unlocked
                  ? "bg-emerald-400/12 text-emerald-200"
                  : "bg-slate-900/70 text-slate-500"
              }`}
            >
              {unlocked ? "Unlocked" : "Locked"}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {days} day milestone
          </p>
          <p className={`mt-2 text-sm ${unlocked ? "text-slate-300" : "text-slate-400"}`}>
            {unlocked
              ? "You have already cleared this consistency checkpoint."
              : "Keep logging daily activity to unlock this checkpoint."}
          </p>
        </div>
      </div>
    </div>
  );
}