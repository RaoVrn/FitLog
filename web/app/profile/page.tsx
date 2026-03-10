"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Flame,
  Zap,
  Scale,
  Pencil,
  Check,
  X,
  ShieldCheck,
  CalendarDays,
  LogOut,
  Ruler,
  Cake,
  Activity,
  Heart,
  Dumbbell,
  Trophy,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getLatestWeight } from "@/services/weightService";
import { getLogs } from "@/services/logService";
import { getWorkoutStreak } from "@/services/logService";
import { calculateBMR, calculateTDEE, calculateBMI, getBMICategory } from "@/utils/calorieCalculator";
import { WeightEntry } from "@/types";
import type { Gender, ActivityLevel } from "@/types";
import toast from "react-hot-toast";

function getInitials(displayName?: string | null, email?: string | null): string {
  if (displayName) {
    return displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email?.[0] ?? "?").toUpperCase();
}

// ── Editable number / text field ──────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  icon: React.ElementType;
  iconClass?: string;
  bgClass?: string;
  value: string | number;
  unit?: string;
  inputType?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  onSave: (val: string) => Promise<void>;
  readOnly?: boolean;
  hint?: string;
}

function EditableField({
  label,
  icon: Icon,
  iconClass = "text-green-400",
  bgClass = "bg-green-500/10",
  value,
  unit,
  inputType = "text",
  min,
  max,
  placeholder,
  onSave,
  readOnly = false,
  hint,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => { setInput(String(value)); }, [value]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(input); setEditing(false); } finally { setSaving(false); }
  };

  const handleCancel = () => { setInput(String(value)); setEditing(false); };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          {editing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                autoFocus
                type={inputType}
                value={input}
                min={min}
                max={max}
                placeholder={placeholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
                className="w-40 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-100 ring-1 ring-slate-600 focus:outline-none focus:ring-green-500"
              />
              {unit && <span className="text-xs text-slate-500">{unit}</span>}
            </div>
          ) : (
            <p className="truncate font-semibold text-slate-100">
              {value}
              {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
            </p>
          )}
          {hint && !editing && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-500 disabled:opacity-50 transition">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={handleCancel} className="rounded-lg bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600 transition">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition">
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Select field ──────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  icon: React.ElementType;
  iconClass?: string;
  bgClass?: string;
  value: string;
  options: { value: string; label: string }[];
  hint?: string;
  onSave: (val: string) => Promise<void>;
}

function SelectField({ label, icon: Icon, iconClass = "text-green-400", bgClass = "bg-green-500/10", value, options, hint, onSave }: SelectFieldProps) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelected(value); }, [value]);

  const displayLabel = options.find((o) => o.value === selected)?.label ?? selected;

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(selected); setEditing(false); } finally { setSaving(false); }
  };

  const handleCancel = () => { setSelected(value); setEditing(false); };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          {editing ? (
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select
                  autoFocus
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="appearance-none rounded-lg bg-slate-700 pl-3 pr-8 py-1.5 text-sm text-slate-100 ring-1 ring-slate-600 focus:outline-none focus:ring-green-500 cursor-pointer"
                >
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          ) : (
            <p className="truncate font-semibold text-slate-100">{displayLabel || "Not set"}</p>
          )}
          {hint && !editing && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-green-600 p-1.5 text-white hover:bg-green-500 disabled:opacity-50 transition">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={handleCancel} className="rounded-lg bg-slate-700 p-1.5 text-slate-300 hover:bg-slate-600 transition">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Read-only stat tile ───────────────────────────────────────────────────────

function StatTile({ label, value, sub, iconClass = "text-green-400", bgClass = "bg-green-500/10", icon: Icon }: {
  label: string; value: string | number; sub?: string;
  iconClass?: string; bgClass?: string; icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function ProfileContent() {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingStats(true);
      try {
        const [w, s, logs] = await Promise.all([
          getLatestWeight(user.uid),
          getWorkoutStreak(user.uid),
          getLogs(user.uid, 365),
        ]);
        setLatestWeight(w);
        setStreak(s);
        setTotalLogs(logs.length);
      } finally {
        setLoadingStats(false);
      }
    };
    load();
  }, [user]);

  const displayName =
    userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";
  const email = user?.email ?? "";
  const calorieGoal = userProfile?.calorieGoal ?? 2000;
  const calorieBurnGoal = userProfile?.calorieBurnGoal ?? 0;
  const weightGoal = userProfile?.weightGoal ?? 0;
  const age = userProfile?.age ?? 0;
  const heightCm = userProfile?.heightCm ?? 0;
  const gender = userProfile?.gender ?? "";
  const activityLevel = userProfile?.activityLevel ?? "";

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  // Computed fitness metrics
  const currentWeight = latestWeight?.weight ?? 0;
  const canComputeBMR = age > 0 && heightCm > 0 && currentWeight > 0 && !!gender;
  const bmr = canComputeBMR
    ? calculateBMR(currentWeight, heightCm, age, gender as Gender)
    : null;
  const tdee = bmr && activityLevel ? calculateTDEE(bmr, activityLevel) : null;
  const bmi = currentWeight > 0 && heightCm > 0 ? calculateBMI(currentWeight, heightCm) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  // Weight progress toward goal
  const weightDiff =
    weightGoal > 0 && currentWeight > 0
      ? Math.abs(currentWeight - weightGoal).toFixed(1)
      : null;
  const weightDirection =
    weightGoal > 0 && currentWeight > 0
      ? currentWeight > weightGoal ? "to lose" : currentWeight < weightGoal ? "to gain" : "at goal!"
      : null;

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSaveName = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) { toast.error("Name cannot be empty"); return; }
    if (trimmed.length > 40) { toast.error("Name too long (max 40 chars)"); return; }
    await updateProfile({ displayName: trimmed });
    toast.success("Display name updated!");
  };

  const handleSaveCalorieGoal = async (val: string) => {
    const n = parseInt(val);
    if (!n || n < 500 || n > 10000) { toast.error("Enter a valid goal (500–10000 kcal)"); return; }
    await updateProfile({ calorieGoal: n });
    toast.success("Calorie goal updated!");
  };

  const handleSaveBurnGoal = async (val: string) => {
    const n = parseInt(val);
    if (!val.trim() || isNaN(n) || n < 0 || n > 5000) {
      toast.error("Enter a valid burn goal (0–5000 kcal)"); return;
    }
    await updateProfile({ calorieBurnGoal: n });
    toast.success("Calorie burn goal updated!");
  };

  const handleSaveWeightGoal = async (val: string) => {
    const n = parseFloat(val);
    if (!val.trim() || isNaN(n) || n <= 0 || n > 500) {
      toast.error("Enter a valid weight goal (0–500 kg)"); return;
    }
    await updateProfile({ weightGoal: n });
    toast.success("Weight goal updated!");
  };

  const handleSaveAge = async (val: string) => {
    const n = parseInt(val);
    if (!n || n < 5 || n > 120) { toast.error("Enter a valid age (5–120)"); return; }
    await updateProfile({ age: n });
    toast.success("Age updated!");
  };

  const handleSaveHeight = async (val: string) => {
    const n = parseFloat(val);
    if (!n || n < 50 || n > 300) { toast.error("Enter a valid height (50–300 cm)"); return; }
    await updateProfile({ heightCm: n });
    toast.success("Height updated!");
  };

  const handleSaveGender = async (val: string) => {
    await updateProfile({ gender: val as Gender });
    toast.success("Gender updated!");
  };

  const handleSaveActivity = async (val: string) => {
    await updateProfile({ activityLevel: val as ActivityLevel });
    toast.success("Activity level updated!");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // ── options ───────────────────────────────────────────────────────────────

  const genderOptions = [
    { value: "male",   label: "Male" },
    { value: "female", label: "Female" },
    { value: "other",  label: "Other / Prefer not to say" },
  ];

  const activityOptions = [
    { value: "sedentary",  label: "Sedentary (little or no exercise)" },
    { value: "light",      label: "Lightly Active (1–3 days/week)" },
    { value: "moderate",   label: "Moderately Active (3–5 days/week)" },
    { value: "active",     label: "Very Active (6–7 days/week)" },
    { value: "very_active",label: "Extremely Active (athlete / physical job)" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Avatar Card (full width) ── */}
        <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-slate-800 px-8 py-7 ring-1 ring-slate-700/50 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-green-500/10 to-transparent" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-2xl font-bold text-green-400 ring-2 ring-green-500/40">
            {getInitials(userProfile?.displayName || user?.displayName, user?.email)}
          </div>
          <div>
            <h1 className="text-lg font-bold capitalize text-slate-100">{displayName}</h1>
            <p className="text-sm text-slate-400">{email}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-700/60 px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">Member since {memberSince}</span>
            </div>
            {!loadingStats && streak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 ring-1 ring-orange-500/20">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-semibold text-orange-400">{streak}-day streak</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Stats Row (full width) ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50 text-center">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <p className="text-lg font-bold text-slate-100">{loadingStats ? "—" : streak}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">Day Streak</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50 text-center">
            <Activity className="h-5 w-5 text-blue-400" />
            <p className="text-lg font-bold text-slate-100">{loadingStats ? "—" : totalLogs}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">Days Logged</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50 text-center">
            <Scale className="h-5 w-5 text-pink-400" />
            <p className="text-lg font-bold text-slate-100">
              {loadingStats ? "—" : currentWeight > 0 ? `${currentWeight} kg` : "—"}
            </p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">Current Weight</p>
          </div>
        </div>

        {/* ── 2-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Body Stats + Fitness Metrics ── */}
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Body Stats</h2>
              <div className="space-y-3">
                <EditableField
                  label="Age"
                  icon={Cake}
                  iconClass="text-cyan-400"
                  bgClass="bg-cyan-500/10"
                  value={age > 0 ? age : "—"}
                  unit={age > 0 ? "yrs" : undefined}
                  inputType="number"
                  min={5}
                  max={120}
                  placeholder="25"
                  hint="Used to calculate BMR & TDEE"
                  onSave={handleSaveAge}
                />
                <EditableField
                  label="Height"
                  icon={Ruler}
                  iconClass="text-indigo-400"
                  bgClass="bg-indigo-500/10"
                  value={heightCm > 0 ? heightCm : "—"}
                  unit={heightCm > 0 ? "cm" : undefined}
                  inputType="number"
                  min={50}
                  max={300}
                  placeholder="175"
                  hint="Used to calculate BMI & BMR"
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
                  hint="Used to estimate your daily energy expenditure"
                  onSave={handleSaveActivity}
                />
              </div>
            </section>

            {(canComputeBMR || bmi) && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fitness Metrics</h2>
                  <span className="text-xs text-slate-600">Auto-calculated</span>
                </div>
                <div className="space-y-3">
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
                  {bmi && bmiCat && (
                    <StatTile
                      label="Body Mass Index (BMI)"
                      value={`${bmi}`}
                      sub={bmiCat.label}
                      icon={Scale}
                      iconClass={bmiCat.color}
                      bgClass="bg-slate-700/50"
                    />
                  )}
                  {weightDiff && weightDirection && (
                    <StatTile
                      label="Weight Goal Progress"
                      value={`${weightDiff} kg ${weightDirection}`}
                      sub={`Goal: ${weightGoal} kg · Current: ${currentWeight} kg`}
                      icon={Trophy}
                      iconClass="text-purple-400"
                      bgClass="bg-purple-500/10"
                    />
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: Account + Goals + Security + Sign Out ── */}
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Account</h2>
              <div className="space-y-3">
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
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Goals</h2>
              <div className="space-y-3">
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
                  value={calorieBurnGoal > 0 ? calorieBurnGoal : "—"}
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
                  value={weightGoal > 0 ? weightGoal : "—"}
                  unit={weightGoal > 0 ? "kg" : undefined}
                  inputType="number"
                  min={1}
                  max={500}
                  placeholder="70"
                  hint="Your target body weight"
                  onSave={handleSaveWeightGoal}
                />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Security</h2>
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Authentication</p>
                  <p className="font-semibold text-slate-100">
                    {user?.providerData?.[0]?.providerId === "google.com" ? "Google Account" : "Email & Password"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user?.providerData?.[0]?.providerId === "google.com"
                      ? "Signed in via Google OAuth"
                      : "Password managed through Firebase Auth"}
                  </p>
                </div>
              </div>
            </section>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
