import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "midnight" | "ember" | "forest" | "violet" | "paper";

export const THEMES: { id: ThemeName; label: string; swatch: string[] }[] = [
  { id: "midnight", label: "Midnight", swatch: ["#020617", "#38bdf8", "#818cf8"] },
  { id: "ember", label: "Ember", swatch: ["#0c0a09", "#f97316", "#fbbf24"] },
  { id: "forest", label: "Forest", swatch: ["#05100b", "#34d399", "#a7f3d0"] },
  { id: "violet", label: "Violet", swatch: ["#0a0714", "#a78bfa", "#f0abfc"] },
  { id: "paper", label: "Paper", swatch: ["#f5f3ee", "#0f172a", "#64748b"] },
];

type Ctx = { theme: ThemeName; setTheme: (t: ThemeName) => void };
const ThemeCtx = createContext<Ctx>({ theme: "midnight", setTheme: () => {} });

const STORAGE_KEY = "velocity.theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("midnight");

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as ThemeName)) ||
      "midnight";
    setThemeState(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
