import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { robotApi, UserPreferences } from "@/api/robot.api";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch"; // Assuming we have standard UI components, or will build a simple toggle

// Simple toggle switch if a UI library one isn't available
function Toggle({ checked, onChange, disabled }: { checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${
        checked ? "bg-brand" : "bg-border"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${
          checked ? "translate-x-2" : "-translate-x-2"
        }`}
      />
    </button>
  );
}

export function RobotPreferences() {
  const queryClient = useQueryClient();
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["robot_preferences"],
    queryFn: robotApi.getPreferences,
  });

  useEffect(() => {
    if (prefs) {
      setLocalPrefs(prefs);
      setHasChanges(false);
    }
  }, [prefs]);

  const updateMut = useMutation({
    mutationFn: robotApi.updatePreferences,
    onSuccess: (newPrefs) => {
      queryClient.setQueryData(["robot_preferences"], newPrefs);
      setHasChanges(false);
      toast.success("Preferences updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update preferences");
    }
  });

  const handleChange = (key: keyof UserPreferences, value: any) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMut.mutate(localPrefs);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-50 h-full">
        <Loader2 className="size-5 animate-spin mb-2" />
        <p className="text-xs">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-main mb-1">Proactive Assistant</h3>
        <p className="text-xs text-text-dim mb-4">
          Allow the Robot to analyze your tasks in the background and notify you about important events.
        </p>
        
        <div className="flex items-center justify-between p-3 rounded-lg border border-brand/20 bg-brand/5 mb-4">
          <div>
            <p className="text-sm font-medium text-brand">Enable Proactive Engine</p>
            <p className="text-[10px] text-text-dim mt-0.5">Master switch for all background checks</p>
          </div>
          <Toggle 
            checked={localPrefs.proactiveEnabled ?? true} 
            onChange={(v) => handleChange("proactiveEnabled", v)} 
          />
        </div>
      </div>

      <div className={`space-y-4 transition-opacity ${localPrefs.proactiveEnabled === false ? "opacity-40 pointer-events-none" : ""}`}>
        <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider border-b border-border pb-2">
          Notifications
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-main">Deadline Reminders</span>
            <Toggle checked={localPrefs.deadlineReminders ?? true} onChange={(v) => handleChange("deadlineReminders", v)} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-main">Overdue Task Alerts</span>
            <Toggle checked={localPrefs.overdueReminders ?? true} onChange={(v) => handleChange("overdueReminders", v)} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-main">Daily Briefing</span>
            <Toggle checked={localPrefs.dailyBriefing ?? false} onChange={(v) => handleChange("dailyBriefing", v)} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-main">Daily/Weekly Review Reminders</span>
            <Toggle checked={localPrefs.dailyReviewReminder ?? true} onChange={(v) => handleChange("dailyReviewReminder", v)} />
          </div>
        </div>

        <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider border-b border-border pb-2 mt-6 mb-2">
          Schedule & Timezone
        </h3>

        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-main">Timezone</label>
            <input 
              type="text"
              value={localPrefs.timezone || "UTC"}
              onChange={(e) => handleChange("timezone", e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-brand transition-colors"
              placeholder="e.g. America/New_York"
            />
            <p className="text-[10px] text-text-dim">Uses standard IANA format. Default: UTC.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-main">Quiet Hours Start</label>
              <input 
                type="time"
                value={localPrefs.quietHoursStart || "22:00"}
                onChange={(e) => handleChange("quietHoursStart", e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-main">Quiet Hours End</label>
              <input 
                type="time"
                value={localPrefs.quietHoursEnd || "08:00"}
                onChange={(e) => handleChange("quietHoursEnd", e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-6 border-t border-border sticky bottom-0 bg-surface/30 backdrop-blur-sm pb-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMut.isPending}
          className="w-full py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/90 flex items-center justify-center gap-2"
        >
          {updateMut.isPending && <Loader2 className="size-4 animate-spin" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
