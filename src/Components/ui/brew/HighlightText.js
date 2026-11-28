// src/Components/ui/brew/HighlightText.js
// Inspired by Motion Brew's "Highlight text" (https://motion-brew.com/components/highlight-text, MIT © 2026 Md Eftakher).
// A paragraph where a marker sweeps behind the key phrases one after another as it scrolls into view.
// `parts` is an array of strings (plain) and { mark: "phrase" } objects (highlighted).
import { motion, useReducedMotion } from "motion/react";
import { cn } from "./util";

export default function HighlightText({ parts, className, step = 0.45 }) {
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <p className={cn("text-balance", className)}>
      {parts.map((p, i) => {
        if (typeof p === "string") return <span key={i}>{p}</span>;
        const delay = 0.2 + n++ * step;
        return (
          <motion.mark
            key={i}
            initial={reduce ? false : { backgroundSize: "0% 100%" }}
            whileInView={{ backgroundSize: "100% 100%" }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.9, delay, ease: [0.65, 0, 0.35, 1] }}
            style={{
              backgroundImage: "linear-gradient(rgb(var(--brand) / 0.3), rgb(var(--brand) / 0.3))",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "0 90%",
              backgroundSize: reduce ? "100% 100%" : undefined,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
              color: "inherit",
              padding: "0 0.15em",
              borderRadius: "0.2em",
            }}
          >
            {p.mark}
          </motion.mark>
        );
      })}
    </p>
  );
}
