// src/Components/Billing/BillingPage.js
// Billing page of one booking, reached from My Bookings: payment progress, advance countdown, pay form, history, invoice.
// Payments are marked paid straight away (no manual verification, this is a hobby project).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiLock,
  FiPrinter,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import { auth } from "../../Firebase.init";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../Utilities/authFetch";
import {
  ADVANCE_PERCENT,
  HOLD_HOURS,
  canPay,
  fmtDate,
  fmtDateTime,
  invoiceNo,
  money,
  moneyOf,
  payLocally,
  paymentsOf,
  useNow,
  withLiveStatus,
} from "../Utilities/payment";
import { AnimatedNumber, Aurora, BlurText, PillTabs, Shimmer, motion, AnimatePresence } from "../ui/Motion";
import ActionBtn from "../ui/ActionBtn";
import PayLogo from "../ui/PayLogo";
import HoldBanner from "./HoldBanner";
import PayModal from "./PayModal";
import Invoice from "./Invoice";

const serif = { fontFamily: "var(--font-display)" };

const METHODS = [
  { id: "bKash", dot: "#e2136e" },
  { id: "Nagad", dot: "#f6921e" },
  { id: "Bank", dot: "#0b9a4b" },
  { id: "Card", dot: "#2563eb" },
];

const STATUS_PILL = {
  pending: ["Awaiting approval", "bg-amber-100 text-amber-700 ring-amber-200"],
  awaiting_payment: ["Advance due", "bg-orange-100 text-orange-700 ring-orange-200"],
  confirmed: ["Confirmed", "bg-emerald-100 text-emerald-700 ring-emerald-200"],
  paid: ["Paid in full", "bg-emerald-100 text-emerald-700 ring-emerald-200"],
  cancelled: ["Cancelled", "bg-red-100 text-red-600 ring-red-200"],
};

const Card = ({ children, className = "" }) => (
  <section className={`rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6 ${className}`}>{children}</section>
);
const Eyebrow = ({ children }) => (
  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{children}</p>
);

