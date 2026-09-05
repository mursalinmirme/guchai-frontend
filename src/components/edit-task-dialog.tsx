import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { format } from "date-fns";
import { useUpdateTask, type Priority, type Task } from "@/hooks/use-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

export function EditTaskDialog({
  task,
  triggerClassName,
}: {
  task: Task;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [details, setDetails] = useState(task.details || "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [date, setDate] = useState(task.task_date);
  const [startTime, setStartTime] = useState(format(new Date(task.planned_start), "HH:mm"));
  const [endTime, setEndTime] = useState(format(new Date(task.planned_end), "HH:mm"));
  const update = useUpdateTask();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDetails(task.details || "");
      setPriority(task.priority);
      setDate(task.task_date);
      setStartTime(format(new Date(task.planned_start), "HH:mm"));
      setEndTime(format(new Date(task.planned_end), "HH:mm"));
    }
  }, [open, task]);

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
      await update.mutateAsync({
        id: task.id,
        patch: {
          title: title.trim(),
          details: details.trim() || null,
          priority,
          task_date: date,
          planned_start,
          planned_end,
        },
      });
      toast.success("Task updated");
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const formContent = (
    <form onSubmit={submit} className="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
          Title
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus={!isMobile}
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
      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-1/3 rounded-full bg-bg-primary/60 border border-border text-text-main py-2.5 font-bold text-sm flex items-center justify-center hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={update.isPending}
          className="flex-1 rounded-full bg-brand text-brand-foreground py-2.5 font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60"
        >
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );

  const TriggerButton = (
    <button
      className={
        triggerClassName ??
        "p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1.5 rounded-lg text-text-dim hover:text-brand hover:bg-brand/10 flex items-center justify-center"
      }
      title="Edit task"
      aria-label="Edit task"
    >
      <Pencil className="size-3.5" />
    </button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="bg-surface-elevated border-border text-text-main">
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit Task</DrawerTitle>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent className="bg-surface-elevated border-border text-text-main sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
