import * as React from "react";
import { FiStar } from "react-icons/fi";
import { FaQuoteRight } from "react-icons/fa";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { cn, GLIDE, PALETTE, initials } from "./util";

/* Avatar testimonial: a quote that rises in word by word out of a blur, driven by a row of avatars.
   A ring fills around the active avatar until the next review comes in. Click an avatar or use ← → to switch;
   autoplay pauses while the card is hovered or focused. (Port of Motion Brew's "Avatar testimonial".) */

function AutoHeight({ children, still }) {
  const inner = React.useRef(null);
  const [h, setH] = React.useState("auto");
  React.useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div
      animate={{ height: h }}
      initial={false}
      transition={{ duration: still ? 0 : 0.5, ease: GLIDE }}
      className="overflow-hidden"
    >
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}

function Roll({ children, still, className, delay = 0 }) {
  return (
    <span className={cn("relative grid overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={children}
          initial={still ? { opacity: 0 } : { y: "100%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={still ? { opacity: 0 } : { y: "-100%", opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: still ? 0 : 0.45, ease: GLIDE, delay: still ? 0 : delay }}
          className="col-start-1 row-start-1 truncate"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* a star that can be filled partly (4.5 stars) */
function RatingStar({ fraction }) {
  return (
    <span className="relative block h-4 w-4">
      <FiStar className="absolute inset-0 h-4 w-4 fill-line text-line" strokeWidth={1.5} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
        <FiStar className="h-4 w-4 fill-accent text-accent" strokeWidth={1.5} />
      </span>
    </span>
  );
}

export default function AvatarTestimonial({ items, interval = 6500, stars = true, onChange, className }) {
  const still = !!useReducedMotion();
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const people = items.map((t, i) => ({ ...t, color: t.color ?? PALETTE[i % PALETTE.length], rating: t.rating ?? 5 }));
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const pausedRef = React.useRef(false);
  pausedRef.current = paused;
  const progress = useMotionValue(0);
  const run = React.useRef(null);
  const tabs = React.useRef([]);
  const current = people[active] ?? people[0];

  const select = React.useCallback(
    (i) => {
      const next = (i + people.length) % people.length;
      setActive(next);
      onChange?.(next);
    },
    [people.length, onChange],
  );

  React.useEffect(() => {
    run.current?.stop();
    progress.set(0);
    if (!interval || people.length < 2) return;
    run.current = animate(progress, 1, {
      duration: interval / 1000,
      ease: "linear",
      onComplete: () => select(active + 1),
    });
    if (pausedRef.current) run.current.pause();
    return () => run.current?.stop();
  }, [active, interval, people.length, progress, select]);

  React.useEffect(() => {
    if (!run.current) return;
    if (paused) run.current.pause();
    else run.current.play();
  }, [paused]);

  const words = current.quote.split(" ");

  return (
    <figure
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn("w-full rounded-3xl bg-surface p-6 text-ink shadow-card border border-line sm:p-8", className)}
    >
      <div className="flex items-center justify-between">
        {stars ? (
          <span className="flex gap-0.5" role="img" aria-label={`${current.rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <motion.span
                key={`${active}-${i}`}
                initial={still ? false : { scale: 0.3, opacity: 0, rotate: -40 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 18, delay: still ? 0 : 0.1 + i * 0.05 }}
                className="flex"
              >
                <RatingStar fraction={Math.max(0, Math.min(1, current.rating - i))} />
              </motion.span>
            ))}
          </span>
        ) : (
          <span />
        )}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand-ink" aria-hidden>
          <FaQuoteRight className="text-sm" />
        </span>
      </div>

      <AutoHeight still={still}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.blockquote
            key={active}
            id={`${uid}-quote`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${active}`}
            exit={still ? { opacity: 0 } : { opacity: 0, filter: "blur(6px)", y: -4 }}
            transition={{ duration: still ? 0.15 : 0.22, ease: "easeIn" }}
            className="pt-6 text-[20px] font-medium leading-[1.4] tracking-tight sm:text-[24px]"
          >
            <span className="sr-only">{current.quote}</span>
            <span aria-hidden>
              {words.map((w, i) => (
                <React.Fragment key={i}>
                  <motion.span
                    className="inline-block"
                    initial={still ? { opacity: 0 } : { opacity: 0, y: "0.35em", filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: still ? 0.2 : 0.55, ease: GLIDE, delay: still ? 0 : 0.05 + i * 0.035 }}
                  >
                    {w}
                  </motion.span>{" "}
                </React.Fragment>
              ))}
            </span>
          </motion.blockquote>
        </AnimatePresence>
      </AutoHeight>

      <div className="mt-8 flex flex-col gap-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
        <figcaption className="min-w-0 sm:flex-1">
          <Roll still={still} className="text-[15px] font-semibold tracking-tight">
            {current.name}
          </Roll>
          <Roll still={still} delay={0.05} className="text-[12px] text-muted">
            {current.role}
          </Roll>
        </figcaption>

        <div
          role="tablist"
          aria-label="Traveler reviews"
          className="flex flex-wrap items-center gap-2.5"
          onKeyDown={(e) => {
            const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            const next = (active + step + people.length) % people.length;
            select(next);
            tabs.current[next]?.focus();
          }}
        >
          {people.map((p, i) => {
            const on = i === active;
            return (
              <motion.button
                key={p.name}
                ref={(el) => (tabs.current[i] = el)}
                type="button"
                role="tab"
                id={`${uid}-tab-${i}`}
                aria-selected={on}
                aria-controls={`${uid}-quote`}
                aria-label={p.name}
                tabIndex={on ? 0 : -1}
                onClick={() => select(i)}
                initial={false}
                animate={{ scale: 1, opacity: on ? 1 : 0.55, filter: on ? "grayscale(0)" : "grayscale(1)" }}
                whileHover={on || still ? undefined : { opacity: 1, filter: "grayscale(0)" }}
                whileTap={still ? undefined : { scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="relative h-9 w-9 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
              >
                {on && interval > 0 && (
                  <svg viewBox="0 0 44 44" className="pointer-events-none absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90" aria-hidden>
                    <circle cx="22" cy="22" r="20.5" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" />
                    <motion.circle cx="22" cy="22" r="20.5" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round" style={{ pathLength: progress }} />
                  </svg>
                )}
                <span
                  className="grid h-full w-full place-items-center overflow-hidden rounded-full text-[12px] font-semibold tracking-tight text-white"
                  style={{ background: p.color }}
                >
                  {p.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" draggable={false} data-keep /> : initials(p.name)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
