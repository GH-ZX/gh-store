"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface Theme {
  name: string;
  nameAr: string;
  slug: string;
}

export const themes: Theme[] = [
  { name: "Midnight", nameAr: "Midnight", slug: "midnight" },
  { name: "Ocean", nameAr: "Ocean", slug: "ocean" },
  { name: "Emerald", nameAr: "Emerald", slug: "emerald" },
  { name: "Crimson", nameAr: "Crimson", slug: "crimson" },
  { name: "Graphite", nameAr: "Graphite", slug: "graphite" },
];

interface ThemeContextValue {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: themes[0],
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("gh-store-theme");
      if (saved) {
        const found = themes.find((t) => t.slug === saved);
        if (found) {
          setCurrentTheme(found);
        }
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleSetTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    try {
      localStorage.setItem("gh-store-theme", theme.slug);
      document.documentElement.setAttribute("data-theme", theme.slug);
    } catch {
      // localStorage not available
    }
  };

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", currentTheme.slug);
    }
  }, [mounted, currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
