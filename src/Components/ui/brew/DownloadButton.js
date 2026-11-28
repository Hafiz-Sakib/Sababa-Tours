// src/Components/ui/brew/DownloadButton.js
// Inspired by Motion Brew's "Download button" (https://motion-brew.com/components/download-button, MIT © 2026 Md Eftakher).
// A download pill whose page icon fills up like liquid while the percentage counts, then a check lands on the page.
// `onDownload()` runs when the fill completes, so the file is saved at the moment the check appears.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { FiCheck, FiDownload } from "react-icons/fi";
import { cn } from "./util";

export default function DownloadButton({ onDownload, label = "Download", doneLabel = "Saved", duration = 1600, className }) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | fill | done
  const raf = useRef(0);
  const timer = useRef(0);
  const reduce = useReducedMotion();

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(timer.current);
    },
    [],
  );

  const finish = () => {
    setPct(100);
    setPhase("done");
    try {
      onDownload && onDownload();
    } finally {
      timer.current = setTimeout(() => {
        setPhase("idle");
        setPct(0);
      }, 2200);
    }
  };

  const start = () => {
    if (phase !== "idle") return;
    if (reduce) return finish();
    setPhase("fill");
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      setPct(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else finish();
    };
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      onClick={start}
      disabled={phase === "fill"}
      className={cn("relative inline-flex min-w-[15rem] items-center gap-3 overflow-hidden rounded-full bg-btn py-3 pl-4 pr-7 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgb(var(--btn)/0.7)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page", className)}
    >
      {/* the page: an outline, a liquid fill clipped to it, and the check or arrow on top */}
      <span className="relative grid h-10 w-8 shrink-0 place-items-center">
        <svg viewBox="0 0 32 40" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <clipPath id="dl-page">
              <path d="M4 2h16l8 8v28H4z" />
            </clipPath>
          </defs>
          <g clipPath="url(#dl-page)">
            <rect x="0" y="0" width="32" height="40" fill="rgba(255,255,255,0.14)" />
            <motion.rect x="-2" width="40" height="44" style={{ fill: "rgb(var(--brand))" }} initial={false} animate={{ y: 40 - (pct / 100) * 40 }} transition={{ duration: 0.12, ease: "linear" }} />
          </g>
          <path d="M4 2h16l8 8v28H4z" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <span className="relative text-white">{phase === "done" ? <FiCheck strokeWidth={3} /> : <FiDownload />}</span>
      </span>
      <span className="flex-1 text-left">
        {phase === "idle" && label}
        {phase === "fill" && <span className="tabular-nums">Preparing {pct}%</span>}
        {phase === "done" && doneLabel}
      </span>
    </button>
  );
}
