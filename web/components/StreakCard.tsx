import { Flame } from "lucide-react";
import {
  getNextMilestone,
  getStreakProgress,
  getStreakStatusMessage,
} from "@/utils/streak";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export default function StreakCard({
  currentStreak,
  longestStreak,
  lastActiveDate,
}: StreakCardProps) {
  const value = `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`;
  const nextMilestone = getNextMilestone(currentStreak);
  const statusMessage = getStreakStatusMessage(currentStreak, lastActiveDate);
  const { progressPercent, progressLabel } = getStreakProgress(currentStreak);
  const milestoneCopy = nextMilestone
    ? `${Math.max(nextMilestone - currentStreak, 0)} day${
        nextMilestone - currentStreak === 1 ? "" : "s"
      } to ${nextMilestone}-day milestone`
    : "All milestones reached";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-800/60 p-6 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/10 via-cyan-400/5 to-transparent" />

      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-400/20">
              <Flame className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Streak
              </p>
              <p className="mt-1 text-sm text-slate-300">Consistency over intensity</p>
            </div>
          </div>
          <div className="hidden rounded-full bg-slate-900/50 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700/50 sm:block">
            {milestoneCopy}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">{value}</p>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">{statusMessage}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-900/45 p-4 ring-1 ring-slate-700/40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Longest streak
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{longestStreak} days</p>
            <p className="mt-1 text-sm text-slate-400">Your best consistency run so far.</p>
          </div>
          <div className="rounded-xl bg-slate-900/45 p-4 ring-1 ring-slate-700/40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Next milestone
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-100">
              {nextMilestone ? `${nextMilestone} days` : "Milestones complete"}
            </p>
            <p className="mt-1 text-sm text-slate-400">{milestoneCopy}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <span>Progress</span>
            <span>{progressLabel}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-700/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 sm:hidden">{milestoneCopy}</p>
        </div>
      </div>
    </div>
  );
}