import * as React from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { cn } from "./util";

/* Tilt carousel (Motion Brew style): a looping row of cards inside a perspective stage. Every card is placed from ONE
   motion value (the position). A card's wrapped distance from the middle drives its x spread, a rotateY that turns the
   side cards away, translateZ, a smaller scale, and a brightness + blur that grow with distance.
   - moves on by itself after a delay, pauses while the pointer rests on it
   - drag sets the position directly (velocity tracked); release springs to the nearest card with a little throw
   - click a card left of the middle = one card left, right of it = one card right (unless the pointer dragged)
   - ← → keys step through it; no visible controls
   - reduced motion: plain moves instead of springs, no autoplay */

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/* distance of card i from the middle, wrapped so the row loops: -n/2 … n/2 */
const wrap = (i, p, n) => {
  let d = mod(i - p, n);
  if (d > n / 2) d -= n;
  return d;
};

function Slide({ i, n, pos, step, spread, tilt, cardWidth, cardHeight, onSelect, label, children }) {
  const d = useTransform(pos, (p) => wrap(i, p, n));
  const x = useTransform(d, (v) => v * step + Math.sign(v) * Math.min(1, Math.abs(v)) * spread);
  const rotateY = useTransform(d, (v) => -clamp(v, -1, 1) * tilt);
  const z = useTransform(d, (v) => -Math.min(Math.abs(v), 3.2) * 90);
  const scale = useTransform(d, (v) => 1 - 0.14 * Math.min(1, Math.abs(v)));
  const filter = useTransform(d, (v) => {
    const a = Math.min(Math.abs(v), 3);
    return `brightness(${(1 - a * 0.07).toFixed(3)}) blur(${(a * 0.8).toFixed(2)}px)`;
  });
  const opacity = useTransform(d, (v) => {
    const a = Math.abs(v);
    return a < 2.4 ? 1 : Math.max(0, 1 - (a - 2.4));
  });
  const zIndex = useTransform(d, (v) => 100 - Math.round(Math.abs(v) * 10));
  const pointerEvents = useTransform(opacity, (o) => (o < 0.05 ? "none" : "auto"));

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      onClick={(e) => onSelect(i, e)}
      onDragStart={(e) => e.preventDefault()}
      className="absolute left-1/2 top-1/2 cursor-pointer will-change-transform"
      style={{ width: cardWidth, height: cardHeight, marginLeft: -cardWidth / 2, marginTop: -cardHeight / 2, x, rotateY, z, scale, filter, opacity, zIndex, pointerEvents }}
    >
      {children}
    </motion.div>
  );
}

export default function TiltCarousel({
  items = [],
  cardWidth = 300,
  cardHeight = 360,
  tilt = 24,
  perspective = 980,
  autoplay = true,
  delay = 3.8,
  renderItem,
  onActive,
  label = "Carousel",
  className,
}) {
  const still = !!useReducedMotion();
  const n = items.length;
  const pos = useMotionValue(0);
  const target = React.useRef(0);
  const anim = React.useRef(null);
  const root = React.useRef(null);
  const st = React.useRef({ drag: null, moved: false, hover: false, inView: true, hold: 0 });
  const [active, setActive] = React.useState(0);
  const activeRef = React.useRef(0);
  const step = cardWidth * 0.64;
  const spread = cardWidth * 0.12;

  const moveTo = React.useCallback(
    (t) => {
      target.current = t;
      anim.current?.stop();
      anim.current = animate(pos, t, still ? { duration: 0.18, ease: "easeOut" } : { type: "spring", stiffness: 150, damping: 22, mass: 0.9 });
    },
    [pos, still],
  );
  const go = React.useCallback((delta) => moveTo(Math.round(target.current) + delta), [moveTo]);
  const hold = () => {
    st.current.hold = performance.now() + 4000;
  };

  useMotionValueEvent(pos, "change", (p) => {
    if (!n) return;
    const idx = mod(Math.round(p), n);
    if (idx === activeRef.current) return;
    activeRef.current = idx;
    setActive(idx);
    onActive?.(idx);
  });

  /* autoplay: a step every `delay` seconds, paused while hovered / dragged / hidden / just touched */
  React.useEffect(() => {
    if (!autoplay || still || n < 2) return undefined;
    const id = window.setInterval(() => {
      const s = st.current;
      if (s.hover || s.drag || !s.inView || document.hidden || performance.now() < s.hold) return;
      go(1);
    }, delay * 1000);
    return () => window.clearInterval(id);
  }, [autoplay, still, n, delay, go]);

  React.useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => {
      st.current.inView = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const s = st.current;
    s.drag = { id: e.pointerId, x: e.clientX, sx: e.clientX, t: performance.now(), v: 0, captured: false };
    s.moved = false;
    hold();
  };
  const onMove = (e) => {
    const s = st.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    if (!d.captured) {
      if (Math.abs(e.clientX - d.sx) <= 6) return;
      d.captured = true;
      s.moved = true;
      anim.current?.stop();
      root.current?.setPointerCapture?.(e.pointerId);
    }
    const now = performance.now();
    const dx = e.clientX - d.x;
    const dv = -(dx / step) / (Math.max(1, now - d.t) / 1000);
    d.v = d.v * 0.6 + dv * 0.4;
    pos.set(pos.get() - dx / step); // drag sets the position directly
    target.current = pos.get();
    d.x = e.clientX;
    d.t = now;
    hold();
  };
  const onUp = (e) => {
    const s = st.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    s.drag = null;
    if (d.captured) {
      const throwBy = performance.now() - d.t < 90 ? clamp(d.v * 0.22, -2, 2) : 0; // a little throw
      moveTo(Math.round(pos.get() + throwBy));
    } else {
      moveTo(Math.round(target.current));
    }
    hold();
  };

  const select = (i) => {
    const s = st.current;
    if (s.moved) {
      s.moved = false;
      return;
    }
    const d = wrap(i, target.current, n);
    hold();
    if (d < -0.5) go(-1);
    else if (d > 0.5) go(1);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      hold();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      hold();
      go(1);
    }
  };

  if (!n) return null;

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") st.current.hover = true;
      }}
      onPointerLeave={() => {
        st.current.hover = false;
      }}
      onFocus={() => {
        st.current.hover = true;
      }}
      onBlur={() => {
        st.current.hover = false;
      }}
      onKeyDown={onKeyDown}
      className={cn("relative w-full select-none overflow-hidden rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-brand", className)}
      style={{ perspective, touchAction: "pan-y", height: cardHeight + 90 }}
    >
      <span className="sr-only" aria-live="polite">{`Slide ${active + 1} of ${n}`}</span>
      {items.map((it, i) => (
        <Slide
          key={it.id ?? i}
          i={i}
          n={n}
          pos={pos}
          step={step}
          spread={spread}
          tilt={tilt}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          onSelect={select}
          label={`${i + 1} of ${n}`}
        >
          {renderItem ? renderItem(it, i, { active: i === active }) : null}
        </Slide>
      ))}
    </div>
  );
}
