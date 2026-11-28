// src/Components/ui/brew/AmountSlider.js
// Inspired by Motion Brew's "Amount slider" (https://motion-brew.com/components/amount-slider, MIT © 2026 Md Eftakher).
// Drag the thumb and the amount rolls like an odometer. Built on a native range input, so the keyboard and screen
// readers work as usual. `children` renders under the slider (e.g. what the amount buys).
import { RollingNumber } from "../Motion";
import { cn } from "./util";

export default function AmountSlider({ value, onChange, min = 0, max = 100, step = 1, prefix = "", label = "Amount", children, className }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8", className)}>
      <label htmlFor="amount-slider" className="text-sm font-bold text-muted">
        {label}
      </label>
      <p className="mt-2 text-5xl font-black text-ink sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
        <RollingNumber value={value} prefix={prefix} />
      </p>
      <input
        id="amount-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="amount-slider mt-8 w-full"
        style={{ "--fill": `${pct}%` }}
      />
      <div className="mt-2 flex justify-between text-xs font-semibold tabular-nums text-muted">
        <span>
          {prefix}
          {min.toLocaleString()}
        </span>
        <span>
          {prefix}
          {max.toLocaleString()}
        </span>
      </div>
      {children && <div className="mt-6 border-t border-line pt-6">{children}</div>}
    </div>
  );
}
