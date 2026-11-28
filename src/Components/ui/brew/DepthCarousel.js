// src/Components/ui/brew/DepthCarousel.js
// Inspired by Motion Brew's "Depth carousel" (https://motion-brew.com/components/depth-carousel, MIT © 2026 Md Eftakher).
// A stack of cards receding into depth: the front card is sharp, the ones behind shrink, rise and blur with distance.
// Arrow buttons, the arrow keys, a click on a card behind, or a swipe bring the next card forward. Loops.
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { cn } from "./util";

const PEEK = 4;

export default function DepthCarousel({ cards, className, label = "Highlights" }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const n = cards.length;
  const go = (d) => setActive((a) => (a + d + n) % n);

  return (
    <div
      className={cn("mx-auto w-full max-w-md", className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div className="relative h-[27rem] pt-16 sm:h-[29rem]" style={{ perspective: 1200 }}>
        {cards.map((c, i) => {
          const o = (i - active + n) % n; // 0 = front
          const hidden = o >= PEEK;
          return (
            <motion.article
              key={c.title + i}
              aria-hidden={o !== 0}
              initial={false}
              animate={{
                y: -o * 20,
                scale: 1 - o * 0.07,
                opacity: hidden ? 0 : 1 - o * 0.16,
                filter: `blur(${hidden ? 4 : o * 1.6}px)`,
              }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 190, damping: 25 }}
              style={{ zIndex: n - o, transformOrigin: "50% 0%", pointerEvents: hidden ? "none" : "auto" }}
              drag={o === 0 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
              onClick={() => o !== 0 && !hidden && setActive(i)}
              className="absolute inset-x-0 bottom-0 top-16 cursor-pointer overflow-hidden rounded-[2rem] border border-line bg-surface shadow-card"
            >
              <img src={c.image} alt="" draggable={false} loading="lazy" className="h-[55%] w-full object-cover" />
              <div className="p-6">
                <p className="text-xs font-bold text-brand-ink">{c.kicker}</p>
                <h3 className="mt-1 text-2xl font-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {c.title}
                </h3>
                {c.text && <p className="mt-2 text-sm text-muted">{c.text}</p>}
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold tabular-nums text-muted" aria-live="polite">
          {active + 1} of {n}
        </p>
        <div className="flex gap-2">
          {[
            [-1, FiArrowLeft, "Previous"],
            [1, FiArrowRight, "Next"],
          ].map(([d, Icon, name]) => (
            <button key={name} type="button" onClick={() => go(d)} aria-label={name} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink transition hover:bg-btn hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <Icon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
