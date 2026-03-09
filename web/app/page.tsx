import Link from "next/link";
import { Activity, Utensils, Dumbbell, History, ArrowRight, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Utensils,
    title: "Log Your Diet",
    description: "Track every meal with automatic calorie calculation.",
    href: "/log/diet",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Dumbbell,
    title: "Track Exercises",
    description: "Log workouts and monitor your training sessions.",
    href: "/log/exercise",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: TrendingUp,
    title: "View Progress",
    description: "Visualize your weekly calorie and workout trends.",
    href: "/dashboard",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: History,
    title: "Daily History",
    description: "Review past logs and track your consistency.",
    href: "/history",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex flex-col items-center py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
          <Activity className="h-10 w-10 text-green-400" />
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-100 md:text-6xl">
          Fit<span className="text-green-400">Log</span>
        </h1>
        <p className="mb-2 text-xl font-medium text-slate-300">
          Your minimal fitness tracker
        </p>
        <p className="mb-10 max-w-md text-slate-500">
          Log your diet and workouts, calculate calories automatically, and track your progress — all in one clean interface.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-semibold text-slate-950 transition-all hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/20"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/log/diet"
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-semibold text-slate-300 ring-1 ring-slate-700 transition-all hover:bg-slate-700 hover:text-slate-100"
          >
            Log a Meal
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="w-full max-w-4xl pb-20">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
          Everything you need
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, href, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 rounded-xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 transition-all hover:bg-slate-800 hover:ring-slate-600 hover:shadow-xl"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
              <ArrowRight className={`mt-auto h-4 w-4 ${color} opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1`} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
