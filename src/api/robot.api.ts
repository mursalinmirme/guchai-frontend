import { apiClient } from "./client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolExecution {
  tool: string;
  args: Record<string, any>;
  result: { success: boolean; data?: any; error?: string };
  label: string;
}

export interface ChatResponse {
  reply: string;
  toolExecutions: ToolExecution[];
}

export interface RobotMemory {
  _id: string;
  user_id: string;
  content: string;
  type: string;
  created_at: string;
}

export interface RobotNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  metadata: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface UserPreferences {
  timezone?: string;
  proactiveEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  deadlineReminders?: boolean;
  overdueReminders?: boolean;
  highPriorityReminders?: boolean;
  dailyBriefing?: boolean;
  dailyBriefingTime?: string;
  dailyReviewReminder?: boolean;
  dailyReviewTime?: string;
  weeklyReviewReminder?: boolean;
  voiceEnabled?: boolean;
}

export const robotApi = {
  chat: async (messages: ChatMessage[]): Promise<ChatResponse> => {
    const response = await apiClient.post("/robot/chat", { messages });
    return response.data;
  },

  getStatus: async () => {
    const response = await apiClient.get("/robot/status");
    return response.data;
  },

  getMemories: async (): Promise<RobotMemory[]> => {
    const response = await apiClient.get("/robot/memories");
    return response.data;
  },

  deleteMemory: async (id: string): Promise<void> => {
    await apiClient.delete(`/robot/memories/${id}`);
  },

  clearMemories: async (): Promise<void> => {
    await apiClient.delete("/robot/memories");
  },

  // ─────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────

  getNotifications: async (): Promise<RobotNotification[]> => {
    const response = await apiClient.get("/robot/notifications");
    return response.data;
  },

  markNotificationRead: async (id: string): Promise<void> => {
    await apiClient.post(`/robot/notifications/${id}/read`);
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.post("/robot/notifications/read-all");
  },

  dismissNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/robot/notifications/${id}`);
  },

  // ─────────────────────────────────────────────────────────────
  // Preferences
  // ─────────────────────────────────────────────────────────────

  getPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient.get("/robot/preferences");
    return response.data;
  },

  updatePreferences: async (prefs: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await apiClient.put("/robot/preferences", prefs);
    return response.data;
  },
};
