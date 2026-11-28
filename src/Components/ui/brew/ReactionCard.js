// src/Components/ui/brew/ReactionCard.js
// Inspired by Motion Brew's "Reaction card" (https://motion-brew.com/components/reaction-card, MIT © 2026 Md Eftakher).
// A question with a few reaction buttons. The pick springs up with a small burst and is remembered on this device only
// (localStorage under `storageKey`), so no counts are shown and nothing is sent anywhere.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "./util";

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

export default function ReactionCard({ question, options, storageKey, thanks = "Thanks, noted on this device.", className }) {
  const [pick, setPick] = useState(null);
  const [burst, setBurst] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    setPick(read(storageKey));
  }, [storageKey]);

  const choose = (id) => {
    const next = pick === id ? null : id;
    setPick(next);
    setBurst((b) => b + 1);
    try {
      next ? localStorage.setItem(storageKey, next) : localStorage.removeItem(storageKey);
    } catch {
      /* storage blocked: the pick still shows for this visit */
    }
  };

  return (
    <div className={cn("w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 shadow-card", className)}>
      <p className="text-lg font-black leading-snug" style={{ fontFamily: "var(--font-display)" }}>
        {question}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3" role="group" aria-label={question}>
        {options.map((o) => {
          const on = pick === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => choose(o.id)}
              className={cn("relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand", on ? "border-brand bg-brand/10 text-brand-ink" : "border-line text-muted hover:bg-sandy hover:text-ink")}
            >
              <motion.span key={on ? burst : "off"} initial={false} animate={on && !reduce ? { scale: [1, 1.45, 1], rotate: [0, -12, 0] } : { scale: 1 }} transition={{ duration: 0.5 }} className="text-2xl">
                {o.icon}
              </motion.span>
              {o.label}
              {on && !reduce &&
                [0, 1, 2, 3, 4].map((k) => (
                  <motion.span key={`${burst}-${k}`} aria-hidden initial={{ opacity: 1, x: 0, y: 0, scale: 1 }} animate={{ opacity: 0, x: Math.cos((k / 5) * Math.PI * 2) * 26, y: Math.sin((k / 5) * Math.PI * 2) * 26 - 10, scale: 0.3 }} transition={{ duration: 0.6 }} className="pointer-events-none absolute left-1/2 top-6 h-1.5 w-1.5 rounded-full bg-brand" />
                ))}
            </button>
          );
        })}
      </div>
      <p className="mt-4 h-4 text-xs text-muted" aria-live="polite">
        {pick ? thanks : ""}
      </p>
    </div>
  );
}
