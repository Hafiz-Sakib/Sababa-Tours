// src/Components/ui/Motion.js
// Animated building blocks inspired by the Motion Brew component library
// (blur text, gradient text, tilt card, magnetic button, pill tabs, odometer numbers…).
// Built on the `motion` package. All of them respect prefers-reduced-motion.
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

export { AnimatePresence, LayoutGroup, motion, useReducedMotion };

/* ───────────── Blur text: words rise out of a soft blur ───────────── */
export const BlurText = ({
  text,
  className = "",
  delay = 0,
  step = 0.07,
  as: Tag = "span",
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag] || motion.span;
  return (
    <MotionTag ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block will-change-transform"
          initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(12px)" }}
          animate={
            inView || reduce
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : undefined
          }
          transition={{
            duration: 0.7,
            delay: delay + i * step,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {w}
          {"\u00A0"}
        </motion.span>
      ))}
    </MotionTag>
  );
};

/* ───────────── Reveal: fade + rise when scrolled into view ───────────── */
export const Reveal = ({ children, delay = 0, y = 28, className = "" }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ───────────── Animated number: counts up with a spring ───────────── */
export const AnimatedNumber = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  format = true,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 18 });
  const text = useTransform(spring, (v) => {
    const n = decimals ? v.toFixed(decimals) : Math.round(v);
    return prefix + (format ? Number(n).toLocaleString() : n) + suffix;
  });
  useEffect(() => {
    if (reduce) mv.jump(Number(value) || 0);
    else if (inView) mv.set(Number(value) || 0);
  }, [value, inView, reduce, mv]);
  return (
    <motion.span ref={ref} className={`tabular-nums ${className}`}>
      {text}
    </motion.span>
  );
};

/* ───────────── Tilt card: tips toward the cursor with a glare ───────────── */
export const TiltCard = ({ children, className = "", max = 7 }) => {
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 220, damping: 20 });
  const ry = useSpring(0, { stiffness: 220, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useTransform(
    [gx, gy],
    ([x, y]) =>
      `radial-gradient(420px circle at ${x}% ${y}%, rgba(255,255,255,0.22), transparent 55%)`,
  );
  const onMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };
  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`relative ${className}`}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: glare }}
      />
    </motion.div>
  );
};

/* ───────────── Magnetic: leans toward the cursor on a spring ───────────── */
export const Magnetic = ({ children, strength = 0.28, className = "" }) => {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 260, damping: 18 });
  const y = useSpring(0, { stiffness: 260, damping: 18 });
  const onMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  return (
    <motion.div
      className={`inline-block ${className}`}
      style={{ x, y }}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
};

/* ───────────── Pill tabs: a white pill slides like a rubber band ─────────────
   items: [{ id, label, icon?, badge? }]                                        */
export const PillTabs = ({
  items,
  value,
  onChange,
  id = "pill",
  dark = false,
  className = "",
}) => (
  <LayoutGroup id={id}>
    <div
      role="tablist"
      className={`relative inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5 ${
        dark
          ? "bg-white/10 border border-white/15 backdrop-blur"
          : "bg-white border border-[#e7dfd0] shadow-[0_8px_30px_rgba(13,31,53,0.08)]"
      } ${className}`}
    >
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`relative z-0 flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold capitalize transition-colors ${
              active
                ? dark
                  ? "text-[#0d1f35]"
                  : "text-white"
                : dark
                  ? "text-white/70 hover:text-white"
                  : "text-[#5a6a7e] hover:text-[#0d1f35]"
            }`}
          >
            {active && (
              <motion.span
                layoutId="pill-bg"
                className={`absolute inset-0 -z-10 rounded-full ${
                  dark
                    ? "bg-gradient-to-r from-[#c9a84c] to-[#e8c96a]"
                    : "bg-[#0d1f35] shadow-lg"
                }`}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            {it.icon}
            {it.label}
            {it.badge != null && it.badge !== "" && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  it.badgeTone === "alert"
                    ? "bg-[#e85d45] text-white"
                    : active
                      ? "bg-white/20"
                      : "bg-[#f5f0e8] text-[#5a6a7e]"
                }`}
              >
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </LayoutGroup>
);

/* ───────────── Aurora background: drifting blurred colour blobs ───────────── */
export const Aurora = ({ className = "" }) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
  >
    <div className="mb-blob absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#0f8f84]/40 blur-[90px]" />
    <div
      className="mb-blob absolute right-[-80px] top-10 h-[380px] w-[380px] rounded-full bg-[#c9a84c]/25 blur-[90px]"
      style={{ animationDelay: "-6s" }}
    />
    <div
      className="mb-blob absolute bottom-[-120px] left-1/3 h-[360px] w-[360px] rounded-full bg-[#e85d45]/15 blur-[100px]"
      style={{ animationDelay: "-12s" }}
    />
  </div>
);

/* ───────────── Shimmer line for loading states ───────────── */
export const Shimmer = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-[#e7dfd0]/60 ${className}`}
  >
    <div className="mb-shimmer absolute inset-0" />
  </div>
);

