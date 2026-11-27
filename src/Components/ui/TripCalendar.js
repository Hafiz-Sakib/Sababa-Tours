// src/Components/ui/TripCalendar.js
// Month calendar (Nikah-style): a soft ink disc springs to the picked day, months slide the way you travel.
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const TripCalendar = ({ value, onChange, min, maxDays = 365 }) => {
  const minDate = new Date(`${min}T00:00`);
  const max = iso(new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + maxDays));
  const start = value ? new Date(`${value}T00:00`) : minDate;
  const [view, setView] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const [dir, setDir] = useState(1);
  const y = view.getFullYear();
  const m = view.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const nav = (d) => {
    setDir(d);
    setView(new Date(y, m + d, 1));
  };
  const canPrev = iso(new Date(y, m, 0)) >= min;
  const canNext = iso(new Date(y, m + 1, 1)) <= max;
  const navBtn =
    "flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line transition enabled:hover:bg-sandy enabled:active:scale-90 disabled:opacity-30";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => nav(-1)} disabled={!canPrev} aria-label="Previous month" className={navBtn}>
          <FiChevronLeft />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={`${y}-${m}`}
            initial={{ opacity: 0, y: dir * 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dir * -10 }}
            transition={{ duration: 0.15 }}
            className="font-semibold text-ink"
          >
            {view.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </motion.p>
        </AnimatePresence>
        <button type="button" onClick={() => nav(1)} disabled={!canNext} aria-label="Next month" className={navBtn}>
          <FiChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
        {DOW.map((d) => (
          <span key={d} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const k = iso(new Date(y, m, d));
          const off = k < min || k > max;
          const sel = value === k;
          return (
            <button
              key={k}
              type="button"
              disabled={off}
              onClick={() => onChange(k)}
              aria-pressed={sel}
              className={`relative flex aspect-square items-center justify-center rounded-2xl text-sm font-medium transition ${
                sel
                  ? "text-white"
                  : off
                    ? "text-muted/40"
                    : "bg-sandy text-ink hover:bg-lagoon/10 hover:text-lagoon-ink"
              }`}
            >
              {sel && (
                <motion.span
                  layoutId="trip-cal-sel"
                  className="absolute inset-0 rounded-2xl bg-btn shadow-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{d}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TripCalendar;
