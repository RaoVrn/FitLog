"use client";

import { useEffect, useState } from "react";
import { Cake, Dumbbell, Flame, Heart, Ruler, Scale, Trophy, Zap } from "lucide-react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  EditableField,
  SelectField,
  StatTile,
} from "@/components/profile/ProfileFields";
import ProfileSectionTabs from "@/components/profile/ProfileSectionTabs";
import { useAuth } from "@/hooks/useAuth";
import { getLatestWeight, logWeight } from "@/services/weightService";
import {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  getBMICategory,
} from "@/utils/calorieCalculator";
import { WeightEntry } from "@/types";
import type { ActivityLevel, Gender } from "@/types";

function ProfileHealthContent() {
  const { user, userProfile, updateProfile } = useAuth();
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadWeight = async () => {
      const weightEntry = await getLatestWeight(user.uid);
      setLatestWeight(weightEntry);
    };

    void loadWeight();
  }, [user]);

  const age = userProfile?.age ?? 0;
  const heightCm = userProfile?.heightCm ?? 0;
  const gender = userProfile?.gender ?? "";
  const activityLevel = userProfile?.activityLevel ?? "";
  const weightGoal = userProfile?.weightGoal ?? 0;
  const currentWeight = latestWeight?.weight ?? 0;

  const canComputeBMR = age > 0 && heightCm > 0 && currentWeight > 0 && !!gender;
  const bmr = canComputeBMR
    ? calculateBMR(currentWeight, heightCm, age, gender as Gender)
    : null;
  const tdee = bmr && activityLevel ? calculateTDEE(bmr, activityLevel) : null;
  const bmi = currentWeight > 0 && heightCm > 0 ? calculateBMI(currentWeight, heightCm) : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const weightDiff =
    weightGoal > 0 && currentWeight > 0
      ? Math.abs(currentWeight - weightGoal).toFixed(1)
      : null;

  const weightDirection =
    weightGoal > 0 && currentWeight > 0
      ? currentWeight > weightGoal
        ? "to lose"
        : currentWeight < weightGoal
          ? "to gain"
          : "at goal"
      : null;

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other / Prefer not to say" },
  ];

  const activityOptions = [
    { value: "sedentary", label: "Sedentary (little or no exercise)" },
    { value: "light", label: "Lightly Active (1-3 days/week)" },
    { value: "moderate", label: "Moderately Active (3-5 days/week)" },
    { value: "active", label: "Very Active (6-7 days/week)" },
    {
      value: "very_active",
      label: "Extremely Active (athlete / physical job)",
    },
  ];

  const handleSaveAge = async (val: string) => {
    const num = parseInt(val, 10);
    if (!num || num < 5 || num > 120) {
      toast.error("Enter a valid age (5-120)");
      return;
    }

    await updateProfile({ age: num });
    toast.success("Age updated");
  };

  const handleSaveHeight = async (val: string) => {
    const num = parseFloat(val);
    if (!num || num < 50 || num > 300) {
      toast.error("Enter a valid height (50-300 cm)");
      return;
    }

    await updateProfile({ heightCm: num });
    toast.success("Height updated");
  };

  const handleSaveGender = async (val: string) => {
    await updateProfile({ gender: val as Gender });
    toast.success("Biological sex updated");
  };

  const handleSaveActivity = async (val: string) => {
    await updateProfile({ activityLevel: val as ActivityLevel });
    toast.success("Activity level updated");
  };

  const handleSaveWeight = async (val: string) => {
    if (!user) return;
    const num = parseFloat(val);
    if (!val.trim() || Number.isNaN(num) || num <= 0 || num > 500) {
      toast.error("Enter a valid weight (1-500 kg)");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    await logWeight(user.uid, { weight: num, date: today });
    setLatestWeight({ id: "", userId: user.uid, weight: num, date: today } as WeightEntry);
    toast.success("Current weight logged");
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <ProfileSectionTabs />

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Body Stats
          </h2>
          <EditableField
            label="Age"
            icon={Cake}
            iconClass="text-cyan-400"
            bgClass="bg-cyan-500/10"
            value={age > 0 ? age : "-"}
            unit={age > 0 ? "yrs" : undefined}
            inputType="number"
            min={5}
            max={120}
            placeholder="25"
            hint="Used to calculate BMR and TDEE"
            onSave={handleSaveAge}
          />
          <EditableField
            label="Height"
            icon={Ruler}
            iconClass="text-indigo-400"
            bgClass="bg-indigo-500/10"
            value={heightCm > 0 ? heightCm : "-"}
            unit={heightCm > 0 ? "cm" : undefined}
            inputType="number"
            min={50}
            max={300}
            placeholder="175"
            hint="Used to calculate BMI and BMR"
            onSave={handleSaveHeight}
          />
          <SelectField
            label="Biological Sex"
            icon={Heart}
            iconClass="text-rose-400"
            bgClass="bg-rose-500/10"
            value={gender}
            options={genderOptions}
            hint="Used for accurate BMR calculation"
            onSave={handleSaveGender}
          />
          <SelectField
            label="Activity Level"
            icon={Dumbbell}
            iconClass="text-green-400"
            bgClass="bg-green-500/10"
            value={activityLevel}
            options={activityOptions}
            hint="Used to estimate daily energy expenditure"
            onSave={handleSaveActivity}
          />
              <EditableField
                label="Current Weight"
                icon={Scale}
                iconClass="text-pink-400"
                bgClass="bg-pink-500/10"
                value={currentWeight > 0 ? currentWeight : "-"}
                unit={currentWeight > 0 ? "kg" : undefined}
                inputType="number"
                min={1}
                max={500}
                placeholder="70"
                hint="Saves to your weight log and unlocks health metrics"
                onSave={handleSaveWeight}
              />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fitness Metrics
            </h2>
            <span className="text-xs text-slate-600">Auto-calculated</span>
          </div>

          {bmr && (
            <StatTile
              label="Basal Metabolic Rate"
              value={`${bmr.toLocaleString()} kcal`}
              sub="Calories burned at complete rest"
              icon={Flame}
              iconClass="text-orange-400"
              bgClass="bg-orange-500/10"
            />
          )}

          {tdee && (
            <StatTile
              label="Total Daily Expenditure"
              value={`${tdee.toLocaleString()} kcal`}
              sub="Estimated calories burned per day"
              icon={Zap}
              iconClass="text-yellow-400"
              bgClass="bg-yellow-500/10"
            />
          )}

          {bmi && bmiCategory && (
            <StatTile
              label="Body Mass Index (BMI)"
              value={`${bmi}`}
              sub={bmiCategory.label}
              icon={Scale}
              iconClass={bmiCategory.color}
              bgClass="bg-slate-700/50"
            />
          )}

          {weightDiff && weightDirection && (
            <StatTile
              label="Weight Goal Progress"
              value={`${weightDiff} kg ${weightDirection}`}
              sub={`Goal: ${weightGoal} kg | Current: ${currentWeight} kg`}
              icon={Trophy}
              iconClass="text-purple-400"
              bgClass="bg-purple-500/10"
            />
          )}

          {!bmr && !tdee && !bmi && !weightDiff && (
            <div className="rounded-xl bg-slate-800/50 p-4 text-sm text-slate-400 ring-1 ring-slate-700/50">
              Add age, height, current weight, and activity level to unlock your health metrics.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ProfileHealthPage() {
  return (
    <ProtectedRoute>
      <ProfileHealthContent />
    </ProtectedRoute>
  );
}