/* ───────────── Modal / drawer shells with spring entrance ───────────── */
export const Backdrop = ({ onClick, className = "" }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`absolute inset-0 bg-[#0d1f35]/60 backdrop-blur-sm ${className}`}
  />
);

export const ModalShell = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 16, scale: 0.97 }}
    transition={{ type: "spring", stiffness: 380, damping: 30 }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ───────────── Flip words: one word flips to the next on a loop ───────────── */
export const FlipWords = ({ words, interval = 2400, className = "" }) => {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval, reduce]);
  return (
    <span className={`relative inline-block align-bottom ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[i]}
          className="inline-block"
          initial={{ opacity: 0, y: 14, rotateX: -70, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, rotateX: 70, filter: "blur(6px)" }}
          transition={{ duration: 0.38 }}
          style={{ transformPerspective: 500 }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/* ───────────── Rolling number: digits roll like an odometer ───────────── */
const Digit = ({ d }) => (
  <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-bottom leading-none">
    <motion.span
      className="absolute inset-x-0 top-0 flex flex-col"
      animate={{ y: `${-d}em` }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <span key={n} className="block h-[1em] text-center leading-none">
          {n}
        </span>
      ))}
    </motion.span>
  </span>
);

export const RollingNumber = ({ value, prefix = "", className = "" }) => (
  <span className={`inline-flex items-end tabular-nums leading-none ${className}`} aria-label={String(value)}>
    {prefix && <span className="leading-none">{prefix}</span>}
    {String(Math.max(0, Math.round(value)))
      .split("")
      .map((c, idx, arr) => (
        // key from the right so digits keep their place as the length changes
        <Digit key={arr.length - idx} d={Number(c)} />
      ))}
  </span>
);

/* ───────────── Blur accordion: panels spring open, the answer rises into focus ───────────── */
export const BlurAccordion = ({ items }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-[#e7dfd0] overflow-hidden rounded-[28px] border border-[#e7dfd0] bg-white">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left"
            >
              <span className="text-lg font-bold text-[#0d1f35]" style={{ fontFamily: "var(--font-display)" }}>
                {it.q}
              </span>
              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5f0e8]">
                <span className="absolute h-0.5 w-3.5 rounded bg-[#0d1f35]" />
                <motion.span
                  className="absolute h-0.5 w-3.5 rounded bg-[#0d1f35]"
                  animate={{ rotate: isOpen ? 0 : 90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0, filter: "blur(8px)" }}
                  animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
                  exit={{ height: 0, opacity: 0, filter: "blur(8px)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  className="overflow-hidden"
                >
                  <p className="px-7 pb-7 leading-relaxed text-[#5a6a7e]">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────── Scroll progress: a thin bar under the navbar fills as you read ───────────── */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-[72px] z-[45] h-[3px] origin-left bg-gradient-to-r from-[#c9a84c] to-[#0b6b62]"
      style={{ scaleX: x }}
    />
  );
};

/* ───────────── Flip card: tap or hover to turn it over ───────────── */
export const FlipCard = ({ front, back, className = "" }) => {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      aria-pressed={flipped}
      className={`relative block h-full w-full text-left [perspective:1000px] ${className}`}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped && !reduce ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]" style={{ opacity: reduce && flipped ? 0 : 1 }}>
          {front}
        </div>
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ transform: reduce ? "none" : "rotateY(180deg)", opacity: reduce && !flipped ? 0 : 1 }}
        >
          {back}
        </div>
      </motion.div>
    </button>
  );
};
