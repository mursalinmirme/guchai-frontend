import { apiClient } from "./client";

export const authApi = {
  signUp: async (data: any) => {
    const response = await apiClient.post("/auth/signup", data);
    return response.data;
  },
  signIn: async (data: any) => {
    const response = await apiClient.post("/auth/signin", data);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
};
