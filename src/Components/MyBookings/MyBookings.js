// src/Components/MyBookings/MyBookings.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../Firebase.init";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiEdit2,
  FiFileText,
  FiLock,
  FiMapPin,
  FiMaximize2,
  FiX,
  FiPhone,
  FiRefreshCw,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../Utilities/authFetch";
import { customerAccess, LOCK_DAYS } from "../Utilities/bookingRules";
import { extraRows } from "../Utilities/tripExtras";
import EditBookingModal from "../Booking/EditBookingModal";
import ActionBtn from "../ui/ActionBtn";
import HoldButton from "../ui/HoldButton";
import { imgProps } from "../Utilities/image";
import { HoldBanner } from "../Billing/HoldBanner";
import {
  canPay,
  displayStatus,
  money,
  moneyOf,
  paidOf,
  useNow,
  withLiveStatus,
} from "../Utilities/payment";
import {
  AnimatePresence,
  AnimatedNumber,
  Aurora,
  Backdrop,
  BlurText,
  Magnetic,
  PillTabs,
  Shimmer,
  TiltCard,
  motion,
} from "../ui/Motion";

const serif = { fontFamily: "var(--font-display)" };

const STATUS = {
  pending: {
    label: "pending",
    pill: "bg-amber-100 text-amber-700 ring-amber-200",
    bar: "from-amber-400 to-amber-300",
    note: "Waiting for our team to review your request.",
  },
  awaiting_payment: {
    label: "advance due",
    pill: "bg-orange-100 text-orange-700 ring-orange-200",
    bar: "from-orange-400 to-amber-300",
    note: "Approved! Pay the 30% advance to confirm your booking.",
  },
  confirmed: {
    label: "confirmed",
    pill: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    bar: "from-emerald-500 to-teal-400",
    note: "Confirmed! You can pay the rest any time from the billing page.",
  },
  paid: {
    label: "paid in full",
    pill: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    bar: "from-emerald-500 to-teal-400",
    note: "Everything is paid. Have a great trip!",
  },
  cancelled: {
    label: "cancelled",
    pill: "bg-red-100 text-red-600 ring-red-200",
    bar: "from-red-400 to-red-300",
    note: "This request was cancelled.",
  },
};

const fmt = (d, opts) =>
  d ? new Date(d).toLocaleDateString("en-GB", opts) : "—";

/* progress rail: Requested → Approved → Confirmed → Paid */
const Rail = ({ status, bar }) => {
  const labels = ["Requested", "Approved", "Confirmed", "Paid"];
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-red-500">
        <FiXCircle /> Request cancelled
      </div>
    );
  }
  const filled = { pending: 1, awaiting_payment: 2, confirmed: 3, paid: 4 }[status] || 1;
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center gap-2 last:flex-none">
          <div className="flex items-center gap-2">
            <motion.span
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 * i, type: "spring", stiffness: 400 }}
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${
                i < filled ? "bg-brand text-white" : "bg-line text-muted"
              }`}
            >
              {i < filled ? <FiCheckCircle size={12} /> : i + 1}
            </motion.span>
            <span
              className={`hidden text-[11px] font-bold sm:block ${i < filled ? "text-ink" : "text-muted"}`}
            >
              {l}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div
                className={`h-full bg-gradient-to-r ${bar}`}
                initial={{ width: 0 }}
                animate={{ width: i < filled - 1 ? "100%" : "0%" }}
                transition={{ duration: 0.8, delay: 0.2 + 0.2 * i }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* paid / balance strip on a card, with a marker where the 30% advance sits */
const MoneyStrip = ({ b }) => {
  const m = moneyOf(b);
  return (
    <div className="mx-5 mb-4 rounded-2xl border border-line bg-page-alt px-4 py-3">
      <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
        {[
          ["Total", m.total, "text-ink"],
          ["Paid", m.paid, "text-emerald-600"],
          [b.status === "cancelled" ? "Refund due" : "Balance", b.status === "cancelled" ? m.refundDue : m.balance, "text-amber-600"],
        ].map(([l, v, c]) => (
          <div key={l}>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">{l}</p>
            <p className={`mt-0.5 text-sm font-black sm:text-base ${c}`}>{money(v)}</p>
          </div>
        ))}
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand to-accent-lt"
          initial={{ width: 0 }}
          animate={{ width: `${m.pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <span className="absolute -top-1 bottom-[-4px] w-0.5 bg-ink/40" style={{ left: "30%" }} aria-hidden />
      </div>
      <p className="mt-1.5 text-[10px] font-bold text-muted" style={{ marginLeft: "calc(30% - 28px)" }}>
        30% advance {m.advanceMet ? "✓" : ""}
      </p>
    </div>
  );
};

