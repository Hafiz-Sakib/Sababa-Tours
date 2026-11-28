import * as React from "react";
import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";
import { animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useTransform, useVelocity } from "motion/react";
import { cn, GLIDE, PALETTE } from "./util";

/* Score card: bars slide in and the number counts up. Hover (or focus) a bar to light it and roll the score to
   that bar's share. (Port of Motion Brew's "Score card".) */

const COUNT = [0.5, 1, 0.89, 1];
const SLIDE = { type: "spring", stiffness: 140, damping: 17, mass: 0.9 };

const share = (bars) => {
  const v = bars.reduce((s, b) => s + b.value, 0);
  const m = bars.reduce((s, b) => s + b.max, 0);
  return m ? (v / m) * 100 : 0;
};

function Count({ value, decimals, className }) {
  const text = useTransform(value, (v) => v.toFixed(decimals));
  const rate = useVelocity(value);
  const filter = useTransform(rate, (r) => {
    const px = Math.min(1.2, Math.abs(r) * 0.012);
    return px < 0.15 ? "none" : `blur(${px.toFixed(2)}px)`;
  });
  return (
    <motion.span className={cn("tabular-nums", className)} style={{ filter }}>
      {text}
    </motion.span>
  );
}

function Bar({ bar, index, shown, active, dim, still, onEnter, onLeave }) {
  const color = bar.color ?? PALETTE[index % PALETTE.length];
  const ratio = bar.max ? Math.min(1, Math.max(0, bar.value / bar.max)) : 0;
  const target = shown ? Math.max(0.42, ratio) : 0;
  return (
    <motion.button
      type="button"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      whileTap={still ? undefined : { scale: 0.98 }}
      animate={{ opacity: dim ? 0.45 : 1 }}
      transition={{ duration: 0.25, ease: GLIDE }}
      aria-label={`${bar.label}, ${bar.value} of ${bar.max}`}
      className="relative block h-11 w-full cursor-pointer overflow-hidden rounded-full bg-ink/6 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <motion.span
        className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
        initial={false}
        animate={{ width: `${target * 100}%` }}
        transition={still ? { duration: 0 } : { width: { ...SLIDE, delay: shown ? index * 0.09 : 0 } }}
      >
        <span aria-hidden className="absolute inset-0 opacity-25" style={{ backgroundColor: color }} />
        <motion.span
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundColor: color }}
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: still ? 0 : 0.3, ease: GLIDE }}
        />
        <AnimatePresence>
          {active && !still && (
            <motion.span
              key="sheen"
              aria-hidden
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ left: "-40%" }}
              animate={{ left: "110%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: GLIDE }}
            />
          )}
        </AnimatePresence>
        <motion.span
          className="relative flex h-full items-center justify-between gap-3 whitespace-nowrap px-4 text-sm"
          animate={{ color: active ? "#ffffff" : "rgb(var(--ink))" }}
          transition={{ duration: 0.3, ease: GLIDE }}
        >
          <span className="font-medium">{bar.label}</span>
          <span className="tabular-nums opacity-70">
            <motion.span
              key={bar.value}
              className="inline-block"
              initial={still ? false : { y: 8, opacity: 0, filter: "blur(2px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: GLIDE }}
            >
              {bar.value}
            </motion.span>
            /{bar.max}
          </span>
        </motion.span>
      </motion.span>
    </motion.button>
  );
}

export default function ScoreCard({ title = "Score", avatar = null, bars, change = null, period = "month", decimals = 1, overall, overallLabel, focusSuffix, className }) {
  const root = React.useRef(null);
  const still = !!useReducedMotion();
  const inView = useInView(root, { once: true, amount: 0.4 });
  const shown = inView || still;
  const [hover, setHover] = React.useState(null);
  const lit = hover ?? bars.length - 1;

  const focusBar = hover === null ? null : bars[hover];
  const total = overall ?? share(bars);
  const target = focusBar ? (focusBar.value / Math.max(1, focusBar.max)) * 100 : total;

  const score = useMotionValue(0);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (!shown) return;
    if (still) {
      score.set(target);
      return undefined;
    }
    const intro = first.current;
    first.current = false;
    const c = animate(score, target, { duration: intro ? 1.2 : 0.6, delay: intro ? 0.1 : 0, ease: COUNT });
    return () => c.stop();
  }, [shown, still, target, score]);

  const up = (change ?? 0) >= 0;

  return (
    <div ref={root} className={cn("relative w-full max-w-[380px] rounded-3xl border border-line bg-surface p-6 text-ink shadow-card", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <div className="relative mt-1 h-5 overflow-hidden text-sm text-muted">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={focusBar ? focusBar.label : "overall"}
                initial={still ? false : { y: 12, opacity: 0, filter: "blur(2px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={still ? undefined : { y: -12, opacity: 0, filter: "blur(2px)" }}
                transition={{ duration: 0.3, ease: GLIDE }}
              >
                {focusBar ? `${focusBar.label}${focusSuffix ?? ` this ${period}`}` : (overallLabel ?? `Overall this ${period}`)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        {avatar && (
          <motion.img
            src={avatar}
            alt=""
            draggable={false}
            data-keep
            initial={still ? false : { scale: 0.6, opacity: 0 }}
            animate={shown ? { scale: 1, opacity: 1 } : undefined}
            whileHover={still ? undefined : { scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="h-11 w-11 shrink-0 select-none rounded-full bg-sandy object-contain p-1.5 ring-2 ring-surface"
          />
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="flex items-baseline text-[32px] font-medium leading-none tracking-tight" aria-label={`${target.toFixed(decimals)} percent`}>
          <Count value={score} decimals={decimals} />
          <span className="ml-0.5 text-xl text-muted">%</span>
        </p>
        <AnimatePresence mode="popLayout" initial={false}>
          {change != null && hover === null && (
            <motion.span
              key="change"
              initial={still ? false : { opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={still ? undefined : { opacity: 0, y: -6, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={cn(
                "mb-0.5 inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-sm font-medium tabular-nums",
                up ? "bg-emerald-100 text-emerald-700" : "bg-ink/6 text-muted",
              )}
            >
              {up ? <FiArrowUpRight className="h-4 w-4" aria-hidden /> : <FiArrowDownRight className="h-4 w-4" aria-hidden />}
              {up ? "+" : ""}
              {change.toFixed(1)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 flex flex-col gap-2" onPointerLeave={() => setHover(null)}>
        {bars.map((b, i) => (
          <Bar
            key={b.label}
            bar={b}
            index={i}
            shown={shown}
            active={i === lit}
            dim={hover !== null && i !== hover}
            still={still}
            onEnter={() => setHover(i)}
            onLeave={() => setHover((h) => (h === i ? null : h))}
          />
        ))}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {focusBar ? `${focusBar.label}, ${focusBar.value} of ${focusBar.max}` : `${title} ${total.toFixed(decimals)} percent`}
      </span>
    </div>
  );
}
