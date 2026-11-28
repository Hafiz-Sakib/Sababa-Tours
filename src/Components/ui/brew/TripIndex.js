// src/Components/ui/brew/TripIndex.js
// Inspired by Motion Brew's "Project index" (https://motion-brew.com/components/project-index, MIT © 2026 Md Eftakher),
// adapted to this project (plain JS, Tailwind v3, day / night tokens).
// An editorial index: a list of trips on the left, one large photo on the right. Hover or focus a row and its
// photo is revealed over the previous one with a wipe. On phones every row carries its own thumbnail.
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { FiArrowUpRight } from "react-icons/fi";
import { cn, GLIDE } from "./util";

export default function TripIndex({ items, onSelect, className }) {
  const [{ active, prev }, setPair] = useState({ active: 0, prev: 0 });
  const reduce = useReducedMotion();

  // the photo that was showing stays underneath while the new one wipes in over it
  const activate = (i) => setPair((p) => (i === p.active ? p : { active: i, prev: p.active }));

  return (
    <div className={cn("grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]", className)}>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((it, i) => {
          const on = i === active;
          // a row is a link when it has `to`, otherwise a button that calls onSelect(i)
          const Row = it.to ? Link : "button";
          const rowProps = it.to ? { to: it.to } : { type: "button", onClick: () => onSelect && onSelect(i) };
          return (
            <li key={it.title}>
              <Row
                {...rowProps}
                onMouseEnter={() => activate(i)}
                onFocus={() => activate(i)}
                className="group flex w-full items-center gap-4 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand md:gap-6 md:py-6"
              >
                <img src={it.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover lg:hidden" />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-2xl font-black leading-tight transition-colors duration-300 md:text-4xl", on ? "text-ink" : "text-ink/45 group-hover:text-ink")} style={{ fontFamily: "var(--font-display)" }}>
                    {it.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{it.meta}</span>
                </span>
                <motion.span
                  aria-hidden
                  animate={{ x: on ? 0 : -8, opacity: on ? 1 : 0.35 }}
                  transition={{ duration: 0.35, ease: GLIDE }}
                  className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors", on ? "border-btn bg-btn text-white" : "border-line text-muted")}
                >
                  <FiArrowUpRight />
                </motion.span>
              </Row>
            </li>
          );
        })}
      </ul>

      <div aria-hidden className="relative hidden aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-sandy shadow-card lg:sticky lg:top-28 lg:block">
        <img src={items[prev].image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        {/* the wipe: the new photo mounts with a clip that opens upward */}
        <motion.div
          key={active}
          initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 0.7, ease: GLIDE }}
          className="absolute inset-0"
        >
          <img src={items[active].image} alt="" draggable={false} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep/75 via-transparent to-transparent" />
          <p className="absolute bottom-6 left-6 right-6 text-sm font-semibold text-white">{items[active].caption}</p>
        </motion.div>
      </div>
    </div>
  );
}
