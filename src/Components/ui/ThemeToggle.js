import { motion, useReducedMotion } from "./Motion";
import { toggleTheme, useDark, SWITCH_MS } from "../../theme";

/* Day / night button: a sun and a moon that swap (rotate + scale + fade).
   The page itself changes through the growing circle that starts at this button (see toggleTheme in theme.js).
   `solid` = nav has its solid background; otherwise it sits transparent over the dark hero. */
const GLIDE = { duration: (SWITCH_MS / 1000) * 0.6, ease: [0.5, 0.05, 0.25, 1] };
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4.6" fill="currentColor" />
    {RAYS.map((a) => (
      <line key={a} x1="12" y1="2.4" x2="12" y2="4.6" transform={`rotate(${a} 12 12)`} />
    ))}
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
    <path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a.7.7 0 0 0-.95-.82A9.6 9.6 0 1 0 21 15.55a.7.7 0 0 0-.8-.95Z" />
    <circle cx="17.5" cy="5.5" r="1" />
    <circle cx="20.5" cy="9" r=".7" />
  </svg>
);

export default function ThemeToggle({ solid = true, className = "" }) {
  const dark = useDark();
  const still = !!useReducedMotion();
  const t = still ? { duration: 0 } : GLIDE;
  const label = dark ? "Switch to day mode" : "Switch to night mode";

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={dark}
      onClick={(e) => toggleTheme(e.currentTarget)}
      whileTap={still ? undefined : { scale: 0.88 }}
      className={`relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[14px] border outline-none transition-colors duration-700 ${
        solid
          ? "border-line bg-sandy hover:bg-line/60"
          : "border-white/25 bg-white/10 hover:bg-white/20"
      } ${className}`}
    >
      <motion.span
        aria-hidden
        className="absolute text-[#d4962a]"
        initial={false}
        animate={{ opacity: dark ? 0 : 1, rotate: dark ? 90 : 0, scale: dark ? 0.3 : 1 }}
        transition={t}
      >
        <SunIcon />
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute text-[#e8c96a]"
        initial={false}
        animate={{ opacity: dark ? 1 : 0, rotate: dark ? 0 : -90, scale: dark ? 1 : 0.3 }}
        transition={t}
      >
        <MoonIcon />
      </motion.span>
    </motion.button>
  );
}
