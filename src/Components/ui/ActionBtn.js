// src/Components/ui/ActionBtn.js
// The action buttons on booking cards (Update, Cancel, Pay, Billing …).
// Icon sits in its own round bubble that fills on hover, a light sweeps across, the button lifts and presses in.
// tone: update | cancel | pay | billing | quiet | keep | danger
import { motion, useReducedMotion } from "motion/react";

const TONES = {
  update:
    "border-brand/40 bg-brand-soft/60 text-brand-ink hover:border-brand hover:shadow-[0_8px_22px_-8px_rgb(var(--brand)/0.6)]",
  cancel:
    "border-red-300/80 bg-red-50 text-red-600 hover:border-red-400 hover:shadow-[0_8px_22px_-8px_rgba(239,68,68,0.55)] dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300",
  danger:
    "border-red-500 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-[0_10px_26px_-8px_rgba(239,68,68,0.7)]",
  pay: "border-transparent bg-gradient-to-r from-cta to-accent-lt text-deep hover:shadow-[0_10px_28px_-8px_rgb(var(--brand)/0.75)]",
  billing:
    "border-line bg-surface text-ink hover:border-brand/50 hover:shadow-[0_8px_22px_-10px_rgba(16,24,40,0.35)]",
  quiet: "border-line bg-surface text-muted hover:text-ink hover:border-ink/30",
  keep: "border-line bg-surface text-ink hover:border-brand/50",
};

const BUBBLE = {
  update: "bg-brand/15 group-hover:bg-brand group-hover:text-white",
  cancel: "bg-red-500/15 group-hover:bg-red-500 group-hover:text-white",
  danger: "bg-white/20",
  pay: "bg-deep/10 group-hover:bg-deep group-hover:text-accent-lt",
  billing: "bg-brand/10 text-brand-ink group-hover:bg-brand group-hover:text-white",
  quiet: "bg-ink/5",
  keep: "bg-ink/5",
};

const ActionBtn = ({
  icon: Icon,
  tone = "update",
  attention = false,
  busy = false,
  children,
  className = "",
  as: Tag = "button",
  ...props
}) => {
  const reduce = useReducedMotion();
  const M = motion.create ? motion.create(Tag) : motion[Tag];
  return (
    <M
      {...(Tag === "button" ? { type: "button" } : {})}
      {...props}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.95, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={`group relative inline-flex h-11 select-none items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap rounded-2xl border pl-2 pr-5 text-[13px] font-bold transition-[colors,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-55 ${Icon ? "" : "pl-5"} ${TONES[tone]} ${className}`}
    >
      {attention && !reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-brand"
          animate={{ opacity: [0.8, 0], scale: [1, 1.12] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {/* light sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100"
      />
      {Icon && (
        <span
          className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 ${BUBBLE[tone]}`}
        >
          <Icon size={14} />
        </span>
      )}
      <span className="relative">{busy ? "Please wait…" : children}</span>
    </M>
  );
};

export default ActionBtn;
