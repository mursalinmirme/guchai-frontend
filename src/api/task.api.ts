import { apiClient } from "./client";
import { Task } from "../hooks/use-tasks";

export const taskApi = {
  getTasksByDate: async (date: string): Promise<Task[]> => {
    const response = await apiClient.get(`/tasks?date=${date}`);
    return response.data;
  },
  getTasksInRange: async (from: string, to: string): Promise<Task[]> => {
    const response = await apiClient.get(`/tasks?from=${from}&to=${to}`);
    return response.data;
  },
  createTask: async (task: any): Promise<Task> => {
    const response = await apiClient.post("/tasks", task);
    return response.data;
  },
  updateTask: async (id: string, patch: Partial<Task>): Promise<Task> => {
    const response = await apiClient.patch(`/tasks/${id}`, patch);
    return response.data;
  },
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
