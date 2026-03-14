import StreakBadge from "@/components/StreakBadge";
import StreakCard from "@/components/StreakCard";
import { STREAK_ACHIEVEMENTS, getUnlockedAchievements } from "@/utils/streak";

interface StreakAchievementsProps {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export default function StreakAchievements({
  currentStreak,
  longestStreak,
  lastActiveDate,
}: StreakAchievementsProps) {
  const unlockedCount = getUnlockedAchievements(currentStreak).length;

  return (
    <div className="space-y-4">
      <StreakCard
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        lastActiveDate={lastActiveDate}
      />

      <div className="rounded-2xl bg-slate-800/40 p-5 ring-1 ring-slate-700/40 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Streak milestones</h2>
            <p className="mt-1 text-sm text-slate-400">
              Measured checkpoints that track consistency over time.
            </p>
          </div>
          <div className="rounded-full bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700/50">
            {unlockedCount} of {STREAK_ACHIEVEMENTS.length} unlocked
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {STREAK_ACHIEVEMENTS.map((achievement) => (
            <StreakBadge
              key={achievement.days}
              title={achievement.title}
              days={achievement.days}
              unlocked={currentStreak >= achievement.days}
            />
          ))}
        </div>
      </div>
    </div>
  );
}