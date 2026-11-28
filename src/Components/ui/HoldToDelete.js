// src/Components/ui/HoldToDelete.js
// Press and hold to delete. The red fill runs across the button while you hold; let go early and it drains back.
// When the hold completes: the trash icon turns into a check, the label changes and onConfirm() fires.
// Works with mouse, touch and keyboard (hold Space / Enter). Respects reduced motion.
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiTrash2 } from "react-icons/fi";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

const R = 11;
const C = 2 * Math.PI * R;

const HoldToDelete = ({
  onConfirm,
  label = "Hold to delete",
  doneLabel = "Deleted",
  duration = 1.1,
  resetAfter = 1.8,
  disabled = false,
  full = false,
  className = "",
}) => {
  const reduce = useReducedMotion();
  const p = useMotionValue(0);
  const anim = useRef(null);
  const timers = useRef([]);
  const [done, setDone] = useState(false);
  const [holding, setHolding] = useState(false);

  const width = useMotionTemplate`${useTransform(p, (v) => v * 100)}%`;
  const clip = useTransform(p, (v) => `inset(0 ${100 - v * 100}% 0 0)`);
  const ring = useTransform(p, (v) => C * (1 - v));

  useEffect(
    () => () => {
      anim.current?.stop();
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const start = () => {
    if (done || disabled) return;
    setHolding(true);
    anim.current?.stop();
    anim.current = animate(p, 1, {
      duration: reduce ? 0.01 : duration,
      ease: "linear",
      onComplete: () => {
        setHolding(false);
        setDone(true);
        later(() => onConfirm?.(), reduce ? 0 : 450);
        later(() => {
          setDone(false);
          animate(p, 0, { duration: 0.3 });
        }, resetAfter * 1000);
      },
    });
  };

  const release = () => {
    if (done) return;
    setHolding(false);
    anim.current?.stop();
    animate(p, 0, { type: "spring", stiffness: 380, damping: 32 });
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={done ? doneLabel : label}
      onPointerDown={(e) => {
        if (e.button === 0 || e.pointerType !== "mouse") start();
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && release()}
      onContextMenu={(e) => e.preventDefault()}
      className={`group relative inline-flex h-11 touch-none select-none items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-2xl border border-red-300/80 bg-red-50 pl-2 pr-5 text-[13px] font-bold text-red-600 transition-colors hover:border-red-400 disabled:pointer-events-none disabled:opacity-50 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300 ${full ? "w-full justify-center" : ""} ${className}`}
    >
      {/* the fill */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-rose-600"
        style={{ width }}
      />

      {/* icon with a progress ring */}
      <span className="relative grid h-8 w-8 shrink-0 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 28 28" fill="none" aria-hidden>
          <circle cx="14" cy="14" r={R} stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.2" />
          <motion.circle
            cx="14"
            cy="14"
            r={R}
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeDasharray={C}
            style={{ strokeDashoffset: ring }}
            className={holding || done ? "text-red-600 dark:text-red-200" : "opacity-0"}
          />
        </svg>
        <motion.span
          className="relative flex"
          animate={
            holding && !reduce
              ? { rotate: [0, -10, 9, -7, 6, 0], x: [0, -0.8, 0.8, -0.6, 0.6, 0] }
              : { rotate: 0, x: 0 }
          }
          transition={holding ? { duration: 0.34, repeat: Infinity } : { duration: 0.15 }}
        >
          {done ? <FiCheck size={15} className="text-white" /> : <FiTrash2 size={15} />}
        </motion.span>
      </span>

      {/* label: dark, then white under the fill */}
      <span className="relative">
        <motion.span
          className="block"
          initial={false}
          animate={{ y: done ? "-130%" : 0, opacity: done ? 0 : 1 }}
          transition={{ duration: 0.25 }}
        >
          {label}
        </motion.span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 block text-white"
          style={{ clipPath: clip }}
          initial={false}
          animate={{ y: done ? "-130%" : 0, opacity: done ? 0 : 1 }}
          transition={{ duration: 0.25 }}
        >
          {label}
        </motion.span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 block text-white"
          initial={false}
          animate={{ y: done ? 0 : "130%", opacity: done ? 1 : 0 }}
          transition={{ duration: 0.28, delay: done ? 0.1 : 0 }}
        >
          {doneLabel}
        </motion.span>
      </span>
      <span className="sr-only" role="status">
        {done ? doneLabel : ""}
      </span>
    </button>
  );
};

export default HoldToDelete;
