// src/Components/ui/brew/VerifyFlow.js
// Inspired by Motion Brew's "Verify flow" (https://motion-brew.com/components/verify-flow, MIT © 2026 Md Eftakher).
// A segmented bar fills and a highlight slides down the steps as each one is checked off, ending on a seal.
// Plays once when it scrolls into view; "Replay" plays it again.
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { FiCheck, FiRotateCcw } from "react-icons/fi";
import { cn, GLIDE } from "./util";

export default function VerifyFlow({ steps, doneLabel = "All set", className, stepMs = 1100 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [done, setDone] = useState(0); // how many steps are checked
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDone(steps.length);
      return;
    }
    setDone(0);
    const timers = steps.map((_, i) => setTimeout(() => setDone(i + 1), 500 + i * stepMs));
    return () => timers.forEach(clearTimeout);
  }, [inView, run, reduce, steps, stepMs]);

  const finished = done >= steps.length;

  return (
    <div ref={ref} className={cn("w-full max-w-xl rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8", className)}>
      <div className="flex gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <motion.span initial={false} animate={{ width: done > i ? "100%" : "0%" }} transition={{ duration: 0.6, ease: GLIDE }} className="block h-full rounded-full bg-brand" />
          </span>
        ))}
      </div>

      <ol className="relative mt-6 space-y-1">
        {steps.map((s, i) => {
          const checked = done > i;
          const current = done === i && inView && !finished;
          return (
            <li key={s.title} className="relative flex gap-4 rounded-2xl px-3 py-3">
              {current && <motion.span layoutId="verify-hl" transition={{ type: "spring", stiffness: 320, damping: 32 }} className="absolute inset-0 rounded-2xl bg-sandy" />}
              <span className={cn("relative mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300", checked ? "border-brand bg-brand text-white" : "border-line text-transparent")}>
                <motion.span initial={false} animate={{ scale: checked ? 1 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                  <FiCheck strokeWidth={3} />
                </motion.span>
              </span>
              <span className="relative">
                <span className={cn("block font-bold transition-colors duration-300", checked || current ? "text-ink" : "text-ink/50")}>{s.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{s.text}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <motion.p initial={false} animate={{ opacity: finished ? 1 : 0, y: finished ? 0 : 6 }} className="flex items-center gap-2 text-sm font-bold text-brand-ink">
          <FiCheck /> {doneLabel}
        </motion.p>
        <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-muted transition hover:bg-sandy hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <FiRotateCcw /> Replay
        </button>
      </div>
    </div>
  );
}
