"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Utensils,
  Dumbbell,
  History,
  PlusCircle,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/foods", label: "Foods", icon: Utensils },
  { href: "/log/diet", label: "Log Diet", icon: PlusCircle },
  { href: "/log/exercise", label: "Exercise", icon: Dumbbell },
  { href: "/history", label: "History", icon: History },
];

const AUTH_PAGES = ["/login", "/signup"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // ── Shared logo ──────────────────────────────────────────────
  const Logo = (
    <Link
      href="/"
      className="flex items-center gap-2 transition-colors hover:text-green-300"
    >
      <Activity className="h-6 w-6 text-green-400" />
      <span className="text-xl font-bold tracking-tight text-slate-100">
        Fit<span className="text-green-400">Log</span>
      </span>
    </Link>
  );

  // ── Auth links (Sign in / Sign up) ────────────────────────────
  const AuthLinks = (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={`rounded-lg px-3 py-2 text-sm transition ${
          pathname === "/login"
            ? "text-green-400"
            : "text-slate-400 hover:text-slate-100"
        }`}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400"
      >
        Sign up
      </Link>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Left — logo */}
        {Logo}

        {/* Right — conditional content */}
        {isAuthPage || !user ? (
          // Minimal: auth pages OR logged-out visitors
          AuthLinks
        ) : (
          // Full: authenticated user
          <div className="flex items-center gap-2">
            {/* Desktop nav links */}
            <ul className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? "bg-green-500/10 text-green-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Mobile nav icons */}
            <div className="flex md:hidden items-center gap-1 mr-1">
              {navLinks.map(({ href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-lg p-2 transition-all ${
                      active ? "text-green-400" : "text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>

            {/* User pill */}
            <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 ring-1 ring-slate-700">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-[140px] truncate text-xs text-slate-400">
                {user.displayName || user.email}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
