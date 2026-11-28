import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "./util";

/* Tilt card: tips in 3D toward the cursor on a spring, lifts a touch, and catches a glare that slides the other way.
   Touch and reduced-motion users get a flat card. (Port of Motion Brew's "Tilt card".) */
const DEFAULT_SPRING = { stiffness: 260, damping: 22, mass: 0.7 };

export default function GlareTiltCard({
  children,
  className,
  maxTilt = 10,
  hoverScale = 1.02,
  glare = true,
  glareOpacity = 0.3,
  perspective = 900,
  spring = DEFAULT_SPRING,
  style,
  onPointerMove,
  onPointerLeave,
  ...props
}) {
  const reduceMotion = useReducedMotion();
  const nx = useMotionValue(0.5);
  const ny = useMotionValue(0.5);
  const hover = useSpring(0, spring);

  const rotateX = useSpring(useTransform(ny, [0, 1], [maxTilt, -maxTilt]), spring);
  const rotateY = useSpring(useTransform(nx, [0, 1], [-maxTilt, maxTilt]), spring);
  const scale = useTransform(hover, [0, 1], [1, hoverScale]);

  const glareX = useTransform(nx, [0, 1], [100, 0]);
  const glareY = useTransform(ny, [0, 1], [100, 0]);
  const glareAlpha = useTransform(hover, [0, 1], [0, glareOpacity]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${glareAlpha}), transparent 60%)`;

  const handlePointerMove = (event) => {
    onPointerMove?.(event);
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    nx.set((event.clientX - rect.left) / rect.width);
    ny.set((event.clientY - rect.top) / rect.height);
    hover.set(1);
  };
  const handlePointerLeave = (event) => {
    onPointerLeave?.(event);
    nx.set(0.5);
    ny.set(0.5);
    hover.set(0);
  };

  return (
    <div style={{ perspective }} className="block h-full">
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={reduceMotion ? style : { rotateX, rotateY, scale, transformStyle: "preserve-3d", ...style }}
        className={cn("relative h-full overflow-hidden rounded-3xl will-change-transform", className)}
        {...props}
      >
        {children}
        {glare && !reduceMotion && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: glareBg }} />
        )}
      </motion.div>
    </div>
  );
}
