import { AddTaskDialog } from "@/components/add-task-dialog";
import { OvertimeMonitor } from "@/components/overtime-monitor";
import { THEMES, useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { todayStr, useTodayDashboardStats } from "@/hooks/use-tasks";
import { Logo } from "@/components/ui/logo";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planning", label: "Planning", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/performance", label: "Performance", icon: TrendingUp },
] as const;

// Shared sidebar content — used in both desktop aside and mobile Sheet
function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const stats = useTodayDashboardStats();

  const signOut = async () => {
    localStorage.removeItem("token");
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/dashboard" onClick={onNavClick} className="mb-10 flex items-center gap-3 shrink-0">
        <Logo className="size-8" />
        <span className="text-xl font-bold tracking-tight">Guchai</span>
      </Link>

      {/* Nav */}
      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-text-dim hover:bg-white/5 hover:text-text-main"
              }`}
            >
              <Icon className="size-4 shrink-0" /> {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom widgets */}
      <div className="mt-auto space-y-3">
        <div className="glass-card rounded-2xl p-4 border-brand/20">
          <div className="text-[10px] text-brand uppercase tracking-widest font-bold mb-1">
            Daily Performance
          </div>
          <div className="text-2xl font-mono font-bold">{stats.score}%</div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-brand h-full transition-all" style={{ width: `${stats.score}%` }} />
          </div>
          <p className="text-[10px] text-text-dim mt-2">
            {stats.completed}/{stats.total} tasks · {stats.workedLabel}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-dim font-bold mb-2">
            <Palette className="size-3" /> Theme
          </div>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                className={`h-7 rounded-md flex overflow-hidden ring-1 transition ${
                  theme === t.id ? "ring-brand scale-105" : "ring-border hover:ring-white/20"
                }`}
                style={{ width: 40 }}
              >
                {t.swatch.map((c, i) => (
                  <span key={i} className="flex-1 block" style={{ background: c }} />
                ))}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-dim hover:text-text-main hover:bg-white/5"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const stats = useTodayDashboardStats();

  return (
    <div className="min-h-screen bg-bg-primary text-text-main selection:bg-brand/30 pb-16 lg:pb-0">
      <OvertimeMonitor />

      {/* ─── DESKTOP SIDEBAR — unchanged at lg+ ─── */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:flex lg:flex-col border-r border-border bg-bg-secondary/60 p-6 z-30">
        <SidebarContent />
      </aside>

      {/* ─── MOBILE HEADER BAR — only visible below lg ─── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 border-b border-border bg-bg-primary/90 backdrop-blur-md">
        {/* Left: Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo className="size-7" />
          <span className="text-base font-bold tracking-tight">Guchai</span>
        </Link>

        {/* Right: Compressed Stats */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-brand uppercase tracking-widest leading-none mb-1">Worked</span>
            <span className="text-xs font-mono font-medium leading-none">{stats.workedLabel}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-brand uppercase tracking-widest leading-none mb-1">Planned</span>
            <span className="text-xs font-mono font-medium leading-none">{stats.plannedLabel}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-brand uppercase tracking-widest leading-none mb-1">Tasks</span>
            <span className="text-xs font-mono font-medium leading-none">{stats.total}</span>
          </div>
        </div>
      </header>

      {/* ─── MOBILE SIDEBAR SHEET ─── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] bg-bg-secondary border-r border-border p-6 flex flex-col"
        >
          {/* Hidden close button is built into SheetContent via Radix */}
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ─── MAIN CONTENT ─── */}
      {/* lg:pl-64 preserves exact desktop layout; mobile has no left padding */}
      <main className="lg:pl-64">{children}</main>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 border-t border-border bg-bg-primary/90 backdrop-blur-md px-1 pb-[env(safe-area-inset-bottom)]">
        {nav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-all ${
                active ? "text-brand" : "text-text-dim hover:text-text-main"
              }`}
            >
              <Icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium text-text-dim hover:text-text-main transition-all"
        >
          <Menu className="size-5" />
          <span className="truncate">More</span>
        </button>
      </nav>
    </div>
  );
}
