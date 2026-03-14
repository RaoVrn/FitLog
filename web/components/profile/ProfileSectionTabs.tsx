"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Flame, HeartPulse, Settings2 } from "lucide-react";

const profileTabs = [
  { href: "/profile",          label: "Profile",  icon: Activity  },
  { href: "/profile/streaks",  label: "Streaks",  icon: Flame     },
  { href: "/profile/health",   label: "Health",   icon: HeartPulse },
  { href: "/profile/settings", label: "Settings", icon: Settings2 },
];

export default function ProfileSectionTabs() {
  const pathname = usePathname();

  return (
    <div className="rounded-xl bg-slate-800/45 p-2 ring-1 ring-slate-700/45">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {profileTabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-green-500/12 text-green-300 ring-1 ring-green-500/20"
                  : "text-slate-300 hover:bg-slate-700/60 hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
