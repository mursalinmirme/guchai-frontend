import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Settings2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Zap, 
  Coffee,
  CalendarDays,
  Loader2
} from "lucide-react";
import { robotApi, RobotNotification, UserPreferences } from "@/api/robot.api";
import { toast } from "sonner";
import { RobotPreferences } from "./robot-preferences";

interface RobotNotificationsProps {
  onClose: () => void;
}

export function RobotNotifications({ onClose }: RobotNotificationsProps) {
  const [activeTab, setActiveTab] = useState<"inbox" | "settings">("inbox");
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["robot_notifications"],
    queryFn: robotApi.getNotifications,
    refetchInterval: 30000, // Poll every 30s
  });

  const markReadMut = useMutation({
    mutationFn: robotApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["robot_notifications"] });
    },
  });

  const dismissMut = useMutation({
    mutationFn: robotApi.dismissNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["robot_notifications"] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: robotApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["robot_notifications"] });
      toast.success("All caught up!");
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "DEADLINE_APPROACHING": return <Clock className="size-4 text-warning" />;
      case "TASK_OVERDUE": return <AlertCircle className="size-4 text-danger" />;
      case "HIGH_PRIORITY_TASK": return <Zap className="size-4 text-brand" />;
      case "STALE_TASK": return <Coffee className="size-4 text-text-dim" />;
      case "DAILY_BRIEFING": return <CalendarDays className="size-4 text-success" />;
      default: return <Bell className="size-4 text-brand" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/30">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`flex-1 py-3 text-xs font-medium transition-colors ${
            activeTab === "inbox" 
              ? "text-brand border-b-2 border-brand bg-brand/5" 
              : "text-text-dim hover:text-text-main"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Bell className="size-3.5" />
            Inbox
            {notifications.filter(n => !n.read_at).length > 0 && (
              <span className="bg-brand text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {notifications.filter(n => !n.read_at).length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 text-xs font-medium transition-colors ${
            activeTab === "settings" 
              ? "text-brand border-b-2 border-brand bg-brand/5" 
              : "text-text-dim hover:text-text-main"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Settings2 className="size-3.5" />
            Preferences
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
        {activeTab === "settings" ? (
          <RobotPreferences />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                Recent Alerts
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => markAllReadMut.mutate()}
                  disabled={markAllReadMut.isPending}
                  className="text-[11px] text-brand hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <Loader2 className="size-5 animate-spin mb-2" />
                <p className="text-xs">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <CheckCircle2 className="size-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">You're all caught up!</p>
                <p className="text-xs mt-1">No new proactive insights right now.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className={`p-3 rounded-xl border transition-colors ${
                      !n.read_at 
                        ? "bg-surface border-brand/20 shadow-sm" 
                        : "bg-surface/30 border-border/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-bg-primary border border-border">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${!n.read_at ? "text-text-main" : "text-text-dim"}`}>
                          {n.title}
                        </h4>
                        <p className={`text-xs mt-1 leading-relaxed ${!n.read_at ? "text-text-dim" : "text-text-dim/70"}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-text-dim/50 mt-2">
                          {new Date(n.created_at).toLocaleString([], {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {!n.read_at && (
                          <button
                            onClick={() => markReadMut.mutate(n._id)}
                            className="p-1 rounded-md hover:bg-brand/10 text-brand transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissMut.mutate(n._id)}
                          className="p-1 rounded-md hover:bg-danger/10 text-text-dim hover:text-danger transition-colors"
                          title="Dismiss"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