/* paid so far, with a marker where the 30% advance sits */
const Meter = ({ m }) => (
  <div>
    <div className="relative h-3.5 rounded-full bg-sandy ring-1 ring-line">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-brand to-accent-lt"
        initial={{ width: 0 }}
        animate={{ width: `${m.pct}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="absolute -top-1.5 bottom-[-6px] w-0.5 bg-ink/40" style={{ left: `${ADVANCE_PERCENT}%` }} aria-hidden />
    </div>
    <div className="relative mt-2 h-5 text-[10px] font-black uppercase tracking-widest text-muted">
      <span className="absolute left-0">BDT 0</span>
      <span
        className={`absolute -translate-x-1/2 ${m.advanceMet ? "text-emerald-600" : "text-ink"}`}
        style={{ left: `${ADVANCE_PERCENT}%` }}
      >
        {m.advanceMet ? "✓ " : ""}30% advance
      </span>
      <span className="absolute right-0">{money(m.total)}</span>
    </div>
  </div>
);

const PayCard = ({ b, m, busy, onPay }) => {
  const hasAdvance = b.status === "awaiting_payment" && m.advanceDue > 0;
  const [mode, setMode] = useState(hasAdvance ? "advance" : "balance");
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState("bKash");

  useEffect(() => {
    if (mode === "advance" && !hasAdvance) setMode("balance");
  }, [hasAdvance, mode]);

  const amount = mode === "advance" ? m.advanceDue : mode === "balance" ? m.balance : Math.round(Number(custom) || 0);
  const valid = Number.isInteger(amount) && amount > 0 && amount <= m.balance;
  const after = m.paid + (valid ? amount : 0);
  const willConfirm = hasAdvance && valid && after >= m.advance;

  const opt = (id, title, sub, value) => (
    <button
      key={id}
      type="button"
      onClick={() => setMode(id)}
      className={`relative rounded-2xl border p-4 text-left transition ${
        mode === id ? "border-brand bg-brand-soft/50 shadow-[0_8px_24px_-12px_rgb(var(--brand)/0.6)]" : "border-line bg-page-alt hover:border-brand/40"
      }`}
    >
      {mode === id && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
          <FiCheck size={12} />
        </span>
      )}
      <p className="text-[10px] font-black uppercase tracking-widest text-muted">{title}</p>
      <p className="mt-1 text-xl font-black text-ink" style={serif}>
        {value == null ? "Any amount" : money(value)}
      </p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </button>
  );

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>Make a payment</Eyebrow>
          <h3 className="mt-1 text-xl font-black text-ink" style={serif}>
            {hasAdvance ? "Pay the advance to confirm" : "Pay any amount"}
          </h3>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:inline-flex">
          <FiLock size={12} /> Secure checkout
        </span>
      </div>

      <div className={`mt-5 grid gap-3 ${hasAdvance ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {hasAdvance && opt("advance", `${ADVANCE_PERCENT}% advance`, "Confirms your booking", m.advanceDue)}
        {opt("balance", m.paid > 0 ? "Remaining balance" : "Full payment", "Settle everything", m.balance)}
        {opt("custom", "Custom", `Up to ${money(m.balance)}`, null)}
      </div>

      <AnimatePresence initial={false}>
        {mode === "custom" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-line bg-page-alt p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-muted">BDT</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={m.balance}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Enter amount"
                  className={`w-full rounded-xl border bg-surface px-4 py-3 text-lg font-black text-ink outline-none transition ${
                    custom && !valid ? "border-red-400" : "border-line focus:border-brand/60"
                  }`}
                />
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(1, m.balance)}
                value={Math.min(Math.max(1, Number(custom) || 1), Math.max(1, m.balance))}
                onChange={(e) => setCustom(e.target.value)}
                className="mt-4 w-full accent-[rgb(var(--brand))]"
                aria-label="Amount"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[25, 50, 75].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCustom(String(Math.max(1, Math.round((m.balance * p) / 100))))}
                    className="rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-bold text-muted hover:border-brand/50 hover:text-ink"
                  >
                    {p}% of balance
                  </button>
                ))}
              </div>
              {custom && !valid && (
                <p className="mt-2 text-xs font-semibold text-red-500">Enter a whole amount between 1 and {m.balance.toLocaleString()}.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5">
        <Eyebrow>Pay with</Eyebrow>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {METHODS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setMethod(x.id)}
              aria-pressed={method === x.id}
              className={`flex min-w-0 items-center gap-2.5 rounded-2xl border p-2 pr-3 text-left text-xs font-bold transition ${
                method === x.id ? "border-brand bg-brand-soft/60 text-brand-ink ring-2 ring-brand/25" : "border-line bg-page-alt text-muted hover:text-ink"
              }`}
            >
              <PayLogo method={x.id} size="sm" />
              <span className="truncate">{x.id === "Bank" ? "Bank transfer" : x.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-page-alt p-4 ring-1 ring-line">
        <div className="text-sm">
          <p className="text-muted">
            After this payment you will have paid <b className="text-ink">{money(after)}</b>
          </p>
          {willConfirm && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <FiCheckCircle /> Your booking will be confirmed automatically
            </p>
          )}
          {hasAdvance && valid && !willConfirm && (
            <p className="mt-0.5 text-xs font-bold text-amber-600">
              Still {money(m.advance - after)} short of the advance, the booking stays unconfirmed.
            </p>
          )}
        </div>
        <ActionBtn tone="pay" icon={FiCreditCard} attention={valid && !busy} busy={busy} disabled={!valid || busy} onClick={() => onPay(amount, method)} className="w-full sm:w-auto">
          Pay {valid ? money(amount) : "now"}
        </ActionBtn>
      </div>
    </Card>
  );
};

