// src/Components/Utilities/payment.js
// One place that answers "how much is paid / due / when does the hold end" for every screen
// (My Bookings, Billing page, Invoice, Admin dashboard).
// The server is the authority (see docs/BACKEND_PAYMENT_RULES.md); this file mirrors its rules
// so the screens can show the right buttons, timers and numbers.
import { useEffect, useState } from "react";

export const ADVANCE_PERCENT = 30; // advance the client must pay once the admin confirms
export const HOLD_HOURS = 72; // unpaid advance => booking auto-cancels after this many hours
// true  = the advance is asked only when that trip date is still free in the schedule
// false = the advance is asked for every confirmation
export const ADVANCE_ONLY_WHEN_SCHEDULE_FREE = true;

const HOUR = 3600000;
const DAY = 24 * HOUR;

export const money = (n) => "BDT " + Math.round(Number(n || 0)).toLocaleString("en-US");

export const totalOf = (b) => Number(b.totalAmount || 0);
export const advanceOf = (b) =>
  Number(b.advanceAmount) > 0
    ? Number(b.advanceAmount)
    : Math.ceil((totalOf(b) * ADVANCE_PERCENT) / 100);
export const paymentsOf = (b) => (Array.isArray(b.payments) ? b.payments : []);
export const paidOf = (b) =>
  Array.isArray(b.payments)
    ? b.payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    : Number(b.paidAmount || 0);

/* when the unpaid-advance hold ends (ms) or null */
export const holdEnd = (b) => {
  if (b.payDeadline) return new Date(b.payDeadline).getTime();
  if (b.confirmedAt) return new Date(b.confirmedAt).getTime() + HOLD_HOURS * HOUR;
  return null;
};

/* a booking still waiting for its advance, but whose time ran out: the server cancels it, the screen already shows it as cancelled */
export const withLiveStatus = (b, now = Date.now()) => {
  if (b.status !== "awaiting_payment") return b;
  const end = holdEnd(b);
  if (end && end <= now && paidOf(b) < advanceOf(b)) {
    return { ...b, status: "cancelled", cancelReason: b.cancelReason || "advance_not_paid" };
  }
  return b;
};

export const moneyOf = (b) => {
  const total = totalOf(b);
  const advance = advanceOf(b);
  const paid = paidOf(b);
  const closed = b.status === "cancelled";
  return {
    total,
    advance,
    paid,
    closed,
    balance: closed ? 0 : Math.max(0, total - paid),
    advanceDue: closed ? 0 : Math.max(0, advance - paid),
    advanceMet: paid >= advance,
    paidInFull: total > 0 && paid >= total,
    pct: total > 0 ? Math.min(100, (paid / total) * 100) : 0,
    refundDue: closed ? paid : 0,
  };
};

export const canPay = (b) =>
  (b.status === "awaiting_payment" || b.status === "confirmed") && moneyOf(b).balance > 0;

export const invoiceNo = (b) =>
  b.invoiceNo || "INV-" + String(b._id || "").slice(-6).toUpperCase();

/* "paid in full" is a display state on top of confirmed */
export const displayStatus = (b) => {
  if (b.status === "confirmed" && moneyOf(b).paidInFull) return "paid";
  return b.status;
};

const sameDay = (a, b) => {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

/* admin side: is the trip date still empty in the schedule (no other confirmed / awaiting-advance booking that day)? */
export const scheduleFree = (b, all) =>
  !all.some(
    (x) =>
      x._id !== b._id &&
      (x.status === "confirmed" || x.status === "awaiting_payment") &&
      sameDay(x.preferredDate, b.preferredDate),
  );

export const needsAdvance = (b, all) => !ADVANCE_ONLY_WHEN_SCHEDULE_FREE || scheduleFree(b, all);

/* the booking as the screen should show it right after the admin confirms (used when the server reply has no booking in it) */
export const confirmLocally = (b, all) => {
  if (!needsAdvance(b, all)) return { ...b, status: "confirmed", advanceRequired: false };
  const now = Date.now();
  return {
    ...b,
    status: "awaiting_payment",
    advanceRequired: true,
    advanceAmount: Math.ceil((totalOf(b) * ADVANCE_PERCENT) / 100),
    confirmedAt: new Date(now).toISOString(),
    payDeadline: new Date(now + HOLD_HOURS * HOUR).toISOString(),
  };
};

/* the booking as the screen should show it right after a payment (fallback when the server reply has no booking) */
export const payLocally = (b, amount, method) => {
  const payments = [
    ...paymentsOf(b),
    { _id: "local-" + Date.now(), amount, method, paidAt: new Date().toISOString() },
  ];
  const next = { ...b, payments, paidAmount: paidOf(b) + amount };
  if (next.status === "awaiting_payment" && next.paidAmount >= advanceOf(b)) {
    next.status = "confirmed";
    next.payDeadline = null;
  }
  return next;
};

/* countdown pieces */
export const parts = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};
export const pad = (n) => String(n).padStart(2, "0");
export const shortLeft = (ms) => {
  const { d, h, m } = parts(ms);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};
export const holdLevel = (ms) => (ms <= 0 ? "over" : ms < 6 * HOUR ? "critical" : ms < DAY ? "urgent" : "calm");

/* re-render every `every` ms */
export const useNow = (every = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
};

export const fmtDate = (d, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-GB", opts) : "—";
export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
