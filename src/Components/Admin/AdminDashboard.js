// src/Components/Admin/AdminDashboard.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiGrid,
  FiImage,
  FiList,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
  FiXCircle,
  FiClock,
  FiMap,
} from "react-icons/fi";
import { auth } from "../../Firebase.init";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../Utilities/authFetch";
import EditBookingModal from "../Booking/EditBookingModal";
import HoldToDelete from "../ui/HoldToDelete";
import { HoldChip } from "../Billing/HoldBanner";
import InvoiceModal from "../Billing/InvoiceModal";
import {
  ADVANCE_PERCENT,
  HOLD_HOURS,
  confirmLocally,
  fmtDateTime,
  money,
  moneyOf,
  needsAdvance,
  paidOf,
  paymentsOf,
  useNow,
  withLiveStatus,
} from "../Utilities/payment";
import {
  AnimatePresence,
  AnimatedNumber,
  Aurora,
  Backdrop,
  BlurText,
  ModalShell,
  PillTabs,
  Shimmer,
  TiltCard,
  motion,
} from "../ui/Motion";

const ADMIN_EMAIL = "hafizsakib5@gmail.com";
const API_BOOKINGS = `${API_BASE_URL}/api/admin/bookings`;
const API_SERVICES = `${API_BASE_URL}/api/admin/services`;
const API_SERVICES_PUBLIC = `${API_BASE_URL}/api/services`;
const PER_PAGE = 10;
const STATUSES = ["all", "pending", "awaiting_payment", "confirmed", "cancelled"];
const STATUS_LABEL = { awaiting_payment: "advance due" };

/* ───────────── helpers ───────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtAmt = (n) => "BDT " + Number(n || 0).toLocaleString();
const priceOf = (b) => parseFloat(String(b ?? "").replace(/[^0-9.]/g, ""));
const serif = { fontFamily: "var(--font-display)" };

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  awaiting_payment: "bg-orange-100 text-orange-700 ring-orange-200",
  confirmed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  cancelled: "bg-red-100 text-red-600 ring-red-200",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold capitalize ring-1 ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-current" />
    {STATUS_LABEL[status] || status}
  </span>
);

const Spinner = () => (
  <div className="grid gap-4 py-6">
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <Shimmer key={i} className="h-24" />
      ))}
    </div>
    <Shimmer className="h-64" />
  </div>
);

const Empty = ({ icon, title, text }) => (
  <div className="text-center py-20 px-6">
    <div className="text-4xl mb-3 text-muted flex justify-center">{icon}</div>
    <p className="font-black text-lg text-ink">{title}</p>
    <p className="text-sm text-muted mt-1">{text}</p>
  </div>
);

const StatCard = ({ icon, label, value, prefix = "", sub, tone = "ink", i = 0 }) => {
  const tones = {
    ink: "bg-ink/8 text-ink",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-emerald-100 text-emerald-600",
    accent: "bg-accent/12 text-accent",
    brand: "bg-brand/10 text-brand-ink",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
      className="bg-surface rounded-3xl border border-line p-5 flex items-start gap-4 shadow-[0_8px_30px_rgba(16,24,40,0.05)] hover:shadow-[0_20px_50px_rgba(16,24,40,0.12)] transition-shadow"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">
          {label}
        </p>
        <p className="text-2xl font-black text-ink leading-tight truncate" style={serif}>
          <AnimatedNumber value={value} prefix={prefix} />
        </p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
};

const ConfirmDialog = ({ open, title, text, confirmLabel, danger, busy, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {open && (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <Backdrop onClick={onCancel} />
      <ModalShell className="relative bg-surface rounded-3xl p-7 w-full max-w-sm shadow-2xl text-center">
        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 ${danger ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-600"}`}>
          <FiAlertTriangle />
        </div>
        <h3 className="text-lg font-black text-ink">{title}</h3>
        <p className="text-sm text-muted mt-2">{text}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-line text-sm font-bold text-muted hover:bg-sandy">
            Keep
          </button>
          {danger ? (
            <HoldToDelete full disabled={busy} label={`Hold to ${String(confirmLabel || "delete").toLowerCase()}`} doneLabel="Done" onConfirm={onConfirm} className="flex-1" />
          ) : (
            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-60 bg-btn hover:bg-brand"
            >
              {busy ? "Please wait…" : confirmLabel}
            </button>
          )}
        </div>
      </ModalShell>
    </div>
      )}
    </AnimatePresence>
  );
};

/* ───────────── Booking drawer ───────────── */
const Row = ({ icon, label, children }) => (
  <div className="flex gap-3 py-3.5 border-b border-line last:border-0">
    <div className="w-8 h-8 rounded-lg bg-sandy text-brand-ink flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</p>
      <div className="text-sm text-ink break-words mt-0.5">{children || "—"}</div>
    </div>
  </div>
);

