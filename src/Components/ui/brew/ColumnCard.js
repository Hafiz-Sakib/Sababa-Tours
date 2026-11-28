// src/Components/ui/brew/ColumnCard.js
// Inspired by Motion Brew's "Column card" (https://motion-brew.com/components/column-card, MIT © 2026 Md Eftakher).
// A card whose columns grow up from the floor while their values count up inside. Hover or focus a column to name it.
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "../Motion";
import { cn, GLIDE, PALETTE } from "./util";

export default function ColumnCard({ title, caption, columns, unit = "", onPick, className }) {
  const [hover, setHover] = useState(null);
  const reduce = useReducedMotion();
  const top = Math.max(...columns.map((c) => c.value), 1);
  const shown = columns[hover ?? 0];

  return (
    <div className={cn("w-full rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8", className)}>
      <p className="text-sm font-bold text-muted">{title}</p>
      <p className="mt-1 min-h-[3.5rem] text-lg font-black leading-snug" style={{ fontFamily: "var(--font-display)" }} aria-live="polite">
        {hover === null ? caption : shown.name}
      </p>
      <div className="mt-6 flex h-56 items-end gap-3" onMouseLeave={() => setHover(null)}>
        {columns.map((c, i) => {
          const h = Math.max(14, (c.value / top) * 100);
          const dim = hover !== null && hover !== i;
          return (
            <button
              key={c.name}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => onPick && onPick(i)}
              aria-label={`${c.name}: ${c.value}${unit}`}
              className="group flex h-full flex-1 flex-col justify-end focus-visible:outline-none"
            >
              <motion.span
                initial={reduce ? false : { height: "0%" }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: GLIDE }}
                style={{ backgroundColor: PALETTE[i % PALETTE.length], opacity: dim ? 0.35 : 1 }}
                className="flex items-start justify-center rounded-2xl pt-3 text-sm font-black text-white transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-brand group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface"
              >
                <AnimatedNumber value={c.value} suffix={unit} />
              </motion.span>
              <span className="mt-2 truncate text-center text-[11px] font-semibold text-muted">{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