const History = ({ b }) => {
  const pays = paymentsOf(b);
  return (
    <Card>
      <Eyebrow>Payment history</Eyebrow>
      {pays.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No payments yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {[...pays].reverse().map((p, i) => (
            <li key={p._id || i} className="flex items-center gap-3 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                <FiCheck />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">Payment received</p>
                <p className="text-xs text-muted">
                  {fmtDateTime(p.paidAt || p.createdAt)} · {p.method || "Online"}
                  {p.last4 ? ` •••• ${p.last4}` : p.account ? ` ${p.account}` : ""}
                </p>
                {p.ref && <p className="font-mono text-[10px] text-muted/80">{p.ref}</p>}
              </div>
              <p className="font-black text-emerald-600">+ {money(p.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const BillingPage = () => {
  const { bookingId } = useParams();
  const [user] = useAuthState(auth);
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("bill");
  const [receipt, setReceipt] = useState(null);
  const [checkout, setCheckout] = useState(null); // { amount, method } while the pay modal is open
  const now = useNow(30000);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/bookings/user/${user.uid}`);
      if (!res.ok) throw new Error("load");
      const list = await res.json();
      const found = (Array.isArray(list) ? list : []).find((x) => x._id === bookingId);
      setRaw(found || null);
      setMissing(!found);
    } catch {
      toast.error("Failed to load this booking");
    } finally {
      setLoading(false);
    }
  }, [user, bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const b = useMemo(() => (raw ? withLiveStatus(raw, now) : null), [raw, now]);
  const m = b ? moneyOf(b) : null;

  // Called by the pay modal once the customer has verified. Throws on failure so the modal can show it.
  const pay = useCallback(
    async (amount, method, meta = {}) => {
      setBusy(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/api/bookings/${raw._id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, method, ref: meta.ref, brand: meta.brand, last4: meta.last4, account: meta.account }),
        });
        const r = await res.json().catch(() => ({}));
        if (!res.ok || !r.success) throw new Error(r.message || "Payment failed. Please try again.");
        const next = r.booking ? { ...raw, ...r.booking } : payLocally(raw, amount, method);
        const wasAwaiting = raw.status === "awaiting_payment";
        setRaw(next);
        setReceipt({ amount, confirmed: wasAwaiting && next.status === "confirmed", full: moneyOf(next).paidInFull });
      } finally {
        setBusy(false);
      }
    },
    [raw],
  );

  if (!user) return null;

  const tabs = [
    { id: "bill", label: "Bill", icon: <FiCreditCard /> },
    { id: "invoice", label: "Invoice", icon: <FiFileText /> },
  ];
  const [statusText, statusCls] = b ? STATUS_PILL[m.paidInFull && b.status === "confirmed" ? "paid" : b.status] || STATUS_PILL.pending : [];

  return (
    <main className="min-h-screen bg-sandy pb-24 pt-[76px] print:bg-white print:pt-0">
      <section className="relative overflow-hidden bg-panel text-on print:hidden">
        <Aurora />
        <div className="relative mx-auto max-w-5xl px-6 pb-14 pt-10 lg:px-10">
          <Link to="/my-bookings" className="inline-flex items-center gap-2 text-xs font-bold text-on/60 hover:text-on">
            <FiArrowLeft /> My Bookings
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-lt">Billing</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl" style={serif}>
                <BlurText text={b ? b.serviceName : "Billing"} />
              </h1>
              {b && (
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on/60">
                  <span className="flex items-center gap-1.5"><FiCalendar /> {fmtDate(b.preferredDate, { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span className="flex items-center gap-1.5"><FiUsers /> {b.travelers} traveler{Number(b.travelers) > 1 ? "s" : ""}</span>
                  <span className="font-mono text-xs">{invoiceNo(b)}</span>
                </p>
              )}
            </div>
            {b && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold ring-1 ${statusCls}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> {statusText}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        {loading && !raw ? (
          <div className="-mt-6 grid gap-5">
            <Shimmer className="h-40 rounded-3xl" />
            <Shimmer className="h-72 rounded-3xl" />
          </div>
        ) : missing || !b ? (
          <Card className="-mt-6 text-center">
            <FiAlertCircle className="mx-auto text-4xl text-muted" />
            <h2 className="mt-3 text-xl font-black text-ink">Booking not found</h2>
            <p className="mt-1 text-sm text-muted">It may have been deleted, or it belongs to another account.</p>
            <Link to="/my-bookings" className="mt-5 inline-block rounded-full bg-btn px-6 py-2.5 text-sm font-bold text-white hover:bg-brand">
              Back to My Bookings
            </Link>
          </Card>
        ) : (
          <>
            <div className="-mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <PillTabs id="billing-tabs" items={tabs} value={tab} onChange={setTab} />
              <div className="flex gap-2">
                {tab === "invoice" && (
                  <ActionBtn tone="update" icon={FiPrinter} onClick={() => window.print()}>
                    Download PDF
                  </ActionBtn>
                )}
                <ActionBtn tone="quiet" icon={FiRefreshCw} onClick={load}>
                  Refresh
                </ActionBtn>
              </div>
            </div>

            {tab === "invoice" ? (
              <Invoice b={b} />
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
                <div className="grid content-start gap-5">
                  {/* status / action area */}
                  <AnimatePresence mode="popLayout">
                    {receipt && (
                      <motion.div
                        key="receipt"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative overflow-hidden rounded-3xl border border-emerald-300/60 bg-emerald-50 p-6 text-center dark:!border-emerald-400/30 dark:!bg-emerald-500/10"
                      >
                        <motion.span
                          initial={{ scale: 0, rotate: -40 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 260, damping: 14 }}
                          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        >
                          <FiCheck size={28} strokeWidth={3} />
                        </motion.span>
                        <h3 className="mt-3 text-xl font-black text-emerald-800 dark:!text-emerald-200" style={serif}>
                          {money(receipt.amount)} received
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                          {receipt.confirmed
                            ? "Advance paid: your booking is confirmed."
                            : receipt.full
                              ? "Everything is paid. Thank you!"
                              : "Thank you. Your invoice is updated."}
                        </p>
                        <div className="mt-4 flex justify-center gap-2">
                          <ActionBtn tone="billing" icon={FiFileText} onClick={() => { setTab("invoice"); setReceipt(null); }}>
                            View invoice
                          </ActionBtn>
                          <ActionBtn tone="quiet" onClick={() => setReceipt(null)}>
                            Close
                          </ActionBtn>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {b.status === "awaiting_payment" && <HoldBanner b={b} onExpire={load} />}

                  {b.status === "pending" && (
                    <Card>
                      <div className="flex items-start gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600"><FiLock /></span>
                        <div>
                          <h3 className="text-lg font-black text-ink" style={serif}>Payment opens after approval</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted">
                            Our team is reviewing your request. When the date is approved you get {HOLD_HOURS} hours to pay a {ADVANCE_PERCENT}% advance
                            ({money(Math.ceil((m.total * ADVANCE_PERCENT) / 100))}) to confirm the booking. After that you can pay the rest, or any amount, whenever you like.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {b.status === "cancelled" && (
                    <Card>
                      <div className="flex items-start gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-500"><FiAlertCircle /></span>
                        <div>
                          <h3 className="text-lg font-black text-ink" style={serif}>This booking is cancelled</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted">
                            {b.cancelReason === "advance_not_paid"
                              ? `The ${ADVANCE_PERCENT}% advance was not paid within ${HOLD_HOURS} hours, so the booking was cancelled automatically.`
                              : "Payments are closed for a cancelled booking."}
                            {m.refundDue > 0 && ` You paid ${money(m.refundDue)}: contact our travel desk to arrange the refund.`}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {m.paidInFull && b.status !== "cancelled" && !receipt && (
                    <Card className="text-center">
                      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white"><FiCheck size={28} strokeWidth={3} /></span>
                      <h3 className="mt-3 text-xl font-black text-ink" style={serif}>Paid in full</h3>
                      <p className="mt-1 text-sm text-muted">Nothing more to pay. Your invoice is ready.</p>
                      <div className="mt-4 flex justify-center">
                        <ActionBtn tone="billing" icon={FiFileText} onClick={() => setTab("invoice")}>View invoice</ActionBtn>
                      </div>
                    </Card>
                  )}

                  {canPay(b) && <PayCard key={b.status + m.paid} b={b} m={m} busy={busy} onPay={(amount, method) => setCheckout({ amount, method })} />}

                  <History b={b} />
                </div>

                {/* right column: numbers */}
                <div className="grid content-start gap-5">
                  <Card>
                    <Eyebrow>Total bill</Eyebrow>
                    <p className="mt-1 text-4xl font-black text-ink" style={serif}>
                      <AnimatedNumber value={m.total} prefix="BDT " />
                    </p>
                    <div className="mt-5">
                      <Meter m={m} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-emerald-50 p-3 dark:!bg-emerald-500/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Paid</p>
                        <p className="mt-0.5 text-lg font-black text-emerald-600">{money(m.paid)}</p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-3 dark:!bg-amber-500/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Balance</p>
                        <p className="mt-0.5 text-lg font-black text-amber-600">{money(m.balance)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <Eyebrow>Bill details</Eyebrow>
                    <dl className="mt-3 space-y-3 text-sm">
                      <div className="flex justify-between gap-3"><dt className="text-muted">Package</dt><dd className="text-right font-bold text-ink">{b.serviceName}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted">Travelers</dt><dd className="font-bold text-ink">{b.travelers}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted">Per traveler</dt><dd className="font-bold text-ink">{money(b.travelers ? m.total / Number(b.travelers) : m.total)}</dd></div>
                      <div className="flex justify-between gap-3 border-t border-line pt-3"><dt className="text-muted">{ADVANCE_PERCENT}% advance</dt><dd className={`font-bold ${m.advanceMet ? "text-emerald-600" : "text-ink"}`}>{money(m.advance)} {m.advanceMet ? "✓" : ""}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted">Invoice</dt><dd className="font-mono text-xs font-bold text-ink">{invoiceNo(b)}</dd></div>
                    </dl>
                    <ActionBtn tone="billing" icon={FiFileText} className="mt-5 w-full" onClick={() => setTab("invoice")}>
                      Open invoice
                    </ActionBtn>
                  </Card>

                  <p className="flex items-start gap-2 px-2 text-xs leading-relaxed text-muted">
                    <FiClock className="mt-0.5 shrink-0" />
                    The advance is due {HOLD_HOURS} hours after approval. Unpaid advances cancel the booking automatically.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PayModal
        open={!!checkout}
        amount={checkout?.amount}
        method={checkout?.method}
        booking={b}
        user={user}
        onConfirm={(meta) => pay(checkout.amount, checkout.method, meta)}
        onClose={() => setCheckout(null)}
        onInvoice={(close) => { close(); setTab("invoice"); setReceipt(null); }}
      />
    </main>
  );
};

export default BillingPage;
