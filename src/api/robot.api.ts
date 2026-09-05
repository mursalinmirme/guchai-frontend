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
    const response = await apiClient.get("/robot/memory");
    return response.data;
  },

  deleteMemory: async (id: string): Promise<void> => {
    await apiClient.delete(`/robot/memory/${id}`);
  },

  clearMemories: async (): Promise<void> => {
    await apiClient.delete("/robot/memory");
  },
};