const PaymentBlock = ({ b }) => {
  const m = moneyOf(b);
  const pays = paymentsOf(b);
  if (b.status === "pending" && m.paid === 0) return null;
  return (
    <div className="py-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Payment</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Total", m.total, "text-ink"], ["Paid", m.paid, "text-emerald-600"], ["Balance", m.balance, "text-amber-600"]].map(([l, v, c]) => (
          <div key={l} className="rounded-xl bg-sandy px-2 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{l}</p>
            <p className={`text-sm font-black ${c}`}>{fmtAmt(v)}</p>
          </div>
        ))}
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-line">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent-lt" style={{ width: `${m.pct}%` }} />
        <span className="absolute -top-1 bottom-[-4px] w-0.5 bg-ink/40" style={{ left: "30%" }} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        {b.status === "awaiting_payment" ? <HoldChip b={b} /> : m.advanceMet ? `✓ ${ADVANCE_PERCENT}% advance received` : `${ADVANCE_PERCENT}% advance: ${fmtAmt(m.advance)}`}
      </p>
      {pays.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line text-xs">
          {[...pays].reverse().map((p, i) => (
            <li key={p._id || i} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-muted">{fmtDateTime(p.paidAt || p.createdAt)} · {p.method || "Online"}</span>
              <b className="text-emerald-600">+ {fmtAmt(p.amount)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const BookingDrawer = ({ booking: b, all, busy, onClose, onStatus, onDeleteNow, onEdit, onInvoice }) => {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!b) return null;
  const wa = `https://wa.me/88${String(b.phoneNumber || "").replace(/\D/g, "")}`;
  return (
    <>
      <Backdrop onClick={onClose} className="fixed z-40" />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-surface z-50 shadow-2xl flex flex-col"
      >
        <div className="relative overflow-hidden p-6 bg-panel text-on">
          <Aurora />
          <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-accent font-black">Booking</p>
              <h2 className="text-2xl font-black leading-tight mt-1" style={serif}>
                {b.serviceName}
              </h2>
              <p className="text-[11px] text-on/50 font-mono mt-1">#{b._id}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-on/10" aria-label="Close">
              <FiX size={18} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <StatusBadge status={b.status} />
            <p className="text-2xl font-black text-accent-lt" style={serif}>
              {fmtAmt(b.totalAmount)}
            </p>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <Row icon={<FiUsers size={14} />} label="Customer">
            <b>{b.userName}</b>
          </Row>
          <Row icon={<FiMail size={14} />} label="Email">
            <a className="text-brand-ink hover:underline" href={`mailto:${b.userEmail}`}>{b.userEmail}</a>
          </Row>
          <Row icon={<FiPhone size={14} />} label="Phone">
            <div className="flex flex-wrap items-center gap-3">
              <a className="text-brand-ink hover:underline" href={`tel:${b.phoneNumber}`}>{b.phoneNumber}</a>
              <a className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700" href={wa} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </Row>
          <Row icon={<FiMapPin size={14} />} label="Address">{b.address}</Row>
          <Row icon={<FiCalendar size={14} />} label="Preferred date">{fmtDate(b.preferredDate)}</Row>
          <Row icon={<FiUsers size={14} />} label="Travelers">{b.travelers}</Row>
          {b.notes && <Row icon={<FiList size={14} />} label="Special requests">{b.notes}</Row>}
          <Row icon={<FiClock size={14} />} label="Requested on">{fmtDate(b.createdAt)}</Row>
          <PaymentBlock b={b} />
        </div>

        <div className="p-5 border-t border-line space-y-3 bg-page-alt">
          {b.status === "pending" && (
            <p className="text-[11px] leading-relaxed text-muted px-1">
              {needsAdvance(b, all)
                ? `This date is free in the schedule: confirming asks the client for a ${ADVANCE_PERCENT}% advance (${money(Math.ceil((Number(b.totalAmount || 0) * ADVANCE_PERCENT) / 100))}) within ${HOLD_HOURS} hours, otherwise the booking cancels itself.`
                : "This date already has a confirmed trip, so confirming confirms the booking right away (no advance needed)."}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={busy || b.status === "confirmed" || b.status === "awaiting_payment"}
              onClick={() => onStatus(b._id, "confirmed")}
              className="py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <FiCheckCircle /> {b.status === "awaiting_payment" ? "Awaiting advance" : "Confirm"}
            </button>
            <button
              disabled={busy || b.status === "cancelled"}
              onClick={() => onStatus(b._id, "cancelled")}
              className="py-3 rounded-2xl bg-surface border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <FiXCircle /> Cancel
            </button>
          </div>
          {b.status !== "pending" && (
            <button
              disabled={busy}
              onClick={() => onStatus(b._id, "pending")}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-muted hover:bg-surface border border-line"
            >
              Move back to pending
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onEdit(b)}
              className="py-2.5 rounded-2xl text-xs font-bold text-ink border border-line hover:bg-surface flex items-center justify-center gap-2"
            >
              <FiEdit2 /> Edit details
            </button>
            <button
              onClick={() => onInvoice(b)}
              className="py-2.5 rounded-2xl text-xs font-bold text-ink border border-line hover:bg-surface flex items-center justify-center gap-2"
            >
              <FiFileText /> Invoice
            </button>
          </div>
          <HoldToDelete full label="Hold to delete permanently" doneLabel="Deleting…" onConfirm={() => onDeleteNow(b)} />
        </div>
      </motion.aside>
    </>
  );
};

/* ───────────── Service modal ───────────── */
const EMPTY_SERVICE = {
  name: "", about: "", balance: "", picture: "",
  category: "General", duration: "Flexible", location: "Bangladesh",
};

const FormField = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 font-semibold mt-1">{error}</p>}
  </div>
);
const inp = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none bg-page-alt focus:bg-surface ${err ? "border-red-400" : "border-line focus:border-brand"}`;

const ServiceModal = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial || EMPTY_SERVICE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const isEdit = !!initial?._id;
  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
    if (k === "picture") setImgOk(true);
  };

  const submit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.about.trim()) e.about = "Description is required";
    if (!form.balance.trim()) e.balance = "Price is required";
    else if (!(priceOf(form.balance) > 0)) e.balance = "Include a number, e.g. BDT 4,500";
    if (!form.picture.trim()) e.picture = "Image URL is required";
    else if (!/^https?:\/\//i.test(form.picture.trim())) e.picture = "Must start with http(s)://";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const ok = await onSave({
      ...form,
      name: form.name.trim(), about: form.about.trim(),
      balance: form.balance.trim(), picture: form.picture.trim(),
    });
    if (!ok) setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <Backdrop onClick={onClose} />
      <ModalShell className="relative bg-surface rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-line sticky top-0 bg-surface z-10 rounded-t-3xl">
          <h2 className="text-lg font-black text-ink">{isEdit ? "Edit package" : "New package"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-sandy"><FiX size={18} /></button>
        </div>
        <div className="p-6 grid md:grid-cols-[220px_1fr] gap-6">
          <div>
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-sandy flex items-center justify-center border border-line">
              {form.picture && imgOk ? (
                <img src={form.picture} alt="Preview" className="w-full h-full object-cover" onError={() => setImgOk(false)} />
              ) : (
                <div className="text-center text-muted text-xs p-4">
                  <FiImage size={30} className="mx-auto mb-2" />
                  {form.picture ? "Image failed to load" : "Image preview"}
                </div>
              )}
            </div>
            <div className="mt-3 rounded-2xl bg-panel text-on p-4">
              <p className="font-black leading-tight line-clamp-2" style={serif}>{form.name || "Package name"}</p>
              <p className="text-accent-lt font-black mt-1">{form.balance || "BDT —"}</p>
            </div>
          </div>
          <div className="space-y-4">
            <FormField label="Package name" required error={errors.name}>
              <input className={inp(errors.name)} value={form.name} onChange={set("name")} placeholder="e.g. Cox's Bazar Beach Tour" />
            </FormField>
            <FormField label="Description" required error={errors.about}>
              <textarea rows={4} className={`${inp(errors.about)} resize-none`} value={form.about} onChange={set("about")} placeholder="What makes this trip special…" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Price per person" required error={errors.balance}>
                <input className={inp(errors.balance)} value={form.balance} onChange={set("balance")} placeholder="BDT 4,500" />
              </FormField>
              <FormField label="Duration">
                <input className={inp()} value={form.duration} onChange={set("duration")} placeholder="3 Days" />
              </FormField>
              <FormField label="Category">
                <input className={inp()} value={form.category} onChange={set("category")} placeholder="Beach" />
              </FormField>
              <FormField label="Location">
                <input className={inp()} value={form.location} onChange={set("location")} placeholder="Cox's Bazar" />
              </FormField>
            </div>
            <FormField label="Image URL" required error={errors.picture}>
              <input className={inp(errors.picture)} value={form.picture} onChange={set("picture")} placeholder="https://images.unsplash.com/…" />
            </FormField>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-line text-sm font-bold text-muted hover:bg-sandy">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-3 rounded-2xl bg-btn text-white text-sm font-bold hover:bg-brand disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create package"}
          </button>
        </div>
      </ModalShell>
    </div>
  );
};

/* ───────────── Overview ───────────── */
const Overview = ({ bookings, services, onOpen, goTab }) => {
  const stats = useMemo(() => {
    const by = (s) => bookings.filter((b) => b.status === s);
    const confirmed = by("confirmed");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = confirmed
      .filter((b) => new Date(b.preferredDate) >= today)
      .sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate))
      .slice(0, 5);
    const perService = {};
    bookings.filter((b) => b.status !== "cancelled").forEach((b) => {
      perService[b.serviceName] = (perService[b.serviceName] || 0) + 1;
    });
    const top = Object.entries(perService).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      pending: by("pending").length,
      confirmed: confirmed.length,
      cancelled: by("cancelled").length,
      revenue: bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + paidOf(b), 0),
      awaiting: by("awaiting_payment").length,
      pipeline: by("pending").reduce((s, b) => s + Number(b.totalAmount || 0), 0),
      travelers: confirmed.reduce((s, b) => s + Number(b.travelers || 0), 0),
      upcoming, top,
    };
  }, [bookings]);

  const total = bookings.length || 1;
  const bar = (n, c) => (
    <motion.div
      className={c}
      initial={{ width: 0 }}
      animate={{ width: `${(n / total) * 100}%` }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      title={String(n)}
    />
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard i={0} icon={<FiList />} label="Total bookings" value={bookings.length} sub={`${stats.pending} awaiting review`} />
        <StatCard i={1} icon={<FiClock />} tone="amber" label="Pending" value={stats.pending} sub={`${stats.awaiting} waiting for advance`} />
        <StatCard i={2} icon={<FiCheckCircle />} tone="green" label="Confirmed" value={stats.confirmed} sub={`${stats.travelers} travelers`} />
        <StatCard i={3} icon={<FiDollarSign />} tone="accent" label="Payments received" prefix="BDT " value={stats.revenue} sub={`${services.length} packages live`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-3xl border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-ink">Recent requests</h3>
            <button onClick={() => goTab("bookings")} className="text-xs font-bold text-brand-ink hover:underline">View all</button>
          </div>
          {bookings.length === 0 ? (
            <Empty icon={<FiList />} title="No bookings yet" text="New requests will appear here." />
          ) : (
            <div className="divide-y divide-line">
              {bookings.slice(0, 6).map((b) => (
                <button key={b._id} onClick={() => onOpen(b)} className="w-full text-left py-3.5 flex items-center justify-between gap-4 hover:bg-page-alt -mx-2 px-2 rounded-xl transition">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-ink truncate">{b.serviceName}</p>
                    <p className="text-xs text-muted truncate">{b.userName} · {fmtDate(b.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black hidden sm:block">{fmtAmt(b.totalAmount)}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-3xl border border-line p-6">
            <h3 className="font-black text-ink mb-4">Status split</h3>
            <div className="flex h-3 rounded-full overflow-hidden bg-sandy">
              {bar(stats.confirmed, "bg-emerald-500")}
              {bar(stats.pending, "bg-amber-400")}
              {bar(stats.cancelled, "bg-red-400")}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {[["Confirmed", stats.confirmed, "bg-emerald-500"], ["Pending", stats.pending, "bg-amber-400"], ["Cancelled", stats.cancelled, "bg-red-400"]].map(([l, n, c]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted"><span className={`w-2.5 h-2.5 rounded-full ${c}`} />{l}</span>
                  <b>{n}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-3xl border border-line p-6">
            <h3 className="font-black text-ink mb-4">Popular packages</h3>
            {stats.top.length === 0 ? (
              <p className="text-sm text-muted">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.top.map(([name, n]) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold truncate pr-2">{name}</span><b>{n}</b>
                    </div>
                    <div className="h-2 rounded-full bg-sandy">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-brand to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${(n / stats.top[0][1]) * 100}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-line p-6">
        <h3 className="font-black text-ink mb-4">Upcoming confirmed trips</h3>
        {stats.upcoming.length === 0 ? (
          <p className="text-sm text-muted">No upcoming confirmed trips.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.upcoming.map((b) => (
              <button key={b._id} onClick={() => onOpen(b)} className="text-left rounded-2xl border border-line p-4 hover:shadow-lg hover:-translate-y-0.5 transition">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-ink">{fmtDate(b.preferredDate)}</p>
                <p className="font-black mt-1 line-clamp-1">{b.serviceName}</p>
                <p className="text-xs text-muted mt-1">{b.userName} · {b.travelers} traveler{b.travelers > 1 ? "s" : ""}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────────── Bookings panel ───────────── */
const BookingsPanel = ({ bookings, loading, busyId, onOpen, onStatus, onDelete, onEdit }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const c = { all: bookings.length };
    STATUSES.slice(1).forEach((s) => (c[s] = bookings.filter((b) => b.status === s).length));
    return c;
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => status === "all" || b.status === status)
      .filter((b) => !q || `${b.userName} ${b.userEmail} ${b.serviceName} ${b.phoneNumber} ${b._id}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "date-asc") return new Date(a.createdAt) - new Date(b.createdAt);
        if (sort === "trip") return new Date(a.preferredDate) - new Date(b.preferredDate);
        if (sort === "amount") return Number(b.totalAmount) - Number(a.totalAmount);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [bookings, search, status, sort]);

  useEffect(() => setPage(1), [search, status, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const view = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Booking ID", "Customer", "Email", "Phone", "Package", "Travelers", "Trip date", "Total (BDT)", "Status", "Address", "Notes", "Requested on"];
    const rows = filtered.map((b) => [b._id, b.userName, b.userEmail, b.phoneNumber, b.serviceName, b.travelers, fmtDate(b.preferredDate), b.totalAmount, b.status, b.address, b.notes, fmtDate(b.createdAt)]);
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} bookings`);
  };

  return (
    <div className="bg-surface rounded-3xl border border-line overflow-hidden">
      <div className="p-5 border-b border-line space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, package, ID…" className="w-full pl-11 pr-4 py-3 rounded-2xl bg-page-alt border border-line text-sm outline-none focus:border-brand focus:bg-surface" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-4 py-3 rounded-2xl bg-page-alt border border-line text-sm font-semibold outline-none">
            <option value="date-desc">Newest requests</option>
            <option value="date-asc">Oldest requests</option>
            <option value="trip">Trip date (soonest)</option>
            <option value="amount">Highest amount</option>
          </select>
          <button onClick={exportCsv} disabled={!filtered.length} className="px-5 py-3 rounded-2xl bg-btn text-white text-sm font-bold hover:bg-brand disabled:opacity-40 flex items-center justify-center gap-2">
            <FiDownload /> CSV
          </button>
        </div>
        <PillTabs
          id="admin-status"
          items={STATUSES.map((st) => ({ id: st, label: st, badge: counts[st] }))}
          value={status}
          onChange={setStatus}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : view.length === 0 ? (
        <Empty icon={<FiList />} title="No bookings found" text="Try a different search or filter." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted bg-page-alt">
                  {["Customer", "Package", "Trip date", "Guests", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {view.map((b) => (
                  <tr key={b._id} className="hover:bg-page-alt cursor-pointer" onClick={() => onOpen(b)}>
                    <td className="px-5 py-4">
                      <p className="font-bold">{b.userName}</p>
                      <p className="text-xs text-muted">{b.phoneNumber}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[220px]"><p className="font-semibold truncate">{b.serviceName}</p></td>
                    <td className="px-5 py-4 whitespace-nowrap">{fmtDate(b.preferredDate)}</td>
                    <td className="px-5 py-4">{b.travelers}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-black">{fmtAmt(b.totalAmount)}</p>
                      {b.status !== "pending" && b.status !== "cancelled" && <p className="text-[11px] font-bold text-emerald-600">Paid {fmtAmt(paidOf(b))}</p>}
                    </td>
                    <td className="px-5 py-4"><div className="flex flex-col items-start gap-1.5"><StatusBadge status={b.status} /><HoldChip b={b} /></div></td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button title="Confirm" disabled={busyId === b._id || b.status === "confirmed" || b.status === "awaiting_payment"} onClick={() => onStatus(b._id, "confirmed")} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"><FiCheckCircle size={17} /></button>
                        <button title="Cancel booking" disabled={busyId === b._id || b.status === "cancelled"} onClick={() => onStatus(b._id, "cancelled")} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-30"><FiXCircle size={17} /></button>
                        <button title="Edit details" onClick={() => onEdit(b)} className="p-2 rounded-lg text-ink/70 hover:bg-sandy"><FiEdit2 size={17} /></button>
                        <button title="Delete permanently" onClick={() => onDelete(b)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><FiTrash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-line">
            {view.map((b) => (
              <div key={b._id} className="p-5" onClick={() => onOpen(b)}>
                <div className="flex justify-between gap-3">
                  <p className="font-black leading-tight">{b.serviceName}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-xs text-muted mt-1">{b.userName} · {b.phoneNumber}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-muted">{fmtDate(b.preferredDate)} · {b.travelers} guests</span>
                  <b>{fmtAmt(b.totalAmount)}</b>
                </div>
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button disabled={busyId === b._id || b.status === "confirmed" || b.status === "awaiting_payment"} onClick={() => onStatus(b._id, "confirmed")} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-40">{b.status === "awaiting_payment" ? "Awaiting advance" : "Confirm"}</button>
                  <button disabled={busyId === b._id || b.status === "cancelled"} onClick={() => onStatus(b._id, "cancelled")} className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold disabled:opacity-40">Cancel</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-line text-xs text-muted">
            <span>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-line disabled:opacity-30 hover:bg-sandy"><FiChevronLeft /></button>
              <span className="font-bold text-ink">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-line disabled:opacity-30 hover:bg-sandy"><FiChevronRight /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ───────────── Services panel ───────────── */
const ServicesPanel = ({ services, bookings, loading, onSave, onDelete }) => {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [modal, setModal] = useState(null);

  const categories = useMemo(() => [...new Set(services.map((s) => s.category).filter(Boolean))], [services]);
  const bookedCount = useMemo(() => {
    const m = {};
    bookings.filter((b) => b.status !== "cancelled").forEach((b) => (m[b.serviceId] = (m[b.serviceId] || 0) + 1));
    return m;
  }, [bookings]);

  const filtered = services
    .filter((s) => cat === "all" || s.category === cat)
    .filter((s) => `${s.name} ${s.category} ${s.location}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages…" className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface border border-line text-sm outline-none focus:border-brand" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-4 py-3 rounded-2xl bg-surface border border-line text-sm font-semibold outline-none">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setModal({})} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cta to-accent-lt text-deep text-sm font-black flex items-center justify-center gap-2 hover:shadow-lg">
          <FiPlus /> New package
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-line">
          <Empty icon={<FiMap />} title="No packages" text="Create your first tour package." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <TiltCard key={s._id} max={4} className="bg-surface rounded-3xl border border-line overflow-hidden group hover:shadow-xl transition">
              <div className="relative aspect-[16/10] overflow-hidden bg-sandy">
                <img src={s.picture} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(e) => (e.target.style.opacity = 0.2)} />
                <span className="absolute top-3 left-3 bg-on/90 backdrop-blur text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{s.category}</span>
                <span className="absolute top-3 right-3 bg-scrim/85 text-on text-[10px] font-bold px-3 py-1 rounded-full">{bookedCount[s._id] || 0} active</span>
              </div>
              <div className="p-5">
                <h3 className="font-black leading-tight line-clamp-1">{s.name}</h3>
                <p className="text-xs text-muted mt-1 flex items-center gap-1"><FiMapPin size={11} />{s.location} · {s.duration}</p>
                <p className="text-sm text-muted mt-3 line-clamp-2">{s.about}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                  <p className="font-black text-accent text-lg" style={serif}>{s.balance}</p>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(s)} className="p-2.5 rounded-xl text-brand-ink hover:bg-brand/10" title="Edit"><FiEdit2 size={16} /></button>
                    <button onClick={() => onDelete(s, bookedCount[s._id] || 0)} className="p-2.5 rounded-xl text-red-500 hover:bg-red-50" title="Delete"><FiTrash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      )}

      <AnimatePresence>
      {modal && (
        <ServiceModal
          initial={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onSave={async (form) => {
            const ok = await onSave(form);
            if (ok) setModal(null);
            return ok;
          }}
        />
      )}
      </AnimatePresence>
    </div>
  );
};

