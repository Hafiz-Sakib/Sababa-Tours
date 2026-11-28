import * as React from "react";
import { FiTrendingUp } from "react-icons/fi";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn, GLIDE, FILL } from "./util";

/* Rolling card stack: a deck of metric cards that rolls forward like a rolodex. The front card tips away, the next
   glides in and counts up. Drag, scroll, use ↑ ↓ or let it play; autoplay pauses on hover / focus.
   (Port of Motion Brew's "Rolling card stack".) */

const DEPTH_SPRING = { type: "spring", stiffness: 260, damping: 30 };
const CARD_H = 196;
const LIFT = 22;
const SHRINK = 0.05;
const PEEK_PX = LIFT - SHRINK * CARD_H;

function CountUp({ card, active, still }) {
  const mv = useMotionValue(active || still ? card.value : 0);
  const fmt = React.useMemo(
    () => new Intl.NumberFormat("en-US", { minimumFractionDigits: card.decimals ?? 0, maximumFractionDigits: card.decimals ?? 0 }),
    [card.decimals],
  );
  const text = useTransform(mv, (v) => `${card.prefix ?? ""}${fmt.format(v)}${card.suffix ?? ""}`);
  React.useEffect(() => {
    if (still) {
      mv.set(card.value);
      return undefined;
    }
    if (!active) return;
    mv.set(0);
    const c = animate(mv, card.value, { duration: 1.1, ease: FILL, delay: 0.15 });
    return () => c.stop();
  }, [active, card.value, still, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function Card({ card, active, pills, still }) {
  const Icon = card.icon ?? FiTrendingUp;
  const lit = Math.round(Math.max(0, Math.min(1, card.progress)) * pills);
  const drop = card.delta?.trim().startsWith("-") ?? false;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <span className="text-[12px] text-muted">{card.title}</span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/6 text-ink">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
      <div className="-mt-2 flex items-baseline gap-2">
        <span className="text-[32px] font-medium leading-none tracking-tight text-ink">
          <CountUp card={card} active={active} still={still} />
        </span>
        {card.delta && (
          <span className={cn("text-[12px] font-medium", drop ? "text-amber-600" : "text-emerald-600")}>{card.delta.replace(/^-/, "−")}</span>
        )}
      </div>
      <div className="mt-auto flex gap-1" aria-hidden>
        {Array.from({ length: pills }, (_, i) => (
          <span key={i} className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-sandy">
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: card.color }}
              initial={false}
              animate={{ x: i < lit && (active || still) ? "0%" : "-101%" }}
              transition={{ duration: still ? 0 : 0.45, ease: FILL, delay: active && !still ? 0.25 + i * 0.045 : 0 }}
            />
          </span>
        ))}
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: card.color }} />
        {card.caption ?? `${Math.round(card.progress * 100)}% of target`}
      </p>
    </div>
  );
}

export default function RollingCardStack({ cards, interval = 3600, peek = 2, pills = 10, onChange, label = "Metrics", className }) {
  const still = !!useReducedMotion();
  const n = cards.length;
  const [active, setActive] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [paused, setPaused] = React.useState(false);
  const wheelLock = React.useRef(0);

  const go = React.useCallback(
    (step) => {
      if (n < 2) return;
      setDir(step > 0 ? 1 : -1);
      setActive((a) => {
        const next = (a + step + n) % n;
        onChange?.(next);
        return next;
      });
    },
    [n, onChange],
  );

  React.useEffect(() => {
    if (!interval || paused || n < 2) return;
    const id = window.setInterval(() => go(1), interval);
    return () => window.clearInterval(id);
  }, [interval, paused, go, n]);

  const onDragEnd = (_, info) => {
    if (info.offset.y > 60 || info.velocity.y > 500) go(1);
    else if (info.offset.y < -60 || info.velocity.y < -500) go(-1);
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
      onWheel={(e) => {
        // only react to deliberate horizontal-free wheel gestures over the card, never hijack page scroll on touchpads
        const now = performance.now();
        if (Math.abs(e.deltaY) < 40 || now - wheelLock.current < 600) return;
        wheelLock.current = now;
        go(e.deltaY > 0 ? 1 : -1);
      }}
      className={cn("w-full max-w-[380px] rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-page", className)}
    >
      <span className="sr-only" aria-live="polite">
        {`${cards[active]?.title}: ${cards[active]?.prefix ?? ""}${cards[active]?.value}${cards[active]?.suffix ?? ""}, ${active + 1} of ${n}`}
      </span>

      <div className="relative" style={{ perspective: 900, height: CARD_H, marginTop: Math.min(peek, cards.length - 1) * PEEK_PX }}>
        {cards.map((card, i) => {
          const depth = (i - active + n) % n;
          const front = depth === 0;
          const behind = Math.min(depth, peek + 1);
          const leaving = dir > 0 && depth === n - 1 && n > 1;
          const arriving = dir < 0 && depth === 0 && n > 1;
          const rest = {
            y: -behind * LIFT,
            scale: 1 - behind * SHRINK,
            opacity: depth > peek ? 0 : 1 - behind * 0.18,
            rotateX: 0,
            filter: "blur(0px)",
            zIndex: n - depth,
          };
          let animateTo = rest;
          let transition = still ? { duration: 0.2 } : DEPTH_SPRING;
          if (!still && leaving) {
            animateTo = {
              y: [0, 70, -behind * LIFT],
              rotateX: [0, -62, 0],
              scale: [1, 0.96, rest.scale],
              opacity: [1, 0, 0],
              filter: ["blur(0px)", "blur(6px)", "blur(0px)"],
              zIndex: [n + 1, n + 1, rest.zIndex],
            };
            transition = { duration: 0.75, times: [0, 0.5, 1], ease: [[0.55, 0, 0.8, 0.4], "linear"] };
          } else if (!still && arriving) {
            animateTo = {
              y: [70, 70, 0],
              rotateX: [-62, -62, 0],
              scale: [0.96, 0.96, 1],
              opacity: [0, 0, 1],
              filter: ["blur(6px)", "blur(6px)", "blur(0px)"],
              zIndex: [n + 1, n + 1, n],
            };
            transition = { duration: 0.7, times: [0, 0.05, 1], ease: ["linear", GLIDE] };
          }
          return (
            <motion.div
              key={`${i}-${card.title}`}
              aria-hidden={!front}
              drag={front && !still ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.35}
              onDragEnd={front ? onDragEnd : undefined}
              initial={false}
              animate={animateTo}
              transition={transition}
              whileDrag={{ scale: 0.985, cursor: "grabbing" }}
              style={{ height: CARD_H }}
              className={cn(
                "absolute inset-x-0 top-0 origin-bottom rounded-3xl border border-line bg-surface px-5 pb-5 pt-5 text-ink shadow-card",
                front && !still && "cursor-grab",
                !front && "pointer-events-none",
              )}
              // vertical drag only: let the page keep scrolling vertically on touch? the card owns y drags, so pan-x stays free
            >
              <motion.div
                className="h-full"
                initial={false}
                animate={{ opacity: front || leaving ? 1 : 0 }}
                transition={{ duration: still ? 0 : 0.35, ease: GLIDE, delay: front && !still ? 0.1 : 0 }}
              >
                <Card card={card} active={front} pills={pills} still={still} />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
