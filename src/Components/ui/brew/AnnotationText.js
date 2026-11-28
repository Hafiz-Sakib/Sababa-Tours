// src/Components/ui/brew/AnnotationText.js
// Inspired by Motion Brew's "Annotation text" (https://motion-brew.com/components/annotation-text, MIT © 2026 Md Eftakher).
// Hand-drawn pen marks draw themselves around words once they scroll into view, one after another.
// `parts` = strings (plain) and { text, mark: "circle" | "underline" | "box" } objects.
import { motion, useReducedMotion } from "motion/react";
import { cn } from "./util";

const PATHS = {
  circle: "M6 22 C 4 6, 46 1, 92 7 C 108 11, 106 34, 52 37 C 10 39, -2 24, 14 11",
  underline: "M2 9 C 25 4, 55 11, 98 5",
  box: "M3 5 L 97 3 L 98 35 L 4 37 Z",
};

const Mark = ({ text, mark, delay, reduce }) => {
  const underline = mark === "underline";
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{text}</span>
      <svg
        aria-hidden
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className={cn("pointer-events-none absolute overflow-visible text-brand", underline ? "-bottom-2 left-0 h-3 w-full" : "-inset-x-2 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1rem)]")}
      >
        <motion.path
          d={PATHS[mark]}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.85, delay, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </span>
  );
};

export default function AnnotationText({ parts, className, step = 0.7 }) {
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <p className={cn("leading-[1.9]", className)}>
      {parts.map((p, i) => (typeof p === "string" ? <span key={i}>{p}</span> : <Mark key={i} {...p} delay={0.2 + n++ * step} reduce={reduce} />))}
    </p>
  );
}
