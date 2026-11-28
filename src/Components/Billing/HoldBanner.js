// src/Components/Billing/HoldBanner.js
// "Pay the advance within 72 hours" banner with a live countdown, plus a tiny chip for the admin lists.
// onExpire() fires once when the time runs out so the list reloads (the server cancels the booking).
import { useEffect, useRef } from "react";
import { FiArrowRight, FiClock } from "react-icons/fi";
import { motion } from "../ui/Motion";
import {
  HOLD_HOURS,
  advanceOf,
  holdEnd,
  holdLevel,
  money,
  moneyOf,
  pad,
  parts,
  paidOf,
  shortLeft,
  useNow,
} from "../Utilities/payment";

const LOOK = {
  calm: { box: "border-amber-300/70 bg-amber-50 text-amber-900", bar: "bg-amber-500", icon: "bg-amber-500", title: "Pay the advance to keep your date" },
  urgent: { box: "border-orange-300/70 bg-orange-50 text-orange-900", bar: "bg-orange-500", icon: "bg-orange-500", title: "Less than 24 hours left to pay" },
  critical: { box: "border-red-300/70 bg-red-50 text-red-900", bar: "bg-red-500", icon: "bg-red-500", title: "Last hours: pay now or the booking is cancelled" },
  over: { box: "border-red-300/70 bg-red-50 text-red-900", bar: "bg-red-500", icon: "bg-red-500", title: "Time is up: cancelling the booking…" },
};
const DARK = "dark:!bg-surface dark:!text-ink dark:!border-line";

const useExpiry = (end, active, onExpire) => {
  const fired = useRef(false);
  useEffect(() => {
    if (!active || !end || !onExpire) return;
    const wait = end - Date.now();
    if (wait <= 0) {
      if (!fired.current) {
        fired.current = true;
        const t = setTimeout(onExpire, 1500);
        return () => clearTimeout(t);
      }
      return;
    }
    fired.current = false;
    const t = setTimeout(() => {
      fired.current = true;
      onExpire();
    }, wait + 1500);
    return () => clearTimeout(t);
  }, [end, active, onExpire]);
};

const Clock = ({ left }) => {
  const { d, h, m, s } = parts(left);
  const unit = (v, u, show = true) =>
    show && (
      <span className="inline-flex items-baseline">
        <b className="text-xl tabular-nums sm:text-2xl">{u === "d" ? v : pad(v)}</b>
        <span className="ml-0.5 mr-2 text-[10px] font-black uppercase opacity-60">{u}</span>
      </span>
    );
  return (
    <span role="timer" className="inline-flex flex-wrap items-baseline">
      {unit(d, "d", d > 0)}
      {unit(h, "h")}
      {unit(m, "m")}
      {unit(s, "s")}
    </span>
  );
};

/* full banner: billing page and the booking card */
export const HoldBanner = ({ b, onPay, onExpire, compact = false }) => {
  const now = useNow(1000);
  const end = holdEnd(b);
  const active = b.status === "awaiting_payment" && paidOf(b) < advanceOf(b);
  useExpiry(end, active, onExpire);
  if (!active || !end) return null;

  const left = end - now;
  const level = holdLevel(left);
  const look = LOOK[level];
  const due = moneyOf(b).advanceDue;
  const progress = Math.max(0, Math.min(1, left / (HOLD_HOURS * 3600000)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role={level === "calm" ? "status" : "alert"}
      className={`rounded-2xl border p-4 ${look.box} ${DARK}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${look.icon} ${level === "critical" ? "animate-pulse" : ""}`}>
          <FiClock size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{look.title}</p>
          <div className="mt-0.5">
            <Clock left={Math.max(0, left)} />
          </div>
          {!compact && (
            <p className="mt-1 text-xs opacity-75">
              Pay at least <b>{money(due)}</b> (30% advance) within {HOLD_HOURS} hours. If it is not paid in time the booking is
              cancelled automatically.
            </p>
          )}
        </div>
        {onPay && level !== "over" && (
          <button
            onClick={onPay}
            className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-black text-page transition hover:opacity-85 sm:inline-flex"
          >
            Pay {money(due)} <FiArrowRight />
          </button>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10" aria-hidden>
        <motion.div
          className={`h-full rounded-full ${look.bar}`}
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {onPay && level !== "over" && (
        <button
          onClick={onPay}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-black text-page transition hover:opacity-85 sm:hidden"
        >
          Pay {money(due)} <FiArrowRight />
        </button>
      )}
    </motion.div>
  );
};

/* tiny chip for the admin tables */
export const HoldChip = ({ b }) => {
  const now = useNow(30000);
  const end = holdEnd(b);
  if (b.status !== "awaiting_payment" || !end) return null;
  const left = end - now;
  const level = holdLevel(left);
  const tone = {
    calm: "bg-amber-100 text-amber-800",
    urgent: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-700",
    over: "bg-red-100 text-red-700",
  }[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`} title="Auto-cancels when this runs out">
      <FiClock size={11} />
      {level === "over" ? "Cancelling…" : `Auto-cancel in ${shortLeft(left)}`}
    </span>
  );
};

export default HoldBanner;
