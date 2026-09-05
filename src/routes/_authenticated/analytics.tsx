import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useTasksByDate,
  useTasksInRange,
  todayStr,
  elapsedSeconds,
  plannedDurationSeconds,
  type Task,
} from "@/hooks/use-tasks";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameMonth,
} from "date-fns";

export const Route = createFileRoute("/_authenticated/analytics")({
  ssr: false,
  component: Analytics,
});

type RangeKey = "day" | "week" | "month" | "year";

function Analytics() {
  const [range, setRange] = useState<RangeKey>("day");
  return (
    <div>
      {/* ── HEADER ── */}
      <header className="min-h-14 lg:h-20 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 lg:py-0 bg-bg-primary/80 backdrop-blur-md sticky top-14 lg:top-0 z-20">
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm text-text-dim">Analytics</h1>
          <p className="text-base sm:text-xl font-bold tracking-tight">Performance Report</p>
        </div>
        {/* Range toggle — wraps on very small screens */}
        <div className="flex flex-wrap gap-1 bg-white/5 rounded-full p-1 shrink-0">
          {(["day", "week", "month", "year"] as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition ${
                range === r
                  ? "bg-brand text-brand-foreground"
                  : "text-text-dim hover:text-text-main"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {range === "day" && <DayView />}
        {range === "week" && <WeekView />}
        {range === "month" && <MonthView />}
        {range === "year" && <YearView />}
      </div>
    </div>
  );
}

const BRAND = "var(--brand)";
const DANGER = "var(--danger)";
const SUCCESS = "var(--success)";
const MUTED = "var(--text-dim)";
const ACCENT = "var(--accent)";

function classifyTask(t: Task) {
  const elapsed = elapsedSeconds(t);
  const planned = plannedDurationSeconds(t);
  if (t.status === "complete") {
    if (planned === 0) return "onTime";
    if (elapsed <= planned) return "onTime";
    return "overtime";
  }
  if (t.status === "in_progress") return "inProgress";
  if (t.actual_start || t.accumulated_seconds > 0) return "partial";
  return "skipped";
}

function DayView() {
  const { data } = useTasksByDate(todayStr());
  const tasks = data ?? [];

  const perTask = tasks.map((t) => ({
    name: t.title.length > 18 ? t.title.slice(0, 16) + "…" : t.title,
    planned: Math.round(plannedDurationSeconds(t) / 60),
    actual: Math.round(elapsedSeconds(t) / 60),
    priority: t.priority,
  }));

  const totals = tasks.reduce(
    (a, t) => {
      const k = classifyTask(t);
      a[k] = (a[k] ?? 0) + 1;
      return a;
    },
    { onTime: 0, overtime: 0, skipped: 0, partial: 0, inProgress: 0 } as Record<string, number>,
  );

  const pieData = [
    { name: "On time", value: totals.onTime, color: SUCCESS },
    { name: "Overtime", value: totals.overtime, color: DANGER },
    { name: "In progress", value: totals.inProgress, color: BRAND },
    { name: "Partial", value: totals.partial, color: ACCENT },
    { name: "Skipped", value: totals.skipped, color: MUTED },
  ].filter((d) => d.value > 0);

  const worked = tasks.reduce((s, t) => s + elapsedSeconds(t), 0);
  const planned = tasks.reduce((s, t) => s + plannedDurationSeconds(t), 0);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* KPI row — 2-per-row on mobile/tablet, 4-per-row on desktop */}
      <KpiCard
        className="col-span-6 lg:col-span-3"
        label="Total tasks"
        value={String(tasks.length)}
      />
      <KpiCard
        className="col-span-6 lg:col-span-3"
        label="Completed"
        value={String(totals.onTime + totals.overtime)}
        accent="text-success"
      />
      <KpiCard
        className="col-span-6 lg:col-span-3"
        label="Overtime"
        value={String(totals.overtime)}
        accent="text-danger"
      />
      <KpiCard
        className="col-span-6 lg:col-span-3"
        label="Skipped"
        value={String(totals.skipped)}
        accent="text-text-dim"
      />

      {/* Bar chart — full width on mobile/tablet, 8/12 on desktop */}
      <ChartCard title="Planned vs Actual (minutes)" className="col-span-12 lg:col-span-8">
        {perTask.length === 0 ? (
          <Empty message="No tasks for today yet." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={perTask}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke={MUTED} fontSize={11} />
              <YAxis stroke={MUTED} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="planned" fill={ACCENT} radius={[6, 6, 0, 0]} name="Planned" />
              <Bar dataKey="actual" fill={BRAND} radius={[6, 6, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Pie chart — full width on mobile/tablet, 4/12 on desktop */}
      <ChartCard title="Outcome mix" className="col-span-12 lg:col-span-4">
        {pieData.length === 0 ? (
          <Empty message="Nothing to summarize yet." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Time totals — always full width */}
      <ChartCard title="Time totals" className="col-span-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-2">
          <TotalStat label="Total worked" value={fmt(worked)} accent="text-brand" />
          <TotalStat label="Total planned" value={fmt(planned)} accent="text-accent" />
          <TotalStat
            label="Overtime accrued"
            value={fmt(
              tasks.reduce((s, t) => {
                const e = elapsedSeconds(t),
                  p = plannedDurationSeconds(t);
                return s + Math.max(0, e - p);
              }, 0),
            )}
            accent="text-danger"
          />
          <TotalStat
            label="Utilization"
            value={planned ? Math.round((worked / planned) * 100) + "%" : "—"}
            accent="text-success"
          />
        </div>
      </ChartCard>
    </div>
  );
}

function WeekView() {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  const { data } = useTasksInRange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
  const days = eachDayOfInterval({ start, end });
  const rows = useMemo(
    () =>
      days.map((d) => {
        const dayTasks = (data ?? []).filter((t) => isSameDay(new Date(t.task_date), d));
        return {
          day: format(d, "EEE"),
          planned:
            Math.round((dayTasks.reduce((s, t) => s + plannedDurationSeconds(t), 0) / 3600) * 10) /
            10,
          worked:
            Math.round((dayTasks.reduce((s, t) => s + elapsedSeconds(t), 0) / 3600) * 10) / 10,
          completed: dayTasks.filter((t) => t.status === "complete").length,
        };
      }),
    [data, days],
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Bar chart — full width on mobile/tablet, 8/12 on desktop */}
      <ChartCard title="Hours worked vs planned (this week)" className="col-span-12 lg:col-span-8">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" stroke={MUTED} fontSize={11} />
            <YAxis stroke={MUTED} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="planned" fill={ACCENT} radius={[6, 6, 0, 0]} name="Planned h" />
            <Bar dataKey="worked" fill={BRAND} radius={[6, 6, 0, 0]} name="Worked h" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Line chart — full width on mobile/tablet, 4/12 on desktop */}
      <ChartCard title="Tasks completed" className="col-span-12 lg:col-span-4">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={rows}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" stroke={MUTED} fontSize={11} />
            <YAxis stroke={MUTED} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="completed"
              stroke={SUCCESS}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function MonthView() {
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  const { data } = useTasksInRange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
  const days = eachDayOfInterval({ start, end });
  const rows = days.map((d) => {
    const dayTasks = (data ?? []).filter((t) => isSameDay(new Date(t.task_date), d));
    return {
      day: format(d, "d"),
      worked: Math.round((dayTasks.reduce((s, t) => s + elapsedSeconds(t), 0) / 3600) * 10) / 10,
      completed: dayTasks.filter((t) => t.status === "complete").length,
    };
  });
  return (
    <ChartCard title={`Hours per day (${format(start, "MMMM yyyy")})`} className="col-span-12">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="day" stroke={MUTED} fontSize={11} />
          <YAxis stroke={MUTED} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="worked" fill={BRAND} radius={[4, 4, 0, 0]} name="Hours worked" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function YearView() {
  const start = startOfYear(new Date());
  const end = endOfYear(new Date());
  const { data } = useTasksInRange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
  const months = eachMonthOfInterval({ start, end });
  const rows = months.map((m) => {
    const monthTasks = (data ?? []).filter((t) => isSameMonth(new Date(t.task_date), m));
    return {
      month: format(m, "MMM"),
      worked: Math.round(monthTasks.reduce((s, t) => s + elapsedSeconds(t), 0) / 3600),
      completed: monthTasks.filter((t) => t.status === "complete").length,
    };
  });
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Each chart takes full width on mobile, half on md+ */}
      <ChartCard title="Hours worked (year)" className="col-span-12 md:col-span-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" stroke={MUTED} fontSize={11} />
            <YAxis stroke={MUTED} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="worked" fill={BRAND} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Tasks completed (year)" className="col-span-12 md:col-span-6">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={rows}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" stroke={MUTED} fontSize={11} />
            <YAxis stroke={MUTED} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="completed"
              stroke={SUCCESS}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--surface-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text-main)",
};

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass-card rounded-3xl p-4 sm:p-6 ${className ?? ""}`}>
      <h3 className="text-sm font-bold text-text-dim mb-4">{title}</h3>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-4 sm:p-5 ${className ?? ""}`}>
      <p className="text-[10px] uppercase tracking-widest text-text-dim font-bold">{label}</p>
      <p className={`text-2xl sm:text-3xl font-mono font-bold mt-1 ${accent ?? "text-text-main"}`}>
        {value}
      </p>
    </div>
  );
}

function TotalStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-dim font-bold">{label}</p>
      <p className={`text-2xl font-mono font-bold mt-1 ${accent ?? "text-text-main"}`}>{value}</p>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="h-[320px] grid place-items-center text-sm text-text-dim">{message}</div>;
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
