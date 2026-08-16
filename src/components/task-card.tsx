import { useState, useEffect } from "react";
import {
  elapsedSeconds, formatDuration, plannedDurationSeconds, useUpdateStatus, useDeleteTask,
  type Task, type Status,
} from "@/hooks/use-tasks";
import { format } from "date-fns";
import { Trash2, Play, Pause, Check, RotateCcw, GripVertical } from "lucide-react";
import { toast } from "sonner";

const priorityStyle: Record<Task["priority"], string> = {
  low: "bg-text-dim/10 text-text-dim",
  medium: "bg-accent/10 text-accent",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

export function TaskCard({ task }: { task: Task }) {
  const [, setTick] = useState(0);
  const update = useUpdateStatus();
  const del = useDeleteTask();

  const isRunning = task.status === "in_progress";
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const elapsed = elapsedSeconds(task);
  const planned = plannedDurationSeconds(task);
  const isOvertime = isRunning && planned > 0 && elapsed > planned;
  const progressPct = planned > 0 ? Math.min(100, (elapsed / planned) * 100) : 0;

  const changeStatus = async (newStatus: Status) => {
    try {
      await update.mutateAsync({ task, newStatus });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/task-id", task.id);
    e.dataTransfer.setData("text/from-status", task.status);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`glass-card rounded-2xl p-5 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all animate-fade-up group relative ${
        isOvertime ? "border-danger/40 overtime-pulse" : ""
      } ${task.status === "complete" ? "opacity-70" : ""}`}
    >
      <GripVertical className="absolute top-2 right-2 size-3.5 text-text-dim opacity-0 group-hover:opacity-100" />

      <div className="flex justify-between items-start mb-3 gap-2">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${priorityStyle[task.priority]}`}>
          {task.priority}
        </span>
        <span className="text-[10px] font-mono text-text-dim">
          {format(new Date(task.planned_start), "HH:mm")} — {format(new Date(task.planned_end), "HH:mm")}
        </span>
      </div>

      <h3 className={`font-semibold text-base leading-snug mb-1.5 ${task.status === "complete" ? "line-through text-text-dim" : ""}`}>
        {task.title}
      </h3>
      {task.details && (
        <p className="text-xs text-text-dim line-clamp-2 mb-3">{task.details}</p>
      )}

      {(isRunning || elapsed > 0) && (
        <div className={`bg-bg-primary/50 rounded-xl p-3 border ${isOvertime ? "border-danger/30" : "border-border"}`}>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[9px] uppercase font-bold text-text-dim">Elapsed</p>
              <p className={`text-xl font-mono font-bold ${isOvertime ? "text-danger timer-glow-danger" : "text-brand timer-glow"}`}>
                {formatDuration(elapsed)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold text-text-dim">Target</p>
              <p className={`text-xs font-mono ${isOvertime ? "text-danger" : "text-text-dim"}`}>
                {formatDuration(planned)}
              </p>
              {isOvertime && (
                <p className="text-[10px] font-mono font-bold text-danger">+{formatDuration(elapsed - planned)}</p>
              )}
            </div>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isOvertime ? "bg-danger" : "bg-brand"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-3">
        {task.status === "pending" && (
          <button onClick={() => changeStatus("in_progress")}
            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition flex items-center justify-center gap-1">
            <Play className="size-3" /> Start
          </button>
        )}
        {task.status === "in_progress" && (
          <>
            <button onClick={() => changeStatus("pending")}
              className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg bg-white/5 text-text-dim hover:bg-white/10 transition flex items-center justify-center gap-1">
              <Pause className="size-3" /> Pause
            </button>
            <button onClick={() => changeStatus("complete")}
              className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition flex items-center justify-center gap-1">
              <Check className="size-3" /> Done
            </button>
          </>
        )}
        {task.status === "complete" && (
          <button onClick={() => changeStatus("pending")}
            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg bg-white/5 text-text-dim hover:bg-white/10 transition flex items-center justify-center gap-1">
            <RotateCcw className="size-3" /> Reopen
          </button>
        )}
        <button
          onClick={() => del.mutate(task.id)}
          className="p-1.5 rounded-lg text-text-dim hover:text-danger hover:bg-danger/10"
          title="Delete task"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