/* small rounded picture of the booked place: leans with the cursor, zooms on hover, press it to open it large */
const BookingImage = ({ picture, name, cancelled, onOpen }) => {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(useTransform(mx, (v) => v * -8), { stiffness: 140, damping: 20 });
  const y = useSpring(useTransform(my, (v) => v * -8), { stiffness: 140, damping: 20 });
  const move = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => {
    mx.set(0);
    my.set(0);
  };
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseMove={move}
      onMouseLeave={leave}
      aria-label={`Open picture of ${name}`}
      className="group/img relative mt-0.5 block h-[68px] w-[68px] shrink-0 cursor-zoom-in overflow-hidden rounded-2xl bg-line shadow-md ring-2 ring-surface transition-shadow duration-300 hover:shadow-xl sm:h-24 sm:w-24 sm:rounded-3xl"
    >
      <div className="absolute inset-0 scale-110 transition-transform duration-500 ease-out group-hover/img:scale-[1.3]">
        <motion.img
          {...imgProps(picture)}
          alt={name}
          loading="lazy"
          style={{ x, y }}
          className={`h-full w-full object-cover ${cancelled ? "grayscale" : ""}`}
        />
      </div>
      <span className="absolute inset-0 grid place-items-center bg-scrim/0 text-on opacity-0 transition duration-300 group-hover/img:bg-scrim/35 group-hover/img:opacity-100">
        <FiMaximize2 size={16} />
      </span>
    </button>
  );
};

