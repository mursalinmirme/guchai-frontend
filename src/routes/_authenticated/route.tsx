import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authApi } from "@/api/auth.api";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { user } = await authApi.getMe();
      return { user };
    } catch (err) {
      throw redirect({ to: "/auth" });
    }
  },
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
