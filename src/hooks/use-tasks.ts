import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "@/api/task.api";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "pending" | "in_progress" | "complete";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  details: string | null;
  priority: Priority;
  status: Status;
  task_date: string; // YYYY-MM-DD
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  accumulated_seconds: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export const todayStr = () => format(new Date(), "yyyy-MM-dd");
export const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return format(d, "yyyy-MM-dd");
};

const listKey = (date: string) => ["tasks", date] as const;
const rangeKey = (from: string, to: string) => ["tasks-range", from, to] as const;

export function useTasksByDate(date: string) {
  return useQuery({
    queryKey: listKey(date),
    queryFn: async () => {
      return await taskApi.getTasksByDate(date);
    },
  });
}

export function useTasksInRange(from: string, to: string) {
  return useQuery({
    queryKey: rangeKey(from, to),
    queryFn: async () => {
      return await taskApi.getTasksInRange(from, to);
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      details?: string;
      priority: Priority;
      task_date: string;
      planned_start: string;
      planned_end: string;
    }) => {
      return await taskApi.createTask(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await taskApi.deleteTask(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/** Compute elapsed seconds for a task at time `now`. */
export function elapsedSeconds(task: Task, now: number = Date.now()): number {
  let secs = task.accumulated_seconds ?? 0;
  if (task.status === "in_progress" && task.actual_start) {
    secs += Math.max(0, Math.floor((now - new Date(task.actual_start).getTime()) / 1000));
  }
  return secs;
}

export function plannedDurationSeconds(task: Task): number {
  return Math.max(
    0,
    Math.floor(
      (new Date(task.planned_end).getTime() - new Date(task.planned_start).getTime()) / 1000,
    ),
  );
}

/** Move task between columns. Handles start/pause/complete transitions. */
export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task, newStatus }: { task: Task; newStatus: Status }) => {
      const patch: Partial<Task> = { status: newStatus };
      const now = new Date().toISOString();

      if (newStatus === "in_progress") {
        // Start timer
        if (task.status !== "in_progress") {
          patch.actual_start = now;
          if (!task.actual_start) patch.actual_start = now;
        }
        if (task.status === "complete") patch.actual_end = null;
      } else if (newStatus === "pending") {
        // Pause: accumulate
        if (task.status === "in_progress" && task.actual_start) {
          const delta = Math.floor((Date.now() - new Date(task.actual_start).getTime()) / 1000);
          patch.accumulated_seconds = (task.accumulated_seconds ?? 0) + Math.max(0, delta);
          patch.actual_start = null;
        }
        if (task.status === "complete") patch.actual_end = null;
      } else if (newStatus === "complete") {
        if (task.status === "in_progress" && task.actual_start) {
          const delta = Math.floor((Date.now() - new Date(task.actual_start).getTime()) / 1000);
          patch.accumulated_seconds = (task.accumulated_seconds ?? 0) + Math.max(0, delta);
          patch.actual_start = null;
        }
        patch.actual_end = now;
      }

      return await taskApi.updateTask(task.id, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      return await taskApi.updateTask(id, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/** Tick every second — used by any component displaying live timers. */
export function useTicker(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}

export function useTodayDashboardStats() {
  const { data } = useTasksByDate(todayStr());
  return useMemo(() => {
    const tasks = data ?? [];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "complete").length;
    const worked = tasks.reduce((s, t) => s + elapsedSeconds(t), 0);
    const planned = tasks.reduce((s, t) => s + plannedDurationSeconds(t), 0);
    const score = total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      total,
      completed,
      worked,
      planned,
      score,
      workedLabel: formatHM(worked),
      plannedLabel: formatHM(planned),
    };
  }, [data]);
}

export function formatDuration(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function formatHM(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
