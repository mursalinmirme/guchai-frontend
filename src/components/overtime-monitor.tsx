import { useEffect, useRef } from "react";
import {
  useTasksByDate,
  todayStr,
  elapsedSeconds,
  plannedDurationSeconds,
  type Task,
} from "@/hooks/use-tasks";
import { toast } from "sonner";

/**
 * Watches all in-progress tasks. When elapsed crosses planned duration
 * for the first time, fires:
 *   - a browser Notification (asks for permission on first mount)
 *   - a sonner toast fallback
 * Continues to tick every second; the timer keeps counting into overtime.
 */
export function OvertimeMonitor() {
  const { data } = useTasksByDate(todayStr());
  const notified = useRef<Set<string>>(new Set());
  const permissionAsked = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (permissionAsked.current) return;
    if (Notification.permission === "default") {
      permissionAsked.current = true;
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    const id = setInterval(() => {
      const tasks = data.filter((t) => t.status === "in_progress");
      const now = Date.now();
      for (const t of tasks) {
        if (notified.current.has(t.id)) continue;
        const elapsed = elapsedSeconds(t, now);
        const planned = plannedDurationSeconds(t);
        if (planned > 0 && elapsed >= planned) {
          notified.current.add(t.id);
          fireOvertime(t);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [data]);

  // Reset notified set when tasks change status back to pending/complete
  useEffect(() => {
    if (!data) return;
    const activeIds = new Set(data.filter((t) => t.status === "in_progress").map((t) => t.id));
    for (const id of Array.from(notified.current)) {
      if (!activeIds.has(id)) notified.current.delete(id);
    }
  }, [data]);

  return null;
}

function fireOvertime(task: Task) {
  const body = `"${task.title}" has exceeded its planned duration. Overtime is being tracked.`;
  toast.warning("Overtime alert", { description: body, duration: 8000 });
  try {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const n = new Notification("⚠️ Overtime Alert — Velocity", {
        body,
        icon: "/favicon.ico",
        tag: `overtime-${task.id}`,
        requireInteraction: true,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  } catch {}
}