/* big preview of a booked place */
const PicturePreview = ({ item, onClose }) => {
  useEffect(() => {
    if (!item) return undefined;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [item, onClose]);
  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <Backdrop onClick={onClose} />
          <motion.figure
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-surface shadow-[0_32px_90px_rgba(0,0,0,0.5)]"
          >
            <img {...imgProps(item.picture)} alt={item.name} className="max-h-[68vh] w-full object-cover" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-scrim/60 text-on backdrop-blur transition hover:bg-scrim/80"
            >
              <FiX />
            </button>
            <figcaption className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-ink" style={serif}>{item.name}</p>
                {item.place && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <FiMapPin className="text-brand-ink" /> {item.place}
                  </p>
                )}
              </div>
              {item.serviceId && (
                <Link
                  to={`/booking/${item.serviceId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cta to-accent-lt px-5 py-2.5 text-sm font-black text-deep"
                >
                  View package <FiArrowRight />
                </Link>
              )}
            </figcaption>
          </motion.figure>
        </div>
      )}
    </AnimatePresence>
  );
};

const MyBookings = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const now = useNow(30000);
  const [rawBookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [services, setServices] = useState({}); // package id -> package (for the picture and place)
  const [preview, setPreview] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  /* an unpaid advance whose 72 hours ran out already reads "cancelled" (the server cancels it for real) */
  const bookings = useMemo(() => rawBookings.map((b) => withLiveStatus(b, now)), [rawBookings, now]);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/bookings/user/${user.uid}`,
      );
      if (!response.ok) throw new Error("Failed to load bookings");
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // package pictures come from the public package list, matched by id
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/services`);
        const list = await res.json();
        if (off || !Array.isArray(list)) return;
        setServices(Object.fromEntries(list.map((x) => [x._id, x])));
      } catch {
        /* cards just show without a picture */
      }
    })();
    return () => {
      off = true;
    };
  }, []);

  const cancelBooking = async (id) => {
    setCancellingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/bookings/${id}/cancel`, {
        method: "PATCH",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success)
        throw new Error(result.message || "Could not cancel this booking. Please try again.");
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b)),
      );
      toast.success("Booking cancelled.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  const deleteBooking = async (id) => {
    setDeletingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/bookings/${id}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success)
        throw new Error(result.message || "Could not delete this booking. Please try again.");
      setBookings((prev) => prev.filter((b) => b._id !== id));
      toast.success("Booking deleted.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const saveEdit = async (fields) => {
    const b = editing;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/bookings/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success)
        throw new Error(result.message || "Could not update this booking. Please try again.");
      const perTraveler = b.travelers ? Number(b.totalAmount || 0) / Number(b.travelers) : 0;
      const merged = result.booking || {
        ...b,
        ...fields,
        totalAmount: Math.round(perTraveler * fields.travelers),
        status: b.status === "confirmed" || b.status === "awaiting_payment" ? "pending" : b.status,
      };
      setBookings((prev) => prev.map((x) => (x._id === b._id ? { ...x, ...merged } : x)));
      toast.success(
        b.status === "confirmed" || b.status === "awaiting_payment"
          ? "Booking updated. Our team will review the changes and confirm again. Your payments are kept."
          : "Booking updated.",
      );
      setEditing(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      awaiting_payment: bookings.filter((b) => b.status === "awaiting_payment").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );
  const paidTotal = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "cancelled")
        .reduce((s, b) => s + paidOf(b), 0),
    [bookings],
  );

  if (!user) {
    return (
      <main className="min-h-screen bg-sandy pt-[76px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4">Please Login First</h2>
          <p className="text-muted">
            You need to be logged in to view your bookings.
          </p>
        </div>
      </main>
    );
  }

  const visible = bookings.filter((b) => filter === "all" || b.status === filter);
  const tabLabel = { awaiting_payment: "to pay" };
  const tabs = ["all", "pending", "awaiting_payment", "confirmed", "cancelled"].map((s) => ({
    id: s,
    label: tabLabel[s] || s,
    badge: counts[s],
    badgeTone: s === "awaiting_payment" && counts[s] > 0 ? "alert" : undefined,
  }));

  return (
    <main className="min-h-screen bg-sandy pt-[76px] pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-panel text-on">
        <Aurora />
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-6 py-14 lg:px-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-lt">
              Your trips
            </p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl" style={serif}>
              <BlurText text="My Bookings" />
            </h1>
            <p className="mt-2 text-sm text-on/60">
              All your travel requests in one place
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchBookings}
              className="flex items-center gap-2 rounded-full border border-on/20 bg-on/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-on/20"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Magnetic>
              <Link
                to="/services"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cta to-accent-lt px-6 py-3 text-sm font-black text-deep hover:shadow-lg hover:shadow-accent/30"
              >
                Explore packages <FiArrowRight />
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* Summary strip */}
        <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-3 px-6 pb-12 sm:grid-cols-4 lg:px-10">
          {[
            ["Total trips", counts.all, ""],
            ["To pay", counts.awaiting_payment, ""],
            ["Confirmed", counts.confirmed, ""],
            ["Paid so far", paidTotal, "BDT "],
          ].map(([l, n, p], i) => (
            <motion.div
              key={l}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="rounded-3xl border border-on/10 bg-white/[0.07] p-4 backdrop-blur"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-on/50">
                {l}
              </p>
              <p className="mt-1 text-2xl font-black text-on" style={serif}>
                <AnimatedNumber value={n} prefix={p} />
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <div className="-mt-6 mb-8">
          <PillTabs id="mybookings" items={tabs} value={filter} onChange={setFilter} />
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[0, 1].map((i) => (
              <Shimmer key={i} className="h-56 rounded-3xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-line bg-surface py-20 text-center"
          >
            <motion.p
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="mb-6 text-6xl"
            >
              🗺️
            </motion.p>
            <h3 className="mb-3 text-2xl font-bold">
              {bookings.length ? "Nothing here" : "No bookings yet"}
            </h3>
            <p className="mb-6 text-muted">
              {bookings.length
                ? "No bookings match this filter."
                : "When you book a trip, it will appear here."}
            </p>
            {!bookings.length && (
              <Link
                to="/services"
                className="inline-block rounded-full bg-btn px-7 py-3 text-sm font-bold text-white hover:bg-brand"
              >
                Browse packages
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {visible.map((b, idx) => {
                const shown = displayStatus(b);
                const st = STATUS[shown] || STATUS.pending;
                const svc = services[b.serviceId];
                return (
                  <motion.article
                    key={b._id}
                    layout
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 260, damping: 26 }}
                  >
                    <TiltCard
                      max={2.5}
                      className={`overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_10px_40px_rgba(16,24,40,0.06)] transition-shadow hover:shadow-[0_24px_60px_rgba(16,24,40,0.12)] ${b.status === "cancelled" ? "opacity-75" : ""}`}
                    >
                      <div className={`h-1.5 bg-gradient-to-r ${st.bar}`} />
                      <div className="flex items-start gap-3.5 p-4 sm:gap-4">
                        <BookingImage
                          picture={svc?.picture || b.servicePicture}
                          name={b.serviceName}
                          cancelled={b.status === "cancelled"}
                          onOpen={() =>
                            setPreview({
                              picture: svc?.picture || b.servicePicture,
                              name: b.serviceName,
                              place: svc?.location || b.serviceLocation,
                              serviceId: svc ? b.serviceId : null,
                            })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold capitalize ring-1 ${st.pill}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {st.label}
                          </span>
                          <h3
                            className="mt-1.5 text-lg font-black leading-tight text-ink md:text-xl"
                            style={serif}
                          >
                            {b.serviceId ? (
                              <Link to={`/booking/${b.serviceId}`} className="hover:text-brand-ink">
                                {b.serviceName}
                              </Link>
                            ) : (
                              b.serviceName
                            )}
                          </h3>
                          {(svc?.location || b.serviceLocation) && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ink/80">
                              <FiMapPin className="shrink-0 text-brand-ink" />
                              <span className="truncate">
                                {svc?.location || b.serviceLocation}
                                {svc?.duration ? ` · ${svc.duration}` : ""}
                              </span>
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted">
                            ID: <span className="font-mono">{b._id}</span>
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {b.cancelReason === "advance_not_paid"
                              ? "Cancelled automatically: the 30% advance was not paid within 72 hours."
                              : st.note}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xl font-black text-accent" style={serif}>
                            <AnimatedNumber value={Number(b.totalAmount || 0)} prefix="BDT " />
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                            Total estimate
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-3">
                        <Rail status={shown} bar={st.bar} />
                      </div>

                      {b.status === "awaiting_payment" && (
                        <div className="px-5 pb-3">
                          <HoldBanner
                            b={b}
                            compact
                            onPay={() => navigate(`/my-bookings/${b._id}/billing`)}
                            onExpire={fetchBookings}
                          />
                        </div>
                      )}
                      {(b.status === "confirmed" || b.status === "awaiting_payment" || moneyOf(b).paid > 0) && <MoneyStrip b={b} />}

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line bg-page-alt px-5 py-3 text-sm md:grid-cols-4">
                        <Info icon={<FiCalendar />} label="Trip date">
                          {fmt(b.preferredDate, { day: "numeric", month: "long", year: "numeric" })}
                        </Info>
                        <Info icon={<FiUsers />} label="Travelers">{b.travelers}</Info>
                        <Info icon={<FiPhone />} label="Phone">{b.phoneNumber}</Info>
                        <Info icon={<FiClock />} label="Requested">{fmt(b.createdAt)}</Info>
                        <div className="col-span-2 md:col-span-4">
                          <Info icon={<FiMapPin />} label="Address">{b.address}</Info>
                        </div>
                        {extraRows(b).length > 0 && (
                          <div className="col-span-2 mt-0.5 border-t border-line pt-2.5 md:col-span-4">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-brand-ink">Trip details</p>
                            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                              {extraRows(b).map((r) => (
                                <div key={r.key} className="min-w-0">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">{r.label}</p>
                                  <p className="break-words text-sm font-semibold text-ink">{r.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {b.notes && (
                          <div className="col-span-2 text-muted md:col-span-4">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Your note:{" "}
                            </span>
                            {b.notes}
                          </div>
                        )}
                      </div>

                      <BookingActions
                        booking={b}
                        cancellingId={cancellingId}
                        onCancel={cancelBooking}
                        deletingId={deletingId}
                        onDelete={deleteBooking}
                        onEdit={() => setEditing(b)}
                        onBilling={() => navigate(`/my-bookings/${b._id}/billing`)}
                      />
                    </TiltCard>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <PicturePreview item={preview} onClose={() => setPreview(null)} />

      {editing && (
        <EditBookingModal
          booking={editing}
          minDate={minTripDate()}
          saving={saving}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
};

/* earliest trip date a customer may move a booking to (today + the lock window) */
const minTripDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + LOCK_DAYS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* action row of one booking card:
   Billing / Pay, Update, Hold-to-cancel (amber) inside the change window, a lock note after it,
   Hold-to-delete (red) for cancelled ones */
const BookingActions = ({
  booking: b,
  cancellingId,
  onCancel,
  deletingId,
  onDelete,
  onEdit,
  onBilling,
}) => {
  const access = customerAccess(b);
  const m = moneyOf(b);
  const awaiting = b.status === "awaiting_payment";
  const showBilling = b.status !== "cancelled" || m.paid > 0;

  return (
    <div className="border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          {showBilling && (
            <ActionBtn
              tone={awaiting ? "pay" : "billing"}
              icon={awaiting ? FiCreditCard : FiFileText}
              attention={awaiting}
              onClick={onBilling}
            >
              {awaiting ? `Pay ${money(m.advanceDue)} advance` : canPay(b) && m.balance > 0 ? "Billing & pay" : "Billing & invoice"}
            </ActionBtn>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {access.canEdit && (
            <ActionBtn tone="update" icon={FiEdit2} onClick={onEdit}>
              Update
            </ActionBtn>
          )}
          {access.canCancel && (
            <HoldButton
              tone="cancel"
              label="Hold to cancel"
              doneLabel="Cancelled"
              disabled={cancellingId === b._id}
              onConfirm={() => onCancel(b._id)}
            />
          )}
          {access.canDelete && (
            <HoldButton
              tone="delete"
              label="Hold to delete"
              doneLabel="Deleted"
              disabled={deletingId === b._id}
              onConfirm={() => onDelete(b._id)}
            />
          )}
        </div>
      </div>

      {access.canCancel && m.paid > 0 && (
        <p className="border-t border-line px-5 py-2.5 text-xs text-muted">
          If you cancel after paying {money(m.paid)}, our travel desk will contact you about the refund.
        </p>
      )}

      {access.locked && (
        <div className="flex items-start gap-3 border-t border-line px-5 py-2.5 text-sm text-muted">
          <FiLock className="mt-0.5 shrink-0 text-brand-ink" />
          <p>{access.lockMessage}</p>
        </div>
      )}
    </div>
  );
};

const Info = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 text-brand-ink">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</p>
      <p className="break-words font-semibold text-ink">{children || "—"}</p>
    </div>
  </div>
);

export default MyBookings;
