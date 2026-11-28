/* Shared helpers for the Motion Brew cards (https://motion-brew.com, MIT License, © 2026 Md Eftakher).
   The components in this folder are ports of Motion Brew's Avatar testimonial, Tilt card, Rolling card stack,
   Orbit card and Score card, adapted to this project (plain JS, Tailwind v3, the day / night colour tokens). */
export const cn = (...a) => a.flat(Infinity).filter(Boolean).join(" ");
export const GLIDE = [0.22, 1, 0.36, 1];
export const FILL = [0.5, 1, 0.89, 1];
export const PALETTE = ["#26A59E", "#0F5C46", "#E2A33B", "#3B9EEA", "#E0607E", "#8B7CF6"];
export const initials = (name) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const CARD_SHADOW = "shadow-card border border-line";
