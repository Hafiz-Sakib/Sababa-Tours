// src/Components/MyBookings/MyBookings.js
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../Firebase.init";
import {
  FiCalendar,
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

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const STATUS = {
  pending: {
    pill: "bg-amber-100 text-amber-700 ring-amber-200",
    note: "Waiting for our team to review your request.",
  },
  confirmed: {
    pill: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    note: "Confirmed! Our team will share the next steps.",
  },
  cancelled: {
    pill: "bg-red-100 text-red-600 ring-red-200",
    note: "This request was cancelled.",
  },
};

const fmt = (d, opts) =>
  d ? new Date(d).toLocaleDateString("en-GB", opts) : "—";

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

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };
  const visible = bookings.filter((b) => filter === "all" || b.status === filter);

  return (
    <main className="min-h-screen bg-[#f5f0e8] pt-[76px] pb-20">
      <section className="bg-gradient-to-br from-[#0d1f35] to-[#0b6b62] text-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#e8c96a] font-black">
              Your trips
            </p>
            <h1 className="text-4xl md:text-5xl font-black mt-2" style={serif}>
              My Bookings
            </h1>
            <p className="text-white/60 text-sm mt-2">
              All your travel requests in one place
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchBookings}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold flex items-center gap-2"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Link
              to="/services"
              className="px-5 py-3 rounded-2xl bg-[#e8c96a] text-[#0d1f35] text-sm font-black hover:shadow-lg"
            >
              Explore packages
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 -mt-5">
        <div className="flex gap-1 bg-white border border-[#e7dfd0] rounded-2xl p-1.5 w-fit shadow-md mb-8 max-w-full overflow-x-auto">
          {["all", "pending", "confirmed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition ${filter === s ? "bg-[#0d1f35] text-white" : "text-[#5a6a7e] hover:bg-[#f5f0e8]"}`}
            >
              {s} <span className="opacity-60 ml-1">{counts[s]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e7dfd0] border-t-[#0b6b62]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#e7dfd0]">
            <p className="text-6xl mb-6">🗺️</p>
            <h3 className="text-2xl font-bold mb-3">
              {bookings.length ? "Nothing here" : "No bookings yet"}
            </h3>
            <p className="text-[#5a6a7e] mb-6">
              {bookings.length
                ? "No bookings match this filter."
                : "When you book a trip, it will appear here."}
            </p>
            {!bookings.length && (
              <Link
                to="/services"
                className="inline-block px-7 py-3 bg-[#0d1f35] text-white rounded-2xl text-sm font-bold hover:bg-[#0b6b62]"
              >
                Browse packages
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {visible.map((b) => {
              const st = STATUS[b.status] || STATUS.pending;
              return (
                <article
                  key={b._id}
                  className={`bg-white border border-[#e7dfd0] rounded-3xl overflow-hidden hover:shadow-xl transition ${b.status === "cancelled" ? "opacity-75" : ""}`}
                >
                  <div className="p-7 flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold capitalize ring-1 ${st.pill}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {b.status}
                      </span>
                      <h3 className="text-2xl font-black text-[#0d1f35] mt-3 leading-tight" style={serif}>
                        {b.serviceId ? (
                          <Link to={`/booking/${b.serviceId}`} className="hover:text-[#0b6b62]">
                            {b.serviceName}
                          </Link>
                        ) : (
                          b.serviceName
                        )}
                      </h3>
                      <p className="text-xs text-[#5a6a7e] mt-1">
                        ID: <span className="font-mono">{b._id}</span>
                      </p>
                      <p className="text-sm text-[#5a6a7e] mt-3">{st.note}</p>
                    </div>
                    <div className="md:text-right shrink-0">
                      <p className="text-3xl font-black text-[#e85d45]" style={serif}>
                        BDT {Number(b.totalAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] uppercase tracking-widest text-[#5a6a7e] font-bold">
                        Total estimate
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-7 py-5 bg-[#faf7f2] border-t border-[#e7dfd0] text-sm">
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
                      <div className="col-span-2 md:col-span-4 text-[#5a6a7e]">
                        <span className="text-[10px] uppercase tracking-widest font-black">Your note: </span>
                        {b.notes}
                      </div>
                    )}
                  </div>

                  {b.status === "pending" && (
                    <div className="px-7 py-4 border-t border-[#e7dfd0] flex items-center justify-end gap-3">
                      {confirmId === b._id ? (
                        <>
                          <span className="text-sm text-[#5a6a7e] mr-auto">Cancel this request?</span>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-4 py-2 rounded-xl border border-[#e7dfd0] text-xs font-bold text-[#5a6a7e] hover:bg-[#f5f0e8]"
                          >
                            Keep it
                          </button>
                          <button
                            onClick={() => cancelBooking(b._id)}
                            disabled={cancellingId === b._id}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-60"
                          >
                            {cancellingId === b._id ? "Cancelling…" : "Yes, cancel"}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmId(b._id)}
                          className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 flex items-center gap-2"
                        >
                          <FiXCircle /> Cancel request
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

const Info = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="text-[#0b6b62] mt-0.5">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-[#5a6a7e] font-black">{label}</p>
      <p className="font-semibold text-[#0d1f35] break-words">{children || "—"}</p>
    </div>
  </div>
);

export default MyBookings;
