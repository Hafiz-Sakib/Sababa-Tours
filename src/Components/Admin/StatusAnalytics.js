// src/Components/Admin/StatusAnalytics.js
// "Order analytics" for the admin overview: where every booking stands, shown as graphs.
//   1. Donut: share of bookings by status (hover a slice or legend row to focus it)
//   2. Stacked columns: bookings requested per month, split by status (last 6 months)
//   3. Funnel: requests -> approved -> advance paid -> paid in full
// Plain SVG / CSS + motion, no chart library.
import { useMemo, useState } from "react";
import { FiBarChart2 } from "react-icons/fi";
import { motion } from "../ui/Motion";
import { moneyOf } from "../Utilities/payment";

const STATUSES = [
  { id: "confirmed", label: "Confirmed", color: "#10b981" },
  { id: "awaiting_payment", label: "Awaiting advance", color: "#f97316" },
  { id: "pending", label: "Pending", color: "#fbbf24" },
  { id: "cancelled", label: "Cancelled", color: "#f87171" },
];
const EASE = [0.16, 1, 0.3, 1];
const serif = { fontFamily: "var(--font-display)" };

const Card = ({ title, sub, children, className = "" }) => (
  <div className={`rounded-3xl border border-line bg-surface p-6 ${className}`}>
    <h3 className="font-black text-ink" style={serif}>{title}</h3>
    {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    <div className="mt-5">{children}</div>
  </div>
);

/* ───────── donut ───────── */
const Donut = ({ counts, total }) => {
  const [hover, setHover] = useState(null);
  const R = 70;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = STATUSES.map((s) => {
    const n = counts[s.id] || 0;
    const len = total ? (n / total) * C : 0;
    const seg = { ...s, n, len, offset: -acc };
    acc += len;
    return seg;
  });
  const focus = segs.find((s) => s.id === hover);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-[190px] w-[190px] shrink-0">
        <svg viewBox="0 0 190 190" className="h-full w-full -rotate-90" role="img" aria-label="Bookings by status">
          <circle cx="95" cy="95" r={R} fill="none" strokeWidth="22" className="stroke-sandy" />
          {segs.map((s, i) =>
            s.n > 0 ? (
              <motion.circle
                key={s.id}
                cx="95"
                cy="95"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === s.id ? 28 : 22}
                strokeLinecap="butt"
                strokeDashoffset={s.offset}
                initial={{ strokeDasharray: `0 ${C}`, opacity: 0.4 }}
                animate={{
                  strokeDasharray: `${Math.max(0, s.len - (segs.filter((x) => x.n > 0).length > 1 ? 3 : 0))} ${C}`,
                  opacity: hover && hover !== s.id ? 0.35 : 1,
                }}
                transition={{ duration: 1, ease: EASE, delay: i * 0.12 }}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer", transition: "stroke-width .2s" }}
              />
            ) : null,
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-black text-ink" style={serif}>{focus ? focus.n : total}</p>
            <p className="max-w-[90px] text-[10px] font-bold uppercase tracking-widest text-muted">{focus ? focus.label : "Bookings"}</p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {segs.map((s) => (
          <li
            key={s.id}
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
            className={`flex cursor-default items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition ${hover === s.id ? "bg-sandy" : ""}`}
          >
            <span className="flex items-center gap-2.5 text-muted">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="flex items-baseline gap-2">
              <b className="text-ink">{s.n}</b>
              <span className="w-10 text-right text-xs text-muted">{total ? Math.round((s.n / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ───────── stacked columns per month ───────── */
const Columns = ({ bookings }) => {
  const [hover, setHover] = useState(null);
  const months = useMemo(() => {
    const now = new Date();
    const list = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-GB", { month: "short" }), counts: {}, total: 0 };
    });
    const idx = Object.fromEntries(list.map((m, i) => [m.key, i]));
    bookings.forEach((b) => {
      const d = new Date(b.createdAt || b.preferredDate);
      const m = list[idx[`${d.getFullYear()}-${d.getMonth()}`]];
      if (!m) return;
      m.counts[b.status] = (m.counts[b.status] || 0) + 1;
      m.total += 1;
    });
    return list;
  }, [bookings]);

  const max = Math.max(1, ...months.map((m) => m.total));
  const ticks = [max, Math.round(max / 2), 0].filter((v, i, a) => a.indexOf(v) === i);
  const H = 170;

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex h-[170px] flex-col justify-between text-right text-[10px] font-bold text-muted">
          {ticks.map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[170px] flex-col justify-between" aria-hidden>
            {ticks.map((t) => <span key={t} className="border-t border-dashed border-line" />)}
          </div>
          <div className="relative flex h-[170px] items-end gap-2 sm:gap-4">
            {months.map((m, mi) => (
              <div
                key={m.key}
                className="relative flex h-full flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHover(mi)}
                onMouseLeave={() => setHover(null)}
              >
                {hover === mi && m.total > 0 && (
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-10 w-36 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-surface p-2.5 text-[11px] shadow-card">
                    <p className="mb-1 font-black text-ink">{m.label} · {m.total} booking{m.total > 1 ? "s" : ""}</p>
                    {STATUSES.filter((s) => m.counts[s.id]).map((s) => (
                      <p key={s.id} className="flex items-center justify-between text-muted">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
                        <b className="text-ink">{m.counts[s.id]}</b>
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex w-full max-w-[44px] flex-col-reverse overflow-hidden rounded-t-lg" style={{ opacity: hover === null || hover === mi ? 1 : 0.45, transition: "opacity .2s" }}>
                  {STATUSES.map((s) => {
                    const n = m.counts[s.id] || 0;
                    if (!n) return null;
                    return (
                      <motion.div
                        key={s.id}
                        style={{ background: s.color }}
                        initial={{ height: 0 }}
                        animate={{ height: (n / max) * H }}
                        transition={{ duration: 0.8, ease: EASE, delay: mi * 0.07 }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 sm:gap-4">
            {months.map((m) => (
              <span key={m.key} className="flex-1 text-center text-[11px] font-bold text-muted">{m.label}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {STATUSES.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ───────── funnel ───────── */
const Funnel = ({ steps }) => {
  const top = Math.max(1, steps[0].n);
  return (
    <div className="space-y-3.5">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].n : null;
        return (
          <div key={s.label}>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-bold text-ink">{s.label}</span>
              <span className="text-muted">
                <b className="text-ink">{s.n}</b>
                {prev ? ` · ${prev ? Math.round((s.n / prev) * 100) : 0}% of previous` : ""}
              </span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-sandy">
              <motion.div
                className="h-full rounded-full"
                style={{ background: s.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(s.n / top) * 100}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatusAnalytics = ({ bookings }) => {
  const { counts, total, steps } = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1; });
    const approved = bookings.filter((b) => b.status === "awaiting_payment" || b.status === "confirmed").length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const full = bookings.filter((b) => b.status === "confirmed" && moneyOf(b).paidInFull).length;
    return {
      counts,
      total: bookings.length,
      steps: [
        { label: "Requests received", n: bookings.length, color: "#38bdf8" },
        { label: "Approved by the desk", n: approved, color: "#fbbf24" },
        { label: "Advance paid, confirmed", n: confirmed, color: "#10b981" },
        { label: "Paid in full", n: full, color: "#0F5C46" },
      ],
    };
  }, [bookings]);

  return (
    <section aria-label="Order analytics" className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft/60 text-brand-ink"><FiBarChart2 /></span>
        <div>
          <h2 className="text-xl font-black text-ink" style={serif}>Order analytics</h2>
          <p className="text-xs text-muted">Where every booking stands, at a glance</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
          Charts appear here as soon as the first booking arrives.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Status split" sub="Share of all bookings by current status">
            <Donut counts={counts} total={total} />
          </Card>
          <Card title="Bookings per month" sub="Requests received in the last 6 months, by status">
            <Columns bookings={bookings} />
          </Card>
          <Card title="Booking funnel" sub="How requests turn into paid trips" className="lg:col-span-2">
            <Funnel steps={steps} />
          </Card>
        </div>
      )}
    </section>
  );
};

export default StatusAnalytics;
