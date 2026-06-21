import { browser } from "$app/environment";

export type Theme = "light" | "dark";

const STORAGE_KEY = "chat_theme";

function getInitialTheme(): Theme {
  if (!browser) return "dark";

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme: Theme): void {
  if (!browser) return;
  document.documentElement.setAttribute("data-theme", theme);
}

export class ThemeStore {
  current = $state<Theme>("dark");

  constructor() {
    if (browser) {
      this.current = getInitialTheme();
      applyTheme(this.current);
    }
  }

  toggle(): void {
    this.set(this.current === "dark" ? "light" : "dark");
  }

  set(theme: Theme): void {
    this.current = theme;
    applyTheme(theme);
    if (browser) localStorage.setItem(STORAGE_KEY, theme);
  }
}

export const themeStore = new ThemeStore();
