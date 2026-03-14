"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, Mail, Scale, Trophy, User } from "lucide-react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EditableField, getInitials } from "@/components/profile/ProfileFields";
import ProfileSectionTabs from "@/components/profile/ProfileSectionTabs";
import { useAuth } from "@/hooks/useAuth";
import { getLogs } from "@/services/logService";
import { getUserStats } from "@/services/userStatsService";
import { getLatestWeight } from "@/services/weightService";
import { UserStats, WeightEntry } from "@/types";

function ProfileOverviewContent() {
  const { user, userProfile, updateProfile } = useAuth();

  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoadingStats(true);
      try {
        const [weightEntry, stats, logs] = await Promise.all([
          getLatestWeight(user.uid),
          getUserStats(user.uid),
          getLogs(user.uid, 365),
        ]);
        setLatestWeight(weightEntry);
        setUserStats(stats);
        setTotalLogs(logs.length);
      } finally {
        setLoadingStats(false);
      }
    };

    void load();
  }, [user]);

  const displayName =
    userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";
  const email = user?.email ?? "";
  const currentWeight = latestWeight?.weight ?? 0;
  const currentStreak = userStats?.currentStreak ?? 0;

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  const handleSaveName = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) { toast.error("Name cannot be empty"); return; }
    if (trimmed.length > 40) { toast.error("Name too long (max 40 chars)"); return; }
    await updateProfile({ displayName: trimmed });
    toast.success("Display name updated");
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Avatar card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-800 px-8 py-7 text-center ring-1 ring-slate-700/50">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-green-500/10 to-transparent" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-2xl font-bold text-green-400 ring-2 ring-green-500/40">
              {getInitials(userProfile?.displayName || user?.displayName, user?.email)}
            </div>
            <div>
              <h1 className="text-lg font-bold capitalize text-slate-100">{displayName}</h1>
              <p className="text-sm text-slate-400">{email}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-slate-700/60 px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">Member since {memberSince}</span>
            </div>
          </div>
        </div>

        <ProfileSectionTabs />

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-800/60 p-4 text-center ring-1 ring-slate-700/50">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <p className="text-lg font-bold text-slate-100">{loadingStats ? "-" : currentStreak}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Current Streak</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-800/60 p-4 text-center ring-1 ring-slate-700/50">
            <Activity className="h-5 w-5 text-blue-400" />
            <p className="text-lg font-bold text-slate-100">{loadingStats ? "-" : totalLogs}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Days Logged</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-800/60 p-4 text-center ring-1 ring-slate-700/50">
            <Scale className="h-5 w-5 text-pink-400" />
            <p className="text-lg font-bold text-slate-100">
              {loadingStats ? "-" : currentWeight > 0 ? `${currentWeight} kg` : "-"}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Current Weight</p>
          </div>
        </div>

        {/* Account section */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account</h2>
          <EditableField
            label="Display Name"
            icon={User}
            iconClass="text-purple-400"
            bgClass="bg-purple-500/10"
            value={displayName}
            placeholder="Your name"
            hint="Shown in greetings and across the app"
            onSave={handleSaveName}
          />
          <EditableField
            label="Email Address"
            icon={Mail}
            iconClass="text-slate-400"
            bgClass="bg-slate-700/50"
            value={email}
            readOnly
            hint="Email cannot be changed here"
            onSave={async () => {}}
          />
        </section>

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileOverviewContent />
    </ProtectedRoute>
  );
}
