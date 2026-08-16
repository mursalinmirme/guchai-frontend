import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, CalendarDays, BarChart3, TrendingUp, LogOut, Palette } from "lucide-react";
import { useTheme, THEMES } from "@/components/theme-provider";
import { useTodayDashboardStats } from "@/hooks/use-tasks";
import { OvertimeMonitor } from "@/components/overtime-monitor";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planning", label: "Planning", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/performance", label: "Performance", icon: TrendingUp },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const stats = useTodayDashboardStats();

  const signOut = async () => {
    localStorage.removeItem("token");
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-main selection:bg-brand/30">
      <OvertimeMonitor />
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-bg-secondary/60 p-6 flex flex-col z-30">
        <Link to="/dashboard" className="mb-10 flex items-center gap-3">
          <div className="size-8 bg-brand rounded-lg grid place-items-center font-black text-brand-foreground">T</div>
          <span className="text-xl font-bold tracking-tight">TASKER</span>
        </Link>

        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to} to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-brand/10 text-brand" : "text-text-dim hover:bg-white/5 hover:text-text-main"
                }`}
              >
                <Icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="glass-card rounded-2xl p-4 border-brand/20">
            <div className="text-[10px] text-brand uppercase tracking-widest font-bold mb-1">Daily Performance</div>
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
                  key={t.id} onClick={() => setTheme(t.id)}
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
      </aside>

      <main className="pl-64">{children}</main>
    </div>
  );
}
