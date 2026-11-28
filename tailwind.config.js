/** @type {import('tailwindcss').Config} */

// Every theme-aware colour is a CSS variable (space-separated RGB) defined in src/App.css,
// so one class (e.g. `bg-surface`, `text-ink`) works in both day and night, with opacity (`bg-ink/10`).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── theme tokens (flip with day / night; values live in src/App.css) ──
        page: v("page"), // main page background
        "page-alt": v("page-alt"), // lighter alternate band
        sandy: v("sandy"), // recessed fields / chips inside cards
        surface: v("surface"), // cards, nav, popovers
        line: v("line"), // borders, dividers, tracks
        ink: v("ink"), // main text
        muted: v("muted"), // secondary text
        panel: v("panel"), // dark hero bands
        panel2: v("panel2"), // second dark band tone
        btn: v("btn"), // solid dark buttons / active pills
        brand: { DEFAULT: v("brand"), ink: v("brand-ink"), soft: v("brand-soft") }, // teal #26A59E
        accent: { DEFAULT: v("accent"), lt: v("accent-lt"), soft: v("accent-soft") }, // forest green #0F5C46
        // ── constant (does not flip): dark text on light-pink chips, scrims over photos ──
        deep: "#101828",
        // ── day/night aware helpers ──
        on: v("on"), // text/lines that sit on a hero band: white at night, ink by day
        scrim: v("scrim"), // overlays & modal backdrops: midnight at night, white by day
        cta: v("cta"), // gradient CTA start colour
      },
      fontFamily: {
        sans: ["Poppins", "Hind Siliguri", "system-ui", "sans-serif"],
        cormorant: ["Poppins", "Hind Siliguri", "sans-serif"],
        dm: ["Poppins", "Hind Siliguri", "sans-serif"],
      },
      // opacity steps the code already uses but Tailwind's default scale lacks
      // (bg-surface/96, bg-ink/6, bg-brand/8, bg-accent/12, via-deep/82, from-deep/97 never rendered before)
      opacity: {
        4: "0.04",
        6: "0.06",
        7: "0.07",
        8: "0.08",
        9: "0.09",
        12: "0.12",
        68: "0.68",
        82: "0.82",
        96: "0.96",
        97: "0.97",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        dock: "var(--shadow-dock)",
      },
    },
  },
  plugins: [],
};
