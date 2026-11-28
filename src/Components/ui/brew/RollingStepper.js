// src/Components/ui/brew/RollingStepper.js
// Inspired by Motion Brew's "Rolling stepper" (https://motion-brew.com/components/rolling-stepper, MIT © 2026 Md Eftakher).
// A stepper whose digits roll like an odometer. Minus and plus buttons stop at the limits.
import { FiMinus, FiPlus } from "react-icons/fi";
import { RollingNumber } from "../Motion";
import { cn } from "./util";

export default function RollingStepper({ value, onChange, min = 1, max = 20, label = "Travelers", className }) {
  const btn = "grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-ink transition hover:bg-btn hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  return (
    <div className={cn("flex items-center justify-between gap-6", className)} role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>
        <FiMinus />
      </button>
      <div className="text-center">
        <p className="text-5xl font-black text-ink" style={{ fontFamily: "var(--font-display)" }} aria-live="polite">
          <RollingNumber value={value} />
        </p>
        <p className="mt-1 text-xs font-bold text-muted">{label}</p>
      </div>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>
        <FiPlus />
      </button>
    </div>
  );
}
