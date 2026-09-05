import { authApi } from "@/api/auth.api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await authApi.signIn({ email, password });
        localStorage.setItem("token", res.token);
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      } else {
        const res = await authApi.signUp({ email, password });
        localStorage.setItem("token", res.token);
        toast.success("Account created — signing you in");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg-primary text-text-main">
      {/* ── LEFT PANEL — desktop only ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-bg-secondary/60 border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--brand)/12%,transparent_60%)] pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <Logo className="size-9" />
          <span className="text-xl font-bold tracking-tight">Guchai</span>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight leading-[1.05]">
            Plan tomorrow.
            <br />
            <span className="text-brand">Ship today.</span>
          </h1>
          <p className="text-text-dim leading-relaxed">
            A personal command center for time-boxed work — with live timers, overtime alerts, and a
            chart-driven view of everything you actually did.
          </p>
          <ul className="space-y-2 text-sm text-text-dim">
            <li className="flex items-center gap-2">
              <Zap className="size-4 text-brand shrink-0" /> Nightly planning with time boxes
            </li>
            <li className="flex items-center gap-2">
              <Zap className="size-4 text-brand shrink-0" /> Live per-task timers with overtime
              warnings
            </li>
            <li className="flex items-center gap-2">
              <Zap className="size-4 text-brand shrink-0" /> Daily → yearly performance analytics
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-text-dim">Built for one — you.</p>
      </div>

      {/* ── RIGHT PANEL — form (full width on mobile) ── */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 min-h-screen lg:min-h-0">
        {/* Mobile brand — only shown when left panel is hidden */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Logo className="size-9" />
          <span className="text-xl font-bold tracking-tight">Guchai</span>
        </div>

        <form
          onSubmit={submit}
          className="w-full max-w-sm glass-card rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-dim font-bold">
              {mode === "signin" ? "Welcome back" : "Get started"}
            </p>
            <h2 className="text-2xl font-bold mt-1">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h2>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-text-dim">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-bg-primary/60 border border-border px-3 py-2.5 sm:py-2 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-dim">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg bg-bg-primary/60 border border-border px-3 py-2.5 sm:py-2 text-sm outline-none focus:border-brand"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand text-brand-foreground py-3 sm:py-2.5 font-bold text-sm hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px]"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-xs text-text-dim hover:text-text-main py-2"
          >
            {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
