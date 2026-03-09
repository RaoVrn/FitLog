"use client";

import { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  Scale,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/dashboard",    label: "Dashboard", icon: LayoutDashboard },
  { href: "/foods",        label: "Foods",     icon: Utensils },
  { href: "/log/diet",     label: "Log Diet",  icon: PlusCircle },
  { href: "/log/exercise", label: "Exercise",  icon: Dumbbell },
  { href: "/weight",       label: "Weight",    icon: Scale },
  { href: "/history",      label: "History",   icon: History },
];

const AUTH_PAGES = ["/login", "/signup"];

function getInitials(user: { displayName?: string | null; email?: string | null }): string {
  if (user.displayName) {
    return user.displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/login");
  };

  const Logo = (
    <Link href="/" className="flex items-center gap-2 transition-colors hover:text-green-300">
      <Activity className="h-6 w-6 text-green-400" />
      <span className="text-xl font-bold tracking-tight text-slate-100">
        Fit<span className="text-green-400">Log</span>
      </span>
    </Link>
  );

  const AuthLinks = (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={`rounded-lg px-3 py-2 text-sm transition ${
          pathname === "/login" ? "text-green-400" : "text-slate-400 hover:text-slate-100"
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
        {Logo}

        {isAuthPage || !user ? (
          AuthLinks
        ) : (
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

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 ring-1 ring-slate-700 transition hover:bg-slate-700"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                  {getInitials(user)}
                </div>
                <span className="hidden max-w-[120px] truncate text-xs text-slate-300 md:block">
                  {user.displayName || user.email}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800 py-1 shadow-2xl ring-1 ring-slate-700">
                  <div className="border-b border-slate-700 px-4 py-2.5">
                    <p className="truncate text-xs font-medium text-slate-300">
                      {user.displayName || "Account"}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

