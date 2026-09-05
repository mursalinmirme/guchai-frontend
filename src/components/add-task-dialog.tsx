import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useCreateTask, tomorrowStr, type Priority } from "@/hooks/use-tasks";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

export function AddTaskDialog({
  defaultDate,
  triggerLabel = "Plan New Task",
  triggerClassName,
}: {
  defaultDate?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [date, setDate] = useState(defaultDate ?? tomorrowStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const create = useCreateTask();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const planned_start = new Date(`${date}T${startTime}:00`).toISOString();
    const planned_end = new Date(`${date}T${endTime}:00`).toISOString();
    if (new Date(planned_end) <= new Date(planned_start)) {
      toast.error("End time must be after start time");
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        details: details.trim() || undefined,
        priority,
        task_date: date,
        planned_start,
        planned_end,
      });
      toast.success("Task queued", {
        description: `Scheduled for ${format(new Date(planned_start), "EEE d MMM, HH:mm")}`,
      });
      setTitle("");
      setDetails("");
      setPriority("medium");
      setStartTime("09:00");
      setEndTime("10:00");
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={
            triggerClassName ??
            "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-brand-foreground font-bold text-sm hover:brightness-110 transition"
          }
        >
          <Plus className="size-4" /> {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="bg-surface-elevated border-border text-text-main sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan a task</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="Refactor auth flow"
              className="mt-1 w-full rounded-lg bg-bg-primary/60 border border-border px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
              Details
            </span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Optional notes, sub-steps, links…"
              className="mt-1 w-full rounded-lg bg-bg-primary/60 border border-border px-3 py-2 text-sm outline-none focus:border-brand resize-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg bg-bg-primary/60 border border-border px-3 py-2 text-sm outline-none focus:border-brand font-mono"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                Start
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="mt-1 w-full rounded-lg bg-bg-primary/60 border border-border px-3 py-2 text-sm font-mono outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                End
              </span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="mt-1 w-full rounded-lg bg-bg-primary/60 border border-border px-3 py-2 text-sm font-mono outline-none focus:border-brand"
              />
            </label>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
              Priority
            </span>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition ${
                    priority === p.id
                      ? "bg-brand text-brand-foreground border-brand"
                      : "bg-bg-primary/60 border-border text-text-dim hover:text-text-main"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={create.isPending}
              className="w-full rounded-full bg-brand text-brand-foreground py-2.5 font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Commit to Schedule
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
