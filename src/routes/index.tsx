import { createFileRoute, redirect } from "@tanstack/react-router";
import { authApi } from "@/api/auth.api";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { user } = await authApi.getMe();
      throw redirect({ to: user ? "/dashboard" : "/auth" });
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => null,
});
