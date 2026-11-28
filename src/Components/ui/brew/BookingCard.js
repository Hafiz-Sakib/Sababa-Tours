// src/Components/ui/brew/BookingCard.js
// Inspired by Motion Brew's "Booking card" (https://motion-brew.com/components/booking-card, MIT © 2026 Md Eftakher).
// Pick a month, a day and a time: an ink pill glides between choices, the times unfold, and once the request is sent
// the card turns into a confirmation with a check that draws itself.
// `onConfirm({ date, time, name, email })` must return a promise; reject it to show an error and keep the form.
import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn, GLIDE } from "./util";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const same = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function BookingCard({ times = ["10:00 AM", "12:00 PM", "3:00 PM", "5:00 PM"], onConfirm, className }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [day, setDay] = useState(null);
  const [time, setTime] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const reduce = useReducedMotion();

  const first = view.getDay();
  const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const canBack = view > new Date(today.getFullYear(), today.getMonth(), 1);
  const ready = day && time && name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && state !== "sending";

  const submit = async () => {
    setState("sending");
    try {
      await onConfirm({ date: day, time, name: name.trim(), email: email.trim() });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  const reset = () => {
    setDay(null);
    setTime(null);
    setState("idle");
  };

  const field = "w-full rounded-xl border border-line bg-page-alt px-4 py-3 text-sm outline-none transition focus:border-brand";

  return (
    <div className={cn("w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-7", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {state === "sent" ? (
          <motion.div key="sent" initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: GLIDE }} className="py-8 text-center">
            <svg viewBox="0 0 64 64" className="mx-auto h-20 w-20 text-brand" aria-hidden>
              <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <motion.path d="M19 33 l9 9 l18 -19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.2 }} />
            </svg>
            <h3 className="mt-5 text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              Call request sent
            </h3>
            <p className="mt-2 text-sm text-muted">
              You asked for {day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} around {time}. We will confirm the slot by email.
            </p>
            <button type="button" onClick={reset} className="mt-6 text-sm font-bold text-brand-ink underline underline-offset-4">
              Request another time
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }}>
            <LayoutGroup id="booking-card">
              <div className="flex items-center justify-between">
                <p className="text-lg font-black" style={{ fontFamily: "var(--font-display)" }}>
                  {view.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </p>
                <div className="flex gap-1.5">
                  <button type="button" aria-label="Previous month" disabled={!canBack} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line transition hover:bg-sandy disabled:opacity-30">
                    <FiChevronLeft />
                  </button>
                  <button type="button" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-full border border-line transition hover:bg-sandy">
                    <FiChevronRight />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-y-1 text-center text-[11px] font-bold text-muted">
                {DAYS.map((d) => (
                  <span key={d} className="py-1">
                    {d}
                  </span>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <span key={`e${i}`} />;
                  const past = d <= today;
                  const on = same(d, day);
                  return (
                    <button key={i} type="button" disabled={past} onClick={() => setDay(d)} aria-pressed={on} className={cn("relative mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors", past ? "text-ink/25" : on ? "text-white" : "text-ink hover:bg-sandy")}>
                      {on && <motion.span layoutId="book-day" transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute inset-0 rounded-full bg-btn" />}
                      <span className="relative">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {day && (
                  <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: GLIDE }} className="overflow-hidden">
                    <p className="mb-2 mt-5 text-xs font-bold text-muted">Time (Bangladesh)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {times.map((t) => (
                        <button key={t} type="button" onClick={() => setTime(t)} aria-pressed={time === t} className={cn("relative rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors", time === t ? "border-transparent text-white" : "border-line text-ink hover:bg-sandy")}>
                          {time === t && <motion.span layoutId="book-time" transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute inset-0 rounded-xl bg-btn" />}
                          <span className="relative">{t}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2.5">
                      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" aria-label="Your name" />
                      <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" aria-label="Your email" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>

            {state === "error" && <p className="mt-3 text-sm font-semibold text-red-500">Could not send the request. Please try again.</p>}
            <button type="button" disabled={!ready} onClick={submit} className="mt-5 w-full rounded-2xl bg-btn px-6 py-4 text-sm font-black text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40">
              {state === "sending" ? "Sending…" : day && time ? "Request this call" : "Pick a day and a time"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
