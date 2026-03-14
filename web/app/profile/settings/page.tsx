"use client";

import { useEffect, useState } from "react";
import { Flame, LogOut, Scale, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { EditableField } from "@/components/profile/ProfileFields";
import ProfileSectionTabs from "@/components/profile/ProfileSectionTabs";
import { useAuth } from "@/hooks/useAuth";
import { getLatestWeight } from "@/services/weightService";
import { calculateBMR, calculateTDEE } from "@/utils/calorieCalculator";
import type { Gender } from "@/types";

function ProfileSettingsContent() {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [currentWeight, setCurrentWeight] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadWeight = async () => {
      const weightEntry = await getLatestWeight(user.uid);
      setCurrentWeight(weightEntry?.weight ?? 0);
    };

    void loadWeight();
  }, [user]);

  const calorieGoal = userProfile?.calorieGoal ?? 2000;
  const calorieBurnGoal = userProfile?.calorieBurnGoal ?? 0;
  const weightGoal = userProfile?.weightGoal ?? 0;

  const age = userProfile?.age ?? 0;
  const heightCm = userProfile?.heightCm ?? 0;
  const gender = userProfile?.gender ?? "";
  const activityLevel = userProfile?.activityLevel ?? "";

  const bmr =
    age > 0 && heightCm > 0 && currentWeight > 0 && gender
      ? calculateBMR(currentWeight, heightCm, age, gender as Gender)
      : null;
  const tdee = bmr && activityLevel ? calculateTDEE(bmr, activityLevel) : null;

  const handleSaveCalorieGoal = async (val: string) => {
    const num = parseInt(val, 10);
    if (!num || num < 500 || num > 10000) {
      toast.error("Enter a valid calorie goal (500-10000 kcal)");
      return;
    }
    await updateProfile({ calorieGoal: num });
    toast.success("Calorie goal updated");
  };

  const handleSaveBurnGoal = async (val: string) => {
    const num = parseInt(val, 10);
    if (!val.trim() || Number.isNaN(num) || num < 0 || num > 5000) {
      toast.error("Enter a valid burn goal (0-5000 kcal)");
      return;
    }
    await updateProfile({ calorieBurnGoal: num });
    toast.success("Burn goal updated");
  };

  const handleSaveWeightGoal = async (val: string) => {
    const num = parseFloat(val);
    if (!val.trim() || Number.isNaN(num) || num <= 0 || num > 500) {
      toast.error("Enter a valid weight goal (0-500 kg)");
      return;
    }
    await updateProfile({ weightGoal: num });
    toast.success("Target weight updated");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <ProfileSectionTabs />

        {/* Goals */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Goals</h2>
          <EditableField
            label="Daily Calorie Goal"
            icon={Flame}
            iconClass="text-orange-400"
            bgClass="bg-orange-500/10"
            value={calorieGoal}
            unit="kcal"
            inputType="number"
            min={500}
            max={10000}
            placeholder="2000"
            hint={tdee ? `Your TDEE is ${tdee.toLocaleString()} kcal` : "Target calories to consume each day"}
            onSave={handleSaveCalorieGoal}
          />
          <EditableField
            label="Daily Burn Goal"
            icon={Zap}
            iconClass="text-yellow-400"
            bgClass="bg-yellow-500/10"
            value={calorieBurnGoal > 0 ? calorieBurnGoal : "-"}
            unit={calorieBurnGoal > 0 ? "kcal" : undefined}
            inputType="number"
            min={0}
            max={5000}
            placeholder="500"
            hint="Target calories to burn through exercise"
            onSave={handleSaveBurnGoal}
          />
          <EditableField
            label="Target Weight"
            icon={Scale}
            iconClass="text-pink-400"
            bgClass="bg-pink-500/10"
            value={weightGoal > 0 ? weightGoal : "-"}
            unit={weightGoal > 0 ? "kg" : undefined}
            inputType="number"
            min={1}
            max={500}
            placeholder="70"
            hint="Your target body weight"
            onSave={handleSaveWeightGoal}
          />
        </section>

        {/* Security */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security</h2>
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
              <ShieldCheck className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Authentication</p>
              <p className="font-semibold text-slate-100">
                {user?.providerData?.[0]?.providerId === "google.com"
                  ? "Google Account"
                  : "Email and Password"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {user?.providerData?.[0]?.providerId === "google.com"
                  ? "Signed in via Google OAuth"
                  : "Password managed through Firebase Auth"}
              </p>
            </div>
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={() => void handleLogout()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <ProtectedRoute>
      <ProfileSettingsContent />
    </ProtectedRoute>
  );
}
