// src/Components/ui/HoldButton.js
// Press-and-hold to confirm. One component for every destructive or important action, coloured by meaning:
//   confirm → green    cancel → amber    delete → red    neutral → slate
// The colour fills the button while you hold; let go early and it drains back. When the hold completes the icon
// turns into a check, the label flips to doneLabel and onConfirm() fires.
// variant="button" is the wide labelled button, variant="icon" is a round icon-only one for tables and toolbars.
// Works with mouse, touch and keyboard (hold Space / Enter). Respects reduced motion. Vibrates a little on phones.
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCheckCircle, FiRotateCcw, FiTrash2, FiXCircle } from "react-icons/fi";
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

export const HOLD_TONES = {
  confirm: {
    icon: FiCheckCircle,
    label: "Hold to confirm",
    done: "Confirmed",
    base: "border-emerald-300/80 bg-emerald-50 text-emerald-700 hover:border-emerald-400 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300",
    fill: "from-emerald-500 to-green-600",
    ring: "text-emerald-600 dark:text-emerald-200",
    glow: "rgba(16,185,129,0.55)",
  },
  cancel: {
    icon: FiXCircle,
    label: "Hold to cancel",
    done: "Cancelled",
    base: "border-amber-300/80 bg-amber-50 text-amber-700 hover:border-amber-400 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-300",
    fill: "from-amber-500 to-orange-500",
    ring: "text-amber-600 dark:text-amber-200",
    glow: "rgba(245,158,11,0.55)",
  },
  delete: {
    icon: FiTrash2,
    label: "Hold to delete",
    done: "Deleted",
    base: "border-red-300/80 bg-red-50 text-red-600 hover:border-red-400 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300",
    fill: "from-red-500 to-rose-600",
    ring: "text-red-600 dark:text-red-200",
    glow: "rgba(239,68,68,0.55)",
  },
  neutral: {
    icon: FiRotateCcw,
    label: "Hold to apply",
    done: "Done",
    base: "border-slate-300/80 bg-slate-50 text-slate-600 hover:border-slate-400 dark:border-slate-400/40 dark:bg-slate-500/10 dark:text-slate-300",
    fill: "from-slate-500 to-slate-700",
    ring: "text-slate-600 dark:text-slate-200",
    glow: "rgba(100,116,139,0.5)",
  },
};

const buzz = (ms) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* not supported */
  }
};

const HoldButton = ({
  tone = "delete",
  variant = "button",
  onConfirm,
  label,
  doneLabel,
  icon,
  title,
  duration = 1.1,
  resetAfter = 1.8,
  disabled = false,
  full = false,
  size = "md", // md | sm (button variant)
  className = "",
}) => {
  const T = HOLD_TONES[tone] || HOLD_TONES.delete;
  const Icon = icon || T.icon;
  const text = label || T.label;
  const doneText = doneLabel || T.done;
  const reduce = useReducedMotion();
  const p = useMotionValue(0);
  const anim = useRef(null);
  const timers = useRef([]);
  const [done, setDone] = useState(false);
  const [holding, setHolding] = useState(false);

  const width = useMotionTemplate`${useTransform(p, (v) => v * 100)}%`;
  const height = useMotionTemplate`${useTransform(p, (v) => v * 100)}%`;
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
    buzz(8);
    anim.current?.stop();
    anim.current = animate(p, 1, {
      duration: reduce ? 0.01 : duration,
      ease: "linear",
      onComplete: () => {
        setHolding(false);
        setDone(true);
        buzz([18, 40, 18]);
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

  const handlers = {
    onPointerDown: (e) => {
      if (e.button === 0 || e.pointerType !== "mouse") start();
    },
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
    onKeyDown: (e) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        start();
      }
    },
    onKeyUp: (e) => (e.key === " " || e.key === "Enter") && release(),
    onContextMenu: (e) => e.preventDefault(),
  };

  const shake =
    holding && !reduce
      ? { rotate: [0, -10, 9, -7, 6, 0], x: [0, -0.8, 0.8, -0.6, 0.6, 0] }
      : { rotate: 0, x: 0 };
  const shakeT = holding ? { duration: 0.34, repeat: Infinity } : { duration: 0.15 };

  /* ───── round icon-only variant ───── */
  if (variant === "icon") {
    return (
      <button
        type="button"
        disabled={disabled}
        title={title || `${text} (press and hold)`}
        aria-label={done ? doneText : text}
        {...handlers}
        style={{ boxShadow: holding ? `0 0 0 4px ${T.glow.replace(/0\.\d+\)/, "0.18)")}` : undefined }}
        className={`group relative inline-grid h-9 w-9 shrink-0 touch-none select-none place-items-center overflow-hidden rounded-full border transition-[colors,box-shadow] disabled:pointer-events-none disabled:opacity-30 ${T.base} ${className}`}
      >
        <motion.span
          aria-hidden
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t ${T.fill}`}
          style={{ height }}
        />
        <motion.span className="relative flex" animate={shake} transition={shakeT}>
          {done ? <FiCheck size={16} className="text-white" /> : <Icon size={16} className={holding ? "text-white" : ""} />}
        </motion.span>
        <span className="sr-only" role="status">
          {done ? doneText : ""}
        </span>
      </button>
    );
  }

  /* ───── wide labelled variant ───── */
  const small = size === "sm";
  return (
    <button
      type="button"
      disabled={disabled}
      title={title || "Press and hold"}
      aria-label={done ? doneText : text}
      {...handlers}
      className={`group relative inline-flex ${small ? "h-9 gap-1.5 rounded-xl pl-1.5 pr-3.5 text-xs" : "h-11 gap-2.5 rounded-2xl pl-2 pr-5 text-[13px]"} touch-none select-none items-center overflow-hidden whitespace-nowrap border font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 ${T.base} ${full ? "w-full justify-center" : ""} ${className}`}
    >
      {/* the fill */}
      <motion.span
        aria-hidden
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${T.fill}`}
        style={{ width }}
      />

      {/* icon with a progress ring */}
      <span className={`relative grid ${small ? "h-7 w-7" : "h-8 w-8"} shrink-0 place-items-center`}>
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
            className={holding || done ? T.ring : "opacity-0"}
          />
        </svg>
        <motion.span className="relative flex" animate={shake} transition={shakeT}>
          {done ? <FiCheck size={15} className="text-white" /> : <Icon size={small ? 13 : 15} />}
        </motion.span>
      </span>

      {/* label: tone colour, then white under the fill */}
      <span className="relative">
        <motion.span
          className="block"
          initial={false}
          animate={{ y: done ? "-130%" : 0, opacity: done ? 0 : 1 }}
          transition={{ duration: 0.25 }}
        >
          {text}
        </motion.span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 block text-white"
          style={{ clipPath: clip }}
          initial={false}
          animate={{ y: done ? "-130%" : 0, opacity: done ? 0 : 1 }}
          transition={{ duration: 0.25 }}
        >
          {text}
        </motion.span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 block text-white"
          initial={false}
          animate={{ y: done ? 0 : "130%", opacity: done ? 1 : 0 }}
          transition={{ duration: 0.28, delay: done ? 0.1 : 0 }}
        >
          {doneText}
        </motion.span>
      </span>
      <span className="sr-only" role="status">
        {done ? doneText : ""}
      </span>
    </button>
  );
};

export default HoldButton;
