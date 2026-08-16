import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { useTasksByDate, todayStr, tomorrowStr, type Task } from "@/hooks/use-tasks";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { useDeleteTask } from "@/hooks/use-tasks";

export const Route = createFileRoute("/_authenticated/planning")({
  ssr: false,
  component: Planning,
});

function Planning() {
  const [date, setDate] = useState(tomorrowStr());
  const { data, isLoading } = useTasksByDate(date);
  const del = useDeleteTask();

  const isTomorrow = date === tomorrowStr();
  const isToday = date === todayStr();
  const dateLabel = isTomorrow ? "Tomorrow" : isToday ? "Today" : format(new Date(date), "EEEE");

  return (
    <div>
      <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-bg-primary/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="text-sm text-text-dim">Nightly Planning</h1>
          <p className="text-xl font-bold tracking-tight">Design your day</p>
        </div>
        <AddTaskDialog defaultDate={date} triggerLabel="+ Add task" />
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="glass-card rounded-3xl p-6 flex items-center justify-between">
          <button
            onClick={() => setDate(format(subDays(new Date(date), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-main"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-brand font-bold">{dateLabel}</p>
            <p className="text-2xl font-bold tracking-tight mt-1">
              {format(new Date(date), "EEEE, d MMMM yyyy")}
            </p>
            <div className="flex justify-center gap-1.5 mt-3">
              <QuickButton active={isToday} onClick={() => setDate(todayStr())}>Today</QuickButton>
              <QuickButton active={isTomorrow} onClick={() => setDate(tomorrowStr())}>Tomorrow</QuickButton>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-[10px] font-mono bg-white/5 border border-border rounded-full px-3 py-1 outline-none focus:border-brand"
              />
            </div>
          </div>
          <button
            onClick={() => setDate(format(addDays(new Date(date), 1), "yyyy-MM-dd"))}
            className="p-2 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-main"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Scheduled tasks · {(data ?? []).length}</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-text-dim">
              <Loader2 className="size-4 animate-spin mr-2" /> Loading…
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-text-dim">Nothing scheduled yet. Add your first task above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(data ?? []).map((t: Task) => (
                <li key={t.id} className="flex items-center gap-4 py-3">
                  <div className="w-24 shrink-0 font-mono text-xs text-text-dim">
                    {format(new Date(t.planned_start), "HH:mm")}—{format(new Date(t.planned_end), "HH:mm")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.title}</p>
                    {t.details && <p className="text-xs text-text-dim truncate">{t.details}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-tight ${priorityBadge(t.priority)}`}>
                    {t.priority}
                  </span>
                  <button onClick={() => del.mutate(t.id)} className="p-1.5 text-text-dim hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition ${
        active ? "bg-brand text-brand-foreground" : "bg-white/5 text-text-dim hover:text-text-main"
      }`}
    >
      {children}
    </button>
  );
}

function priorityBadge(p: string) {
  return p === "urgent" ? "bg-danger/10 text-danger"
    : p === "high" ? "bg-warning/10 text-warning"
    : p === "medium" ? "bg-accent/10 text-accent"
    : "bg-white/5 text-text-dim";
}
