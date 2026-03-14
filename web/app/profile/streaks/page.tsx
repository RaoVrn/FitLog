"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StreakAchievements from "@/components/StreakAchievements";
import ProfileSectionTabs from "@/components/profile/ProfileSectionTabs";
import { useAuth } from "@/hooks/useAuth";
import { getUserStats } from "@/services/userStatsService";
import { UserStats } from "@/types";

function ProfileStreaksContent() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user) return;
    void getUserStats(user.uid).then(setUserStats);
  }, [user]);

  const currentStreak = userStats?.currentStreak ?? 0;
  const longestStreak = userStats?.longestStreak ?? 0;
  const lastActiveDate = userStats?.lastActiveDate ?? "";

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <ProfileSectionTabs />
        <StreakAchievements
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          lastActiveDate={lastActiveDate}
        />
      </div>
    </div>
  );
}

export default function ProfileStreaksPage() {
  return (
    <ProtectedRoute>
      <ProfileStreaksContent />
    </ProtectedRoute>
  );
}
