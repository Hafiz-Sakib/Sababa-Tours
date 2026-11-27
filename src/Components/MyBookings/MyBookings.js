// src/Components/MyBookings/MyBookings.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../Firebase.init";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../Utilities/authFetch";
import {
  AnimatePresence,
  AnimatedNumber,
  Aurora,
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
    pill: "bg-amber-100 text-amber-700 ring-amber-200",
    bar: "from-amber-400 to-amber-300",
    step: 1,
    note: "Waiting for our team to review your request.",
  },
  confirmed: {
    pill: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    bar: "from-emerald-500 to-teal-400",
    step: 2,
    note: "Confirmed! Our team will share the next steps.",
  },
  cancelled: {
    pill: "bg-red-100 text-red-600 ring-red-200",
    bar: "from-red-400 to-red-300",
    step: 0,
    note: "This request was cancelled.",
  },
};

const fmt = (d, opts) =>
  d ? new Date(d).toLocaleDateString("en-GB", opts) : "—";

/* progress rail: Requested → Reviewed → Confirmed */
const Rail = ({ status }) => {
  const st = STATUS[status] || STATUS.pending;
  const labels = ["Requested", "Reviewing", "Confirmed"];
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-red-500">
        <FiXCircle /> Request cancelled
      </div>
    );
  }
  const filled = status === "confirmed" ? 3 : 2;
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
                i < filled
                  ? "bg-[#0b6b62] text-white"
                  : "bg-[#e7dfd0] text-[#5a6a7e]"
              }`}
            >
              {i < filled ? <FiCheckCircle size={12} /> : i + 1}
            </motion.span>
            <span
              className={`hidden text-[11px] font-bold sm:block ${i < filled ? "text-[#0d1f35]" : "text-[#5a6a7e]"}`}
            >
              {l}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-[#e7dfd0]">
              <motion.div
                className={`h-full bg-gradient-to-r ${st.bar}`}
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

const MyBookings = () => {
  const [user] = useAuthState(auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter] = useState("all");

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

  const cancelBooking = async (id) => {
    setCancellingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/bookings/${id}/cancel`, {
        method: "PATCH",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success)
        throw new Error(result.message || "Could not cancel booking");
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b)),
      );
      toast.success("Booking cancelled");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );
  const spent = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "cancelled")
        .reduce((s, b) => s + Number(b.totalAmount || 0), 0),
    [bookings],
  );

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] pt-[76px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4">Please Login First</h2>
          <p className="text-[#5a6a7e]">
            You need to be logged in to view your bookings.
          </p>
        </div>
      </main>
    );
  }

  const visible = bookings.filter((b) => filter === "all" || b.status === filter);
  const tabs = ["all", "pending", "confirmed", "cancelled"].map((s) => ({
    id: s,
    label: s,
    badge: counts[s],
  }));

  return (
    <main className="min-h-screen bg-[#f5f0e8] pt-[76px] pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0d1f35] text-white">
        <Aurora />
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-6 py-14 lg:px-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e8c96a]">
              Your trips
            </p>
            <h1 className="mt-2 text-4xl font-black md:text-6xl" style={serif}>
              <BlurText text="My Bookings" />
            </h1>
            <p className="mt-2 text-sm text-white/60">
              All your travel requests in one place
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchBookings}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Magnetic>
              <Link
                to="/services"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] px-6 py-3 text-sm font-black text-[#0d1f35] hover:shadow-lg hover:shadow-[#c9a84c]/30"
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
            ["Pending", counts.pending, ""],
            ["Confirmed", counts.confirmed, ""],
            ["Est. total", spent, "BDT "],
          ].map(([l, n, p], i) => (
            <motion.div
              key={l}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                {l}
              </p>
              <p className="mt-1 text-2xl font-black text-white" style={serif}>
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
            className="rounded-3xl border border-[#e7dfd0] bg-white py-20 text-center"
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
            <p className="mb-6 text-[#5a6a7e]">
              {bookings.length
                ? "No bookings match this filter."
                : "When you book a trip, it will appear here."}
            </p>
            {!bookings.length && (
              <Link
                to="/services"
                className="inline-block rounded-full bg-[#0d1f35] px-7 py-3 text-sm font-bold text-white hover:bg-[#0b6b62]"
              >
                Browse packages
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div layout className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {visible.map((b, idx) => {
                const st = STATUS[b.status] || STATUS.pending;
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
                      className={`overflow-hidden rounded-3xl border border-[#e7dfd0] bg-white shadow-[0_10px_40px_rgba(13,31,53,0.06)] transition-shadow hover:shadow-[0_24px_60px_rgba(13,31,53,0.12)] ${b.status === "cancelled" ? "opacity-75" : ""}`}
                    >
                      <div className={`h-1.5 bg-gradient-to-r ${st.bar}`} />
                      <div className="flex flex-col justify-between gap-5 p-7 md:flex-row md:items-start">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold capitalize ring-1 ${st.pill}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {b.status}
                          </span>
                          <h3
                            className="mt-3 text-2xl font-black leading-tight text-[#0d1f35] md:text-3xl"
                            style={serif}
                          >
                            {b.serviceId ? (
                              <Link to={`/booking/${b.serviceId}`} className="hover:text-[#0b6b62]">
                                {b.serviceName}
                              </Link>
                            ) : (
                              b.serviceName
                            )}
                          </h3>
                          <p className="mt-1 text-xs text-[#5a6a7e]">
                            ID: <span className="font-mono">{b._id}</span>
                          </p>
                          <p className="mt-3 text-sm text-[#5a6a7e]">{st.note}</p>
                        </div>
                        <div className="shrink-0 md:text-right">
                          <p className="text-3xl font-black text-[#e85d45]" style={serif}>
                            <AnimatedNumber value={Number(b.totalAmount || 0)} prefix="BDT " />
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[#5a6a7e]">
                            Total estimate
                          </p>
                        </div>
                      </div>

                      <div className="px-7 pb-6">
                        <Rail status={b.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-5 border-t border-[#e7dfd0] bg-[#faf7f2] px-7 py-5 text-sm md:grid-cols-4">
                        <Info icon={<FiCalendar />} label="Trip date">
                          {fmt(b.preferredDate, { day: "numeric", month: "long", year: "numeric" })}
                        </Info>
                        <Info icon={<FiUsers />} label="Travelers">{b.travelers}</Info>
                        <Info icon={<FiPhone />} label="Phone">{b.phoneNumber}</Info>
                        <Info icon={<FiClock />} label="Requested">{fmt(b.createdAt)}</Info>
                        <div className="col-span-2 md:col-span-4">
                          <Info icon={<FiMapPin />} label="Address">{b.address}</Info>
                        </div>
                        {b.notes && (
                          <div className="col-span-2 text-[#5a6a7e] md:col-span-4">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Your note:{" "}
                            </span>
                            {b.notes}
                          </div>
                        )}
                      </div>

                      {b.status === "pending" && (
                        <div className="flex items-center justify-end gap-3 border-t border-[#e7dfd0] px-7 py-4">
                          <AnimatePresence mode="wait" initial={false}>
                            {confirmId === b._id ? (
                              <motion.div
                                key="confirm"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                className="flex w-full items-center gap-3"
                              >
                                <span className="mr-auto text-sm text-[#5a6a7e]">
                                  Cancel this request?
                                </span>
                                <button
                                  onClick={() => setConfirmId(null)}
                                  className="rounded-full border border-[#e7dfd0] px-4 py-2 text-xs font-bold text-[#5a6a7e] hover:bg-[#f5f0e8]"
                                >
                                  Keep it
                                </button>
                                <button
                                  onClick={() => cancelBooking(b._id)}
                                  disabled={cancellingId === b._id}
                                  className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60"
                                >
                                  {cancellingId === b._id ? "Cancelling…" : "Yes, cancel"}
                                </button>
                              </motion.div>
                            ) : (
                              <motion.button
                                key="ask"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setConfirmId(b._id)}
                                className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                              >
                                <FiXCircle /> Cancel request
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </TiltCard>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
};

const Info = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 text-[#0b6b62]">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#5a6a7e]">{label}</p>
      <p className="break-words font-semibold text-[#0d1f35]">{children || "—"}</p>
    </div>
  </div>
);

export default MyBookings;
