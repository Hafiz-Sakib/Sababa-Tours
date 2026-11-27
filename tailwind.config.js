/** @type {import('tailwindcss').Config} */

// Every theme-aware colour is a CSS variable (space-separated RGB) defined in src/index.css,
// so one class (e.g. `bg-surface`, `text-ink`) works in both day and night, with opacity (`bg-ink/10`).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── theme tokens (flip with day / night) ──
        page: v("page"), // main page background
        "page-alt": v("page-alt"), // lighter alternate band
        sandy: v("sandy"), // recessed fields / chips inside cards
        surface: v("surface"), // cards, nav, popovers (was bg-white)
        line: v("line"), // borders, dividers, tracks
        ink: v("ink"), // main text
        muted: v("muted"), // secondary text
        panel: v("panel"), // dark hero bands
        panel2: v("panel2"), // second dark band tone
        btn: v("btn"), // solid dark buttons / active pills
        lagoon: { DEFAULT: v("lagoon"), ink: v("lagoon-ink") }, // teal accent (fill / readable text)
        coral: v("coral"),
        // ── constant (does not flip): text on gold, scrims over photos ──
        navy: "#0d1f35",

        // legacy palette (kept). NOTE: `amber` used to be overridden with one value here,
        // which silently deleted bg-amber-50, text-amber-600 ... so those classes never rendered.
        cream: "#F8F5F0",
        forest: "#0D2818",
        jade: "#2F5D50",
        gold: "#D4A574",
        smoke: "#5F6B66",
        sand: "#D8CFC4",
        silver: "#9CA3AF",
        mist: "#E8ECE9",
      },
      fontFamily: {
        sans: ["Poppins", "Hind Siliguri", "system-ui", "sans-serif"],
        cormorant: ["Poppins", "Hind Siliguri", "sans-serif"],
        dm: ["Poppins", "Hind Siliguri", "sans-serif"],
      },
      // opacity steps the code already uses but Tailwind's default scale lacks
      // (bg-surface/96, bg-ink/6, bg-lagoon/8, bg-coral/12, via-navy/82, from-navy/97 never rendered before)
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
