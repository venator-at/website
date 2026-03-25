"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";
export type Accent = "violet" | "blue" | "emerald" | "rose" | "orange" | "cyan";

const ACCENT_LIST: Accent[] = ["violet", "blue", "emerald", "rose", "orange", "cyan"];

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  html.classList.remove("dark", "light");
  html.classList.add(isDark ? "dark" : "light");
  html.style.colorScheme = isDark ? "dark" : "light";
}

function applyAccent(accent: Accent) {
  const html = document.documentElement;
  ACCENT_LIST.forEach((a) => html.classList.remove(`accent-${a}`));
  html.classList.add(`accent-${accent}`);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (typeof window !== "undefined" ? (localStorage.getItem("venator-theme") as Theme) ?? "dark" : "dark"),
  );
  const [accent, setAccentState] = useState<Accent>(
    () => (typeof window !== "undefined" ? (localStorage.getItem("venator-accent") as Accent) ?? "cyan" : "cyan"),
  );

  // Apply theme/accent to DOM on mount
  useEffect(() => {
    applyTheme(theme);
    applyAccent(accent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply when system color scheme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(theme);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    localStorage.setItem("venator-theme", newTheme);
    applyTheme(newTheme);
  }

  function setAccent(newAccent: Accent) {
    setAccentState(newAccent);
    localStorage.setItem("venator-accent", newAccent);
    applyAccent(newAccent);
  }

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
