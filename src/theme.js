import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

/* Day / night theme.
   - <html> carries the "dark" class; Tailwind `dark:` variants and the CSS variables in index.css follow it.
   - First visit follows the system setting; an explicit choice is saved in localStorage ("sababa-theme").
   - An inline script in public/index.html applies the choice before first paint, so there is no flash.
   - Switching: with the View Transitions API the new theme grows out of the toggle button (a circle).
     Everywhere else (Firefox, old Safari) colours cross-fade instead. prefers-reduced-motion = instant. */
const KEY = "sababa-theme";
const root = typeof document !== "undefined" ? document.documentElement : null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export const isDark = () => !!root && root.classList.contains("dark");

/* Timing (the part worth tweaking):
   SWITCH_MS  – whole page circle wipe
   ease       – slow start, fast middle, soft landing
   The toggle icons glide for 60% of SWITCH_MS, so the icon has settled before the circle finishes. */
export const SWITCH_MS = 1100;
const SWITCH_EASE = "cubic-bezier(.5,.05,.25,1)";
const PAGE_BG = { light: "#FAFDFD", dark: "#080E18" };

function paint(dark) {
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? PAGE_BG.dark : PAGE_BG.light);
  try {
    localStorage.setItem(KEY, dark ? "dark" : "light");
  } catch {
    /* storage blocked */
  }
  emit();
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const useDark = () => useSyncExternalStore(subscribe, isDark, () => false);

/** Flip the theme. `origin` = the toggle element the circle grows from. */
export function toggleTheme(origin) {
  const next = !isDark();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    paint(next);
    return;
  }

  if (typeof document.startViewTransition === "function" && origin) {
    const r = origin.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const st = root.style;
    st.setProperty("--vt-x", `${x}px`);
    st.setProperty("--vt-y", `${y}px`);
    st.setProperty("--vt-reach", `${reach}px`);
    st.setProperty("--vt-ms", `${SWITCH_MS}ms`);
    st.setProperty("--vt-ease", SWITCH_EASE);
    root.dataset.themeSwitch = next ? "to-dark" : "to-light";

    const vt = document.startViewTransition(() => {
      flushSync(() => paint(next));
    });
    vt.ready.catch(() => {});
    vt.finished.finally(() => {
      delete root.dataset.themeSwitch;
      ["--vt-x", "--vt-y", "--vt-reach", "--vt-ms", "--vt-ease"].forEach((k) => st.removeProperty(k));
    });
    return;
  }

  // fallback: cross-fade the colours
  root.classList.add("theme-fade");
  paint(next);
  setTimeout(() => root.classList.remove("theme-fade"), SWITCH_MS);
}
