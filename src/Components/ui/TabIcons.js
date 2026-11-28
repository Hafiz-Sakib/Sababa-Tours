// src/Components/ui/TabIcons.js
// Animated nav icons (they play while `active`). Icon shapes are from Lucide (ISC); the animation pattern follows
// Motion Brew's TabBar / lucide-animated (MIT).
import * as React from "react";
import { motion, useAnimation, useReducedMotion } from "motion/react";

const cn = (...a) => a.filter(Boolean).join(" ");

function useIcon(active) {
  const controls = useAnimation();
  const reduced = useReducedMotion();
  React.useEffect(() => {
    if (reduced) return;
    controls.start(active ? "animate" : "normal");
  }, [active, reduced, controls]);
  return controls;
}

const Shell = ({ className, children, strokeWidth = 2, motionProps }) => {
  const Svg = motionProps ? motion.svg : "svg";
  return (
    <span className={cn("inline-grid h-6 w-6 shrink-0 place-items-center align-middle [&>svg]:h-full [&>svg]:w-full", className)}>
      <Svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...motionProps}>
        {children}
      </Svg>
    </span>
  );
};

const draw = { normal: { pathLength: 1, opacity: 1 }, animate: { opacity: [0, 1], pathLength: [0, 1] } };

export function HomeIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth}>
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <motion.path animate={c} d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" transition={{ duration: 0.6, opacity: { duration: 0.2 } }} variants={draw} />
    </Shell>
  );
}

/* Packages: the box hops, the seam redraws */
export function PackageIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth} motionProps={{ animate: c, transition: { duration: 0.5, ease: "easeInOut" }, variants: { normal: { y: 0 }, animate: { y: [0, -3, 0] } } }}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
      <path d="m7.5 4.27 9 5.15" />
    </Shell>
  );
}

/* Destinations: the pin drops in */
export function MapPinIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth} motionProps={{ animate: c, transition: { duration: 0.55, ease: "easeInOut" }, variants: { normal: { y: 0 }, animate: { y: [0, -5, 0, -2, 0] } } }}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </Shell>
  );
}

/* Journal: the spine redraws like a page turn */
export function BookIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth}>
      <motion.path animate={c} d="M12 7v14" transition={{ duration: 0.5 }} variants={draw} />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Shell>
  );
}

/* Guide: the needle swings */
export function CompassIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <motion.polygon animate={c} points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" style={{ transformBox: "fill-box", transformOrigin: "center" }} transition={{ duration: 0.7, ease: "easeInOut" }} variants={{ normal: { rotate: 0 }, animate: { rotate: [0, 70, -25, 0] } }} />
    </Shell>
  );
}

/* About: the second person waves in */
export function UsersIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <motion.path animate={c} d="M22 21v-2a4 4 0 0 0-3-3.87" transition={{ duration: 0.5 }} variants={draw} />
      <motion.path animate={c} d="M16 3.13a4 4 0 0 1 0 7.75" transition={{ duration: 0.5, delay: 0.1 }} variants={draw} />
    </Shell>
  );
}

/* Contact: the flap redraws */
export function MailIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <motion.path animate={c} d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" transition={{ duration: 0.6, opacity: { duration: 0.2 } }} variants={draw} />
    </Shell>
  );
}

/* My bookings: the ticket wiggles */
export function TicketIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth} motionProps={{ animate: c, transition: { duration: 0.6, ease: "easeInOut" }, variants: { normal: { rotate: 0 }, animate: { rotate: [0, -8, 8, -4, 0] } } }}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </Shell>
  );
}

/* Admin: the check draws */
export function ShieldIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <motion.path animate={c} d="m9 12 2 2 4-4" transition={{ duration: 0.5 }} variants={draw} />
    </Shell>
  );
}

/* Profile: the head nods */
export function UserIcon({ active, className, strokeWidth }) {
  const c = useIcon(active);
  return (
    <Shell className={className} strokeWidth={strokeWidth}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <motion.circle animate={c} cx="12" cy="7" r="4" transition={{ duration: 0.5, ease: "easeInOut" }} variants={{ normal: { y: 0 }, animate: { y: [0, -2, 0, -1, 0] } }} />
    </Shell>
  );
}

export const ICONS = { home: HomeIcon, packages: PackageIcon, places: MapPinIcon, journal: BookIcon, guide: CompassIcon, about: UsersIcon, contact: MailIcon, bookings: TicketIcon, admin: ShieldIcon, profile: UserIcon };