/* ───────────── Root ───────────── */
const TABS = [
  { id: "overview", label: "Overview", icon: <FiGrid /> },
  { id: "bookings", label: "Bookings", icon: <FiList /> },
  { id: "services", label: "Packages", icon: <FiMap /> },
];

const AdminDashboard = () => {
  const [user, authLoading] = useAuthState(auth);
  const [tab, setTab] = useState("overview");
  const [rawBookings, setBookings] = useState([]);
  const [invoiceFor, setInvoiceFor] = useState(null);
  const now = useNow(30000);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  /* an unpaid advance past its 72 hours already reads cancelled (the server cancels it for real) */
  const bookings = useMemo(() => rawBookings.map((b) => withLiveStatus(b, now)), [rawBookings, now]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        authFetch(API_BOOKINGS),
        fetch(API_SERVICES_PUBLIC),
      ]);
      if (bRes.status === 401 || bRes.status === 403) {
        toast.error("Admin access denied by server. Check ADMIN_EMAILS and that your email is verified.");
      } else if (!bRes.ok) throw new Error("bookings");
      else {
        const b = await bRes.json();
        setBookings(Array.isArray(b) ? b : []);
      }
      const s = sRes.ok ? await sRes.json() : [];
      setServices(Array.isArray(s) ? s : []);
    } catch {
      toast.error("Could not load the dashboard data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin, loadAll]);

  const selected = bookings.find((b) => b._id === selectedId) || null;

  const updateStatus = async (id, status) => {
    setBusyId(id);
    try {
      const res = await authFetch(`${API_BOOKINGS}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result.message);
      const current = rawBookings.find((b) => b._id === id);
      let next = { status };
      if (result.booking) next = result.booking;
      else if (status === "confirmed" && current) next = confirmLocally(current, rawBookings);
      setBookings((p) => p.map((b) => (b._id === id ? { ...b, ...next } : b)));
      if (status === "cancelled") toast.success("Booking cancelled. It stays in the list as cancelled.");
      else if (status === "confirmed" && next.status === "awaiting_payment")
        toast.success(`Approved. The client has ${HOLD_HOURS} hours to pay the ${ADVANCE_PERCENT}% advance.`);
      else toast.success(`Booking marked as ${next.status}.`);
    } catch (e) {
      toast.error(e.message || "Could not update the booking status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const saveBookingEdit = async (fields) => {
    const b = editing;
    setSavingEdit(true);
    try {
      const res = await authFetch(`${API_BOOKINGS}/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok || !r.success) throw new Error(r.message || "Could not update this booking. Please try again.");
      const perTraveler = b.travelers ? Number(b.totalAmount || 0) / Number(b.travelers) : 0;
      const merged = r.booking || { ...b, ...fields, totalAmount: Math.round(perTraveler * fields.travelers) };
      setBookings((p) => p.map((x) => (x._id === b._id ? { ...x, ...merged } : x)));
      toast.success("Booking updated.");
      setEditing(null);
    } catch (e) {
      toast.error(e.message || "Could not update this booking. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteBookingNow = async (b) => {
    try {
      const res = await authFetch(`${API_BOOKINGS}/${b._id}`, { method: "DELETE" });
      const r = await res.json().catch(() => ({}));
      if (!res.ok || !r.success) throw new Error(r.message || "Delete failed");
      setBookings((p) => p.filter((x) => x._id !== b._id));
      setSelectedId(null);
      toast.success("Booking deleted");
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  const deleteBooking = (b) =>
    setConfirm({
      title: "Delete this booking?",
      text: `${b.userName} · ${b.serviceName}. This removes the request from the database permanently and cannot be undone.`,
      label: "Delete",
      run: () => deleteBookingNow(b),
    });

  const saveService = async (form) => {
    const isEdit = !!form._id;
    try {
      const res = await authFetch(isEdit ? `${API_SERVICES}/${form._id}` : API_SERVICES, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok || !r.success) throw new Error(r.message || "Save failed");
      setServices((p) => (isEdit ? p.map((s) => (s._id === r.service._id ? r.service : s)) : [r.service, ...p]));
      toast.success(isEdit ? "Package updated" : "Package created");
      return true;
    } catch (e) {
      toast.error(e.message || "Failed to save package");
      return false;
    }
  };

  const deleteService = (s, active) =>
    setConfirm({
      title: "Delete this package?",
      text: active
        ? `"${s.name}" has ${active} active booking(s). Existing bookings stay, but the package disappears from the site.`
        : `"${s.name}" will be removed from the site.`,
      label: "Delete",
      run: async () => {
        const res = await authFetch(`${API_SERVICES}/${s._id}`, { method: "DELETE" });
        const r = await res.json().catch(() => ({}));
        if (!res.ok || !r.success) throw new Error(r.message || "Delete failed");
        setServices((p) => p.filter((x) => x._id !== s._id));
        toast.success("Package deleted");
      },
    });

  const runConfirm = async () => {
    setConfirmBusy(true);
    try {
      await confirm.run();
      setConfirm(null);
    } catch (e) {
      toast.error(e.message || "Action failed");
    } finally {
      setConfirmBusy(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-sandy pt-[76px] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-brand" />
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen bg-sandy pt-[76px] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-4xl font-black mb-3" style={serif}>Access Denied</h2>
          <p className="text-muted">Only the admin can access this page.</p>
        </div>
      </main>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <main className="min-h-screen bg-sandy pt-[76px] pb-16">
      <section className="relative overflow-hidden bg-panel text-on">
        <Aurora />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent-lt font-black">Sababa Tours</p>
            <h1 className="text-4xl md:text-6xl font-black mt-2" style={serif}><BlurText text="Admin Dashboard" /></h1>
            <p className="text-on/60 text-sm mt-2">Signed in as {user.email}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadAll} className="px-5 py-3 rounded-2xl bg-on/10 hover:bg-on/20 border border-on/20 text-sm font-bold flex items-center gap-2">
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={() => setTab("services")} className="px-5 py-3 rounded-2xl bg-accent-lt text-deep text-sm font-black flex items-center gap-2 hover:shadow-lg">
              <FiPlus /> Packages
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="-mt-6 mb-6 relative z-10">
          <PillTabs
            id="admin-tabs"
            items={TABS.map((t) => ({
              ...t,
              badge: t.id === "bookings" && pendingCount > 0 ? pendingCount : undefined,
              badgeTone: "alert",
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "overview" &&
          (loading ? <Spinner /> : <Overview bookings={bookings} services={services} onOpen={(b) => setSelectedId(b._id)} goTab={setTab} />)}
        {tab === "bookings" && (
          <BookingsPanel bookings={bookings} loading={loading} busyId={busyId} onOpen={(b) => setSelectedId(b._id)} onStatus={updateStatus} onDelete={deleteBooking} onEdit={setEditing} />
        )}
        {tab === "services" && (
          <ServicesPanel services={services} bookings={bookings} loading={loading} onSave={saveService} onDelete={deleteService} />
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <BookingDrawer key={selected._id} booking={selected} all={bookings} busy={busyId === selected._id} onClose={() => setSelectedId(null)} onStatus={updateStatus} onDeleteNow={deleteBookingNow} onEdit={setEditing} onInvoice={setInvoiceFor} />
        )}
      </AnimatePresence>
      {editing && (
        <EditBookingModal booking={editing} minDate="2000-01-01" saving={savingEdit} onSave={saveBookingEdit} onClose={() => setEditing(null)} />
      )}
      <InvoiceModal booking={invoiceFor} onClose={() => setInvoiceFor(null)} />
      <ConfirmDialog open={!!confirm} title={confirm?.title} text={confirm?.text} confirmLabel={confirm?.label} danger busy={confirmBusy} onConfirm={runConfirm} onCancel={() => setConfirm(null)} />
    </main>
  );
};

export default AdminDashboard;
