import Link from "next/link";
import {
  Activity, Utensils, Dumbbell, History, ArrowRight, TrendingUp,
  Zap, Shield, BarChart3, CheckCircle2, Scale, Target,
} from "lucide-react";

const features = [
  {
    icon: Utensils,
    title: "Log Your Diet",
    description: "Search from a built-in food database to track every meal with automatic calorie & macro breakdowns.",
    href: "/log/diet",
    color: "text-green-400",
    bg: "bg-green-500/10",
    accent: "group-hover:border-green-500/30",
  },
  {
    icon: Dumbbell,
    title: "Track Exercises",
    description: "Log workouts with sets, reps and duration. Build a complete history of your training sessions.",
    href: "/log/exercise",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    accent: "group-hover:border-blue-500/30",
  },
  {
    icon: TrendingUp,
    title: "View Progress",
    description: "Interactive weekly charts for calories, macros and workout volume — all in one dashboard.",
    href: "/dashboard",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    accent: "group-hover:border-purple-500/30",
  },
  {
    icon: Scale,
    title: "Weight Tracking",
    description: "Log your body weight over time and watch your trend line move towards your goal.",
    href: "/weight",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    accent: "group-hover:border-cyan-500/30",
  },
  {
    icon: Target,
    title: "Calorie Goals",
    description: "Set profile targets and get a personalised daily calorie budget that updates in real-time.",
    href: "/profile",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    accent: "group-hover:border-rose-500/30",
  },
  {
    icon: History,
    title: "Daily History",
    description: "Browse any past day — food, exercise, calories and macros — all in one clean timeline.",
    href: "/history",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    accent: "group-hover:border-orange-500/30",
  },
];

const stats = [
  { value: "100+", label: "Foods in database" },
  { value: "20+",  label: "Exercise types" },
  { value: "7-day", label: "Progress charts" },
  { value: "100%", label: "Free to use" },
];

const highlights = [
  { icon: Zap,          label: "Instant calorie calc" },
  { icon: Shield,       label: "Private & secure" },
  { icon: BarChart3,    label: "Visual progress" },
  { icon: CheckCircle2, label: "Free forever" },
];

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up for free in seconds — no credit card, no nonsense.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    ring: "ring-green-500/25",
  },
  {
    step: "02",
    title: "Set your goals",
    description: "Enter your details and we'll calculate your personalised daily calorie target.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/25",
  },
  {
    step: "03",
    title: "Log daily & improve",
    description: "Track meals and workouts every day. Charts and insights build themselves.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    ring: "ring-purple-500/25",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative flex w-full flex-col items-center px-4 pb-20 pt-6 text-center">
        {/* Layered background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-green-500/[0.07] blur-[130px]" />
          <div className="absolute left-1/3 top-20 h-[280px] w-[360px] rounded-full bg-emerald-400/[0.04] blur-[90px]" />
        </div>

        {/* Heading */}
        <h1 className="mb-5 text-6xl font-extrabold tracking-tight text-slate-100 md:text-8xl">
          Fit<span className="text-green-400">Log</span>
        </h1>

        <p className="mb-3 text-xl font-semibold text-slate-200 md:text-2xl">
          Your minimal fitness tracker
        </p>
        <p className="mb-10 max-w-lg text-base leading-relaxed text-slate-400">
          Log your diet and workouts, calculate calories automatically,
          and watch your progress — all in one clean, fast interface.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-xl bg-green-500 px-8 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-400 hover:shadow-green-500/40"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>

        {/* Trust strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {highlights.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-slate-500">
              <Icon className="h-3.5 w-3.5 text-green-500/70" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────── */}
      <section className="w-full max-w-3xl px-4 pb-20">
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-700/60 overflow-hidden rounded-2xl ring-1 ring-slate-700/60 sm:grid-cols-4 sm:divide-y-0">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 bg-slate-800/40 px-6 py-6 text-center">
              <span className="text-3xl font-extrabold text-slate-100">{value}</span>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ────────────────────────────── */}
      <section className="w-full max-w-4xl px-4 pb-20">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Everything you need
          </p>
          <h2 className="text-2xl font-bold text-slate-100 md:text-3xl">
            One app for your whole fitness routine
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, href, color, bg, accent }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 transition-all duration-300 hover:bg-slate-800/80 hover:shadow-xl ${accent}`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg} ring-1 ring-white/5`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-100">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${color} opacity-0 transition-all duration-200 group-hover:opacity-100`}>
                <span>Go to {title.split(" ").slice(-1)[0]}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="w-full max-w-4xl px-4 pb-20">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Simple workflow
          </p>
          <h2 className="text-2xl font-bold text-slate-100 md:text-3xl">
            Up and running in minutes
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ step, title, description, color, bg, ring }) => (
            <div
              key={step}
              className="relative flex flex-col gap-4 rounded-xl border border-slate-700/50 bg-slate-800/50 p-6"
            >
              {/* Step number */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bg} ring-1 ${ring} text-sm font-extrabold ${color}`}>
                {step}
              </div>
              <div>
                <p className="font-semibold text-slate-100">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────── */}
      <section className="w-full max-w-4xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/50 p-10 text-center">
          {/* Corner glows */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-green-500/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-green-500/[0.06] blur-3xl" />

          <div className="relative z-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/25">
              <Activity className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-slate-100 md:text-3xl">
              Ready to start your journey?
            </h2>
            <p className="mb-8 max-w-sm mx-auto text-slate-500">
              Join FitLog today and take control of your health — completely free, always.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="flex items-center gap-2 rounded-xl bg-green-500 px-8 py-3.5 font-bold text-slate-950 shadow-lg shadow-green-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-400 hover:shadow-green-500/30"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl px-8 py-3.5 font-semibold text-slate-400 transition-colors hover:text-slate-200"
              >
                Sign in →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
