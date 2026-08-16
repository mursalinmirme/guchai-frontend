import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  useTasksByDate, useUpdateStatus, todayStr, elapsedSeconds, plannedDurationSeconds, type Task, type Status,
} from "@/hooks/use-tasks";
import { TaskCard } from "@/components/task-card";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  component: Dashboard,
});

const COLUMNS: { id: Status; label: string; accent: string }[] = [
  { id: "pending", label: "Pending", accent: "text-text-dim" },
  { id: "in_progress", label: "In Progress", accent: "text-brand" },
  { id: "complete", label: "Complete", accent: "text-success" },
];

function Dashboard() {
  const date = todayStr();
  const { data, isLoading } = useTasksByDate(date);
  const update = useUpdateStatus();
  const [dragOver, setDragOver] = useState<Status | null>(null);

  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = { pending: [], in_progress: [], complete: [] };
    (data ?? []).forEach((t) => g[t.status].push(t));
    return g;
  }, [data]);

  const totalWorked = (data ?? []).reduce((s, t) => s + elapsedSeconds(t), 0);
  const totalPlanned = (data ?? []).reduce((s, t) => s + plannedDurationSeconds(t), 0);

  const onDrop = async (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id");
    const task = (data ?? []).find((t) => t.id === id);
    if (!task || task.status === newStatus) return;
    try {
      await update.mutateAsync({ task, newStatus });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-bg-primary/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="text-sm text-text-dim">{format(new Date(), "EEEE, d MMMM")}</h1>
          <p className="text-xl font-bold tracking-tight">Today's Board</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs">
            <Stat label="Worked" value={formatShort(totalWorked)} />
            <Stat label="Planned" value={formatShort(totalPlanned)} />
            <Stat label="Tasks" value={String((data ?? []).length)} />
          </div>
          <AddTaskDialog defaultDate={date} triggerLabel="+ Plan New Task" />
        </div>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-text-dim">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading tasks…
          </div>
        ) : (data ?? []).length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {COLUMNS.map((col) => {
              const items = grouped[col.id];
              const isOver = dragOver === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
                  onDragLeave={() => setDragOver((v) => (v === col.id ? null : v))}
                  onDrop={(e) => onDrop(e, col.id)}
                  className={`rounded-2xl transition-colors p-2 -m-2 min-h-[400px] ${isOver ? "bg-brand/5 ring-1 ring-brand/30" : ""}`}
                >
                  <div className="flex items-center justify-between px-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${col.id === "in_progress" ? "bg-brand animate-pulse" : col.id === "complete" ? "bg-success" : "bg-text-dim"}`} />
                      <h2 className={`font-semibold uppercase text-xs tracking-widest ${col.accent}`}>{col.label}</h2>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${col.id === "in_progress" ? "bg-brand/10 text-brand" : col.id === "complete" ? "bg-success/10 text-success" : "bg-white/5 text-text-dim"}`}>
                      {String(items.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {items.length === 0 && (
                      <div className="text-xs text-text-dim px-3 py-8 text-center border border-dashed border-border rounded-xl">
                        Drop tasks here
                      </div>
                    )}
                    {items.map((t) => <TaskCard key={t.id} task={t} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[9px] uppercase font-bold text-text-dim tracking-widest">{label}</p>
      <p className="font-mono text-sm text-text-main">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card rounded-3xl p-16 text-center max-w-xl mx-auto mt-16">
      <div className="size-16 mx-auto rounded-2xl bg-brand/10 grid place-items-center mb-4">
        <span className="text-2xl font-black text-brand">V</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">No tasks planned for today</h2>
      <p className="text-sm text-text-dim mb-6">
        Head over to <span className="text-brand font-semibold">Planning</span> to prepare tomorrow, or plan one for right now.
      </p>
      <AddTaskDialog defaultDate={todayStr()} triggerLabel="+ Plan a task now" />
    </div>
  );
}

function formatShort(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
