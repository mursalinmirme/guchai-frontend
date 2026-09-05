import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { useTasksInRange, elapsedSeconds, plannedDurationSeconds } from "@/hooks/use-tasks";
import { Trophy, Flame, Zap, Target, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/performance")({
  ssr: false,
  component: Performance,
});

function Performance() {
  const from30 = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const to = format(new Date(), "yyyy-MM-dd");
  const { data } = useTasksInRange(from30, to);
  const tasks = data ?? [];

  const daily = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map((d) => {
      const dt = tasks.filter((t) => isSameDay(new Date(t.task_date), d));
      const worked = dt.reduce((s, t) => s + elapsedSeconds(t), 0);
      const planned = dt.reduce((s, t) => s + plannedDurationSeconds(t), 0);
      const completed = dt.filter((t) => t.status === "complete").length;
      const total = dt.length;
      const score = total ? Math.round((completed / total) * 100) : 0;
      return {
        date: format(d, "d MMM"),
        hours: Math.round((worked / 3600) * 10) / 10,
        planned: Math.round((planned / 3600) * 10) / 10,
        score,
      };
    });
  }, [tasks]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = daily.length - 1; i >= 0; i--) {
      if (daily[i].hours > 0) s++;
      else break;
    }
    return s;
  }, [daily]);

  const weekTasks = tasks.filter((t) => {
    const d = new Date(t.task_date);
    return (
      d >= startOfWeek(new Date(), { weekStartsOn: 1 }) &&
      d <= endOfWeek(new Date(), { weekStartsOn: 1 })
    );
  });
  const monthTasks = tasks.filter((t) => {
    const d = new Date(t.task_date);
    return d >= startOfMonth(new Date()) && d <= endOfMonth(new Date());
  });

  const weekWorked = weekTasks.reduce((s, t) => s + elapsedSeconds(t), 0);
  const monthWorked = monthTasks.reduce((s, t) => s + elapsedSeconds(t), 0);
  const monthCompleted = monthTasks.filter((t) => t.status === "complete").length;
  const rollingScore = daily.slice(-7).reduce((s, d) => s + d.score, 0) / 7;

  return (
    <div>
      {/* ── HEADER ── */}
      <header className="min-h-14 lg:h-20 border-b border-border flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 lg:py-0 bg-bg-primary/80 backdrop-blur-md sticky top-14 lg:top-0 z-20">
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm text-text-dim">Performance</h1>
          <p className="text-base sm:text-xl font-bold tracking-tight">Motivation &amp; momentum</p>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {/* KPI cards — 2-col on mobile, 4-col on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          <Kpi
            icon={<Flame className="text-danger" />}
            label="Current streak"
            value={`${streak}d`}
            note="Consecutive days worked"
          />
          <Kpi
            icon={<Trophy className="text-warning" />}
            label="7-day score"
            value={`${Math.round(rollingScore)}%`}
            note="Rolling completion"
          />
          <Kpi
            icon={<Zap className="text-brand" />}
            label="This week"
            value={fmt(weekWorked)}
            note={`${weekTasks.length} tasks scheduled`}
          />
          <Kpi
            icon={<Target className="text-success" />}
            label="This month"
            value={fmt(monthWorked)}
            note={`${monthCompleted}/${monthTasks.length} completed`}
          />
        </div>

        {/* Area chart */}
        <div className="glass-card rounded-3xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-brand" /> Last 30 days — hours worked
            </h3>
            <p className="text-xs text-text-dim">Momentum builds one day at a time.</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={10} />
              <YAxis stroke="var(--text-dim)" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="var(--brand)"
                strokeWidth={2}
                fill="url(#hoursGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity heatmap */}
        <div className="glass-card rounded-3xl p-4 sm:p-6">
          <h3 className="font-bold mb-4">Daily completion score (last 30d)</h3>
          {/*
            Fix: grid-cols-15 / grid-cols-30 are not built-in Tailwind v4 utilities.
            HeatmapGrid uses inline CSS gridTemplateColumns for valid, responsive rendering.
          */}
          <HeatmapGrid daily={daily} />
          <div className="flex justify-between mt-3 text-[10px] text-text-dim font-mono">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card rounded-3xl p-4 sm:p-6">
          <h3 className="font-bold mb-4">Notes to yourself</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Insight
              tone="brand"
              title="Consistency beats intensity"
              body="A 30-minute daily block accumulates faster than any weekend crunch. Protect the streak."
            />
            <Insight
              tone="warning"
              title="Watch the overtime column"
              body="Frequent overtime means the plan is under-budgeting. Re-plan longer tomorrow."
            />
            <Insight
              tone="success"
              title="You're building a record"
              body="Every completed day feeds the yearly view. In 6 months you'll see the compound curve."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive heatmap: 15 cols on mobile (<640px), 30 cols on sm+
 * Uses a single grid with inline style for the mobile column count,
 * and a CSS class override for larger screens.
 */
function HeatmapGrid({ daily }: { daily: { date: string; score: number; hours: number }[] }) {
  return (
    <>
      {/* Mobile: 2 rows of 15 */}
      <div className="sm:hidden space-y-1 mt-1">
        {[daily.slice(0, 15), daily.slice(15)].map((half, hi) => (
          <div
            key={hi}
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
          >
            {half.map((d, i) => {
              const c =
                d.hours === 0
                  ? "bg-white/5"
                  : d.score >= 80
                    ? "bg-success"
                    : d.score >= 50
                      ? "bg-brand"
                      : d.score >= 20
                        ? "bg-warning"
                        : "bg-danger";
              return (
                <div
                  key={i}
                  title={`${d.date} · ${d.score}% · ${d.hours}h`}
                  className={`aspect-square rounded ${c}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* sm+: single row of 30 */}
      <div
        className="hidden sm:grid gap-1"
        style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}
      >
        {daily.map((d, i) => {
          const c =
            d.hours === 0
              ? "bg-white/5"
              : d.score >= 80
                ? "bg-success"
                : d.score >= 50
                  ? "bg-brand"
                  : d.score >= 20
                    ? "bg-warning"
                    : "bg-danger";
          return (
            <div
              key={i}
              title={`${d.date} · ${d.score}% · ${d.hours}h`}
              className={`aspect-square rounded ${c}`}
            />
          );
        })}
      </div>
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-text-dim font-bold leading-tight">
          {label}
        </span>
        <div className="size-8 rounded-lg bg-white/5 grid place-items-center shrink-0">{icon}</div>
      </div>
      <p className="text-2xl sm:text-3xl font-mono font-bold">{value}</p>
      <p className="text-[11px] text-text-dim leading-snug">{note}</p>
    </div>
  );
}

function Insight({
  tone,
  title,
  body,
}: {
  tone: "brand" | "warning" | "success";
  title: string;
  body: string;
}) {
  const map = {
    brand: "border-brand/30 text-brand",
    warning: "border-warning/30 text-warning",
    success: "border-success/30 text-success",
  } as const;
  return (
    <div className={`rounded-2xl border ${map[tone]} bg-white/[0.02] p-4`}>
      <p className="text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-sm text-text-main/90 leading-relaxed">{body}</p>
    </div>
  );
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
