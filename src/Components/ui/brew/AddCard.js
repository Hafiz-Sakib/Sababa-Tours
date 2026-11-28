// src/Components/ui/brew/AddCard.js
// Port of Motion Brew's "Add card" (https://motion-brew.com/components/add-card, MIT © 2026 Md Eftakher),
// adapted to this project (plain JS, Tailwind v3, day / night tokens).
// An empty state for payments: a dark card floats over a dashed slot and tilts toward the cursor.
// Press the button: last four digits, name and expiry roll in one after another, the card drops into the slot,
// a check pops and the button turns green. Then `onAdd(card)` is called.
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { FiCheck, FiLock, FiPlus } from "react-icons/fi";
import { cn, GLIDE } from "./util";

const randDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
const randExpiry = () => {
  const d = new Date();
  const y = (d.getFullYear() + 2 + Math.floor(Math.random() * 4)) % 100;
  return `${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}/${String(y).padStart(2, "0")}`;
};

/* a value that rolls up out of a blur whenever `show` flips on */
const Roll = ({ show, children, delay = 0, reduce, className = "" }) => (
  <span className={cn("relative inline-block overflow-hidden align-bottom", className)}>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={show ? "v" : "p"}
        className="inline-block"
        initial={reduce ? { opacity: 0 } : { y: "110%", opacity: 0, filter: "blur(4px)" }}
        animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={reduce ? { opacity: 0 } : { y: "-110%", opacity: 0 }}
        transition={{ duration: 0.45, ease: GLIDE, delay: show ? delay : 0 }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  </span>
);

const AddCard = ({
  onAdd,
  holder = "Your name",
  title = "Add your first card",
  text = "Save a card to pay for your trip in one tap. You can change or remove it any time.",
  label = "Add card",
  doneLabel = "Card added",
  note = "Encrypted end to end. We never store your full number.",
  className = "",
}) => {
  const reduce = useReducedMotion();
  const wrap = useRef(null);
  const inView = useInView(wrap, { once: true, margin: "-40px" });
  const [phase, setPhase] = useState("idle"); // idle | loading | rolling | done
  const [data, setData] = useState({ last4: "0000", name: holder, exp: "MM/YY" });
  const [announce, setAnnounce] = useState("");
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* tilt toward the cursor on springs, glare follows */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 18 });
  const sy = useSpring(my, { stiffness: 150, damping: 18 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const rotX = useTransform(sy, [-0.5, 0.5], [12, -12]);
  const glare = useTransform([sx, sy], ([x, y]) => `radial-gradient(circle at ${50 + x * 100}% ${50 + y * 100}%, rgba(255,255,255,0.28), transparent 55%)`);

  const move = (e) => {
    if (reduce || phase === "done") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => {
    mx.set(0);
    my.set(0);
  };

  const start = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("loading");
    setAnnounce("Adding card");
    later(() => {
      setData({ last4: randDigits(4), name: holder, exp: randExpiry() });
      setPhase("rolling");
    }, 700);
    later(() => {
      setPhase("done");
      setAnnounce("Card added");
    }, 700 + 1500);
    later(() => onAdd && onAdd(), 700 + 1500 + 1100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, holder, onAdd]);

  const filled = phase === "rolling" || phase === "done";
  const done = phase === "done";

  return (
    <motion.div
      ref={wrap}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: GLIDE }}
      className={cn("mx-auto w-full max-w-[400px] rounded-[28px] border border-line bg-surface p-3 shadow-card", className)}
    >
      <span className="sr-only" role="status" aria-live="polite">{announce}</span>

      {/* stage */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, ease: GLIDE, delay: 0.05 }}
        onPointerMove={move}
        onPointerLeave={leave}
        className="relative grid h-[224px] place-items-center overflow-hidden rounded-[20px] bg-sandy"
        style={{ perspective: 900 }}
      >
        {/* dashed slot */}
        <motion.div
          aria-hidden
          className="col-start-1 row-start-1 mt-7 ml-2 h-[124px] w-[210px] rounded-2xl border-2 border-dashed border-ink/25"
          animate={{ opacity: done ? 0 : 1 }}
          transition={{ duration: 0.5, delay: done ? 0.35 : 0 }}
        />

        {/* the card */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: -120, rotate: -18, opacity: 0 }}
          animate={
            !inView
              ? undefined
              : reduce
                ? { opacity: 1 }
                : done
                  ? { y: [-12, 18, 12, 14], x: 4, rotate: 0, opacity: 1 }
                  : { y: [-8, 0, -8], rotate: -5, opacity: 1 }
          }
          transition={
            done
              ? { duration: 0.7, ease: "easeOut", times: [0, 0.55, 0.8, 1] }
              : inView
                ? { y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }, rotate: { type: "spring", stiffness: 90, damping: 12 }, opacity: { duration: 0.4 } }
                : undefined
          }
          style={{ rotateX: reduce ? 0 : rotX, rotateY: reduce ? 0 : rotY, transformStyle: "preserve-3d" }}
          className="relative col-start-1 row-start-1 h-[124px] w-[210px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b2e33] to-[#101113] p-3.5 text-white shadow-[0_22px_40px_-14px_rgba(0,0,0,0.55)]"
        >
          <motion.span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: reduce ? "none" : glare }} />
          <div className="flex items-start justify-between">
            <span className="h-[18px] w-6 rounded-[5px] bg-gradient-to-br from-[#e8c985] to-[#b88f3c]" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/70" aria-hidden>
              <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
            </svg>
          </div>
          <p className="mt-3.5 flex gap-2.5 font-mono text-[11px] tracking-[0.18em] text-white/80">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <Roll show={filled} reduce={reduce} delay={0}>{filled ? data.last4 : "••••"}</Roll>
          </p>
          <div className="mt-3 flex items-end justify-between text-[9px] leading-tight">
            <div className="min-w-0">
              <p className="text-white/45">Cardholder</p>
              <Roll show={filled} reduce={reduce} delay={0.25} className="max-w-[120px] truncate text-[11px] font-semibold">
                {filled ? data.name : "Your name"}
              </Roll>
            </div>
            <div className="text-right">
              <p className="text-white/45">Expires</p>
              <Roll show={filled} reduce={reduce} delay={0.5} className="text-[11px] font-semibold">
                {filled ? data.exp : "MM/YY"}
              </Roll>
            </div>
          </div>

          {/* check pops on the card */}
          <AnimatePresence>
            {done && (
              <motion.span
                initial={{ scale: 0, rotate: -40 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.3 }}
                className="absolute bottom-2.5 left-1/2 -ml-3.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-lg"
              >
                <FiCheck size={15} strokeWidth={3.5} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* copy */}
      <div className="px-3 pb-2 pt-5">
        <motion.h3
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.6, ease: GLIDE, delay: 0.25 }}
          className="text-lg font-black text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </motion.h3>
        <motion.p
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.6, ease: GLIDE, delay: 0.35 }}
          className="mt-1.5 text-sm leading-relaxed text-muted"
        >
          {text}
        </motion.p>

        <button
          type="button"
          onClick={start}
          disabled={phase !== "idle"}
          className={cn(
            "group mt-5 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-bold text-white transition-colors duration-500 disabled:cursor-default",
            done ? "bg-emerald-600" : "bg-btn hover:opacity-90",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={phase === "loading" || phase === "rolling" ? "busy" : done ? "done" : "idle"}
              initial={reduce ? { opacity: 0 } : { y: 22, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: -22, opacity: 0 }}
              transition={{ duration: 0.3, ease: GLIDE }}
              className="flex items-center gap-2"
            >
              {phase === "loading" || phase === "rolling" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Adding…
                </>
              ) : done ? (
                <>
                  <FiCheck size={16} strokeWidth={3} /> {doneLabel}
                </>
              ) : (
                <>
                  <FiPlus size={16} className="transition-transform duration-300 group-hover:rotate-90" /> {label}
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <FiLock size={11} /> {note}
        </p>
      </div>
    </motion.div>
  );
};

export default AddCard;
