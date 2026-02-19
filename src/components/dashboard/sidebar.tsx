"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  BarChart3,
  LineChart,
  LogOut,
  Car,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/intelligence", label: "Intelligence", icon: LineChart },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[260px] flex-col bg-[#1a2332]">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#5b8def]">
          <Car className="size-5 text-white" />
        </div>
        <div>
          <h1
            className="text-[15px] font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            FAC Engine
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
            Reactivation CRM
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Navigation */}
      <nav className="sidebar-scroll flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-[#5b8def]/[0.12] text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#5b8def]" />
              )}
              <item.icon
                className={cn(
                  "size-[18px] transition-colors",
                  isActive ? "text-[#5b8def]" : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Sign out */}
      <div className="mx-4 h-px bg-white/[0.06]" />
      <div className="p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
        >
          <LogOut className="size-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
