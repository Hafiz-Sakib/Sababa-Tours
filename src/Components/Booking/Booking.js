// src/Components/Booking/Booking.js
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiLock,
  FiMapPin,
  FiMinus,
  FiPhone,
  FiPlus,
  FiShield,
  FiStar,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import Modal from "./Modal";
import { auth } from "../../Firebase.init";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../Utilities/authFetch";

const MAX_TRAVELERS = 20;
const MAX_ADDRESS_WORDS = 30;
const MAX_NOTES = 500;
const PHONE_REGEX = /^(013|014|015|016|017|018|019)\d{8}$/;

const inclusions = [
  "Dedicated trip coordinator",
  "Vetted local guide & driver",
  "Flexible travel date request",
  "Detailed itinerary planning",
  "Safety briefing & support",
  "24/7 on-trip assistance",
];

const steps = [
  {
    title: "Send your request",
    text: "Pick a date, add your details and confirm. No payment needed.",
  },
  {
    title: "We review & call you",
    text: "Our travel desk checks availability and contacts you within 24 hours.",
  },
  {
    title: "Confirm & travel",
    text: "Once confirmed, we plan the itinerary and you enjoy the trip.",
  },
];

const faqs = [
  {
    q: "Do I have to pay now?",
    a: "No. Submitting the form only sends a request. Payment steps are shared after we confirm availability.",
  },
  {
    q: "Can I change or cancel my request?",
    a: "Yes. You can cancel a pending request any time from My Bookings. For confirmed trips, please contact our team.",
  },
  {
    q: "Is the total price final?",
    a: "The total is the package price multiplied by travelers. Our team confirms the final amount with you.",
  },
];

// Local (not UTC) YYYY-MM-DD so "today" is correct in Bangladesh
const todayLocal = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const draftKey = (id) => `bookingDraft:${id}`;
const loadDraft = (id) => {
  try {
    return JSON.parse(sessionStorage.getItem(draftKey(id))) || {};
  } catch {
    return {};
  }
};

const parsePrice = (balance) =>
  parseFloat(String(balance ?? "").replace(/[^0-9.]/g, "")) || 0;
const countWords = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;

const inputBase =
  "w-full border bg-[#f5f0e8] rounded-2xl px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:bg-white";
const inputCls = (err) =>
  `${inputBase} ${err ? "border-red-400 focus:border-red-500" : "border-[#e7dfd0] focus:border-[#0b6b62]/60"}`;

const Label = ({ icon, children, optional }) => (
  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5a6a7e] mb-2.5">
    {icon}
    {children}
    {optional && (
      <span className="normal-case tracking-normal font-medium text-[#5a6a7e]/60">
        (optional)
      </span>
    )}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mt-2">
      <FiAlertCircle size={13} /> {msg}
    </p>
  ) : null;

const Booking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);

  const [service, setService] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingBooking, setExistingBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBooking, setLastBooking] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Form values survive a trip to the login page (restored from the draft)
  const draft = useMemo(() => loadDraft(bookingId), [bookingId]);
  const [travelers, setTravelers] = useState(Number(draft.travelers) || 1);
  const [date, setDate] = useState(draft.date || "");
  const [phoneNumber, setPhoneNumber] = useState(draft.phoneNumber || "");
  const [address, setAddress] = useState(draft.address || "");
  const [notes, setNotes] = useState(draft.notes || "");
  const [errors, setErrors] = useState({});

  // 1. Load the package (public) + a few other packages to suggest
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setImgLoaded(false);
      try {
        const res = await fetch(`${API_BASE_URL}/api/services/${bookingId}`);
        if (res.status === 404) {
          if (!cancelled) setService(null);
          return;
        }
        if (!res.ok) throw new Error("Failed to load package");
        const data = await res.json();
        if (!cancelled) setService({ ...data, id: data._id });

        fetch(`${API_BASE_URL}/api/services`)
          .then((r) => (r.ok ? r.json() : []))
          .then((list) => {
            if (cancelled || !Array.isArray(list)) return;
            setRelated(list.filter((s) => s._id !== data._id).slice(0, 3));
          })
          .catch(() => {});
      } catch (error) {
        console.error("Failed to fetch data:", error);
        if (!cancelled) {
          setService(null);
          toast.error("Failed to load package details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    window.scrollTo({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // 2. If logged in, check whether the user already has an active request
  useEffect(() => {
    if (!user || !service) {
      setExistingBooking(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(
          `${API_BASE_URL}/api/bookings/user/${user.uid}`,
        );
        if (!res.ok) return;
        const list = await res.json();
        const active = (Array.isArray(list) ? list : []).find(
          (b) =>
            b.status !== "cancelled" &&
            String(b.serviceId) === String(service.id),
        );
        if (!cancelled) setExistingBooking(active || null);
      } catch (error) {
        console.error("Existing booking check failed:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, service]);

  // Keep the draft up to date so nothing is lost if login is required
  useEffect(() => {
    try {
      sessionStorage.setItem(
        draftKey(bookingId),
        JSON.stringify({ date, travelers, phoneNumber, address, notes }),
      );
    } catch {
      /* storage unavailable — ignore */
    }
  }, [bookingId, date, travelers, phoneNumber, address, notes]);

  const price = parsePrice(service?.balance);
  const total = Math.round(price * travelers);
  const wordCount = countWords(address);

  const validate = () => {
    const e = {};
    if (!date) e.date = "Please choose a travel date";
    else if (date < todayLocal()) e.date = "Travel date cannot be in the past";
    if (!phoneNumber) e.phone = "Phone number is required";
    else if (!PHONE_REGEX.test(phoneNumber))
      e.phone = "Enter a valid number, e.g. 017XXXXXXXX";
    if (!address.trim()) e.address = "Address is required";
    else if (wordCount > MAX_ADDRESS_WORDS)
      e.address = `Address must not exceed ${MAX_ADDRESS_WORDS} words`;
    return e;
  };

  const confirmBooking = async () => {
    if (submitting) return;
    if (existingBooking) {
      toast.error("You have already requested this tour.");
      return;
    }

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    // Login is only required here, at the moment of confirming.
    if (!user) {
      toast("Please log in to confirm your booking. Your details are saved.", {
        icon: "🔐",
      });
      navigate("/login", { state: { from: location } });
      return;
    }

    setSubmitting(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          travelers: Number(travelers),
          preferredDate: date,
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          notes: notes.trim(),
          userName: user.displayName || user.email?.split("@")[0],
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login", { state: { from: location } });
        return;
      }

      if (result.success) {
        sessionStorage.removeItem(draftKey(bookingId));
        setLastBooking({
          id: result.bookingId,
          total: result.totalAmount ?? total,
          travelers,
          date,
        });
        setExistingBooking({
          _id: result.bookingId,
          status: "pending",
          serviceId: service.id,
        });
        setShowModal(true);
        toast.success("Booking request submitted!");
      } else {
        if (response.status === 409) {
          setExistingBooking({
            _id: result.existingBookingId,
            status: result.status || "pending",
            serviceId: service.id,
          });
        }
        toast.error(result.message || "Failed to submit booking");
      }
    } catch (error) {
      console.error(error);
      if (error.message === "NOT_LOGGED_IN") {
        navigate("/login", { state: { from: location } });
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () =>
    document
      .getElementById("book-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* ─────────── Loading / not found ─────────── */
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#e7dfd0] border-t-[#0b6b62]" />
          <p className="text-[#5a6a7e] text-sm">Loading package…</p>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#f5f0e8] px-6 text-center">
        <div className="text-6xl mb-6">🗺️</div>
        <h1
          className="text-4xl md:text-5xl font-black text-[#0d1f35] mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Package Not Found
        </h1>
        <p className="text-[#5a6a7e] mb-8">
          Sorry, the tour you're looking for is no longer available.
        </p>
        <Link
          to="/services"
          className="px-8 py-4 bg-[#0d1f35] text-white rounded-2xl font-bold hover:bg-[#0b6b62] transition-all"
        >
          Browse All Packages
        </Link>
      </main>
    );
  }

  const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

  const highlights = [
    { icon: <FiStar />, label: "Guest rating", value: "4.9 / 5" },
    { icon: <FiClock />, label: "Duration", value: service.duration || "Flexible" },
    { icon: <FiMapPin />, label: "Location", value: service.location || "Bangladesh" },
    { icon: <FiShield />, label: "Support", value: "24/7 Concierge" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f0e8] pt-[76px] text-[#0d1f35] pb-24 lg:pb-0">
      {/* ───────── Hero ───────── */}
      <section className="relative bg-[#0d1f35] overflow-hidden">
        <img
          src={service.picture}
          alt={service.name}
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-60" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f35] via-[#0d1f35]/60 to-[#0d1f35]/30" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-14 md:pb-20 min-h-[340px] md:min-h-[420px] flex flex-col justify-between">
          <Link
            to="/services"
            className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white hover:gap-3 transition-all"
          >
            <FiArrowLeft /> All packages
          </Link>
          <div className="mt-16">
            <div className="flex flex-wrap gap-2 mb-5">
              {[service.category, service.location, service.duration]
                .filter(Boolean)
                .map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/20"
                  >
                    {i === 0 ? <FiTag size={11} /> : i === 1 ? <FiMapPin size={11} /> : <FiClock size={11} />}
                    {t}
                  </span>
                ))}
            </div>
            <h1
              className="text-4xl md:text-6xl font-black leading-[1.05] text-white max-w-3xl"
              style={serif}
            >
              {service.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <FiStar className="text-[#e8c96a] fill-current" /> 4.9 guest rating
              </span>
              <span>
                From{" "}
                <b className="text-[#e8c96a] text-lg">{service.balance}</b> / person
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-12 items-start">
          {/* ───────── Left column ───────── */}
          <div className="space-y-8 order-2 lg:order-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-24 lg:-mt-28 relative z-10">
              {highlights.map((h) => (
                <div
                  key={h.label}
                  className="bg-white border border-[#e7dfd0] rounded-2xl p-5 text-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="text-[#0b6b62] text-xl mb-2 flex justify-center">
                    {h.icon}
                  </div>
                  <p className="font-black text-[#0d1f35] leading-tight text-sm md:text-base">
                    {h.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-[#5a6a7e] font-bold mt-1">
                    {h.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#e7dfd0] rounded-[28px] p-7 md:p-9 shadow-sm">
              <h2 className="text-3xl font-black mb-4" style={serif}>
                Trip Overview
              </h2>
              <p className="text-[#5a6a7e] leading-relaxed whitespace-pre-line">
                {service.about}
              </p>

              <h3 className="font-black uppercase tracking-widest text-[10px] text-[#0b6b62] mt-9 mb-4">
                What's included
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {inclusions.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f5f0e8]"
                  >
                    <span className="w-7 h-7 rounded-xl bg-[#0b6b62]/10 flex items-center justify-center text-[#0b6b62] shrink-0">
                      <FiCheck size={14} />
                    </span>
                    <span className="text-sm text-[#5a6a7e] font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#e7dfd0] rounded-[28px] p-7 md:p-9 shadow-sm">
              <h2 className="text-3xl font-black mb-6" style={serif}>
                How booking works
              </h2>
              <ol className="relative border-l-2 border-dashed border-[#e7dfd0] ml-4 space-y-7">
                {steps.map((s, i) => (
                  <li key={s.title} className="pl-8 relative">
                    <span className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#0d1f35] text-white text-xs font-black flex items-center justify-center ring-4 ring-white">
                      {i + 1}
                    </span>
                    <p className="font-black text-[#0d1f35]">{s.title}</p>
                    <p className="text-sm text-[#5a6a7e] mt-1">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white border border-[#e7dfd0] rounded-[28px] p-7 md:p-9 shadow-sm">
              <h2 className="text-3xl font-black mb-5" style={serif}>
                Good to know
              </h2>
              <div className="divide-y divide-[#e7dfd0]">
                {faqs.map((f, i) => (
                  <div key={f.q}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 py-4 text-left font-bold text-sm"
                    >
                      {f.q}
                      <FiChevronDown
                        className={`shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openFaq === i && (
                      <p className="pb-4 text-sm text-[#5a6a7e] leading-relaxed">
                        {f.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ───────── Booking card ───────── */}
          <aside
            id="book-form"
            className="order-1 lg:order-2 lg:sticky lg:top-24 scroll-mt-24 lg:-mt-24 relative z-20"
          >
            <div className="bg-white border border-[#e7dfd0] rounded-[28px] shadow-[0_20px_60px_rgba(13,31,53,0.12)] overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#c9a84c] to-[#e8c96a]" />
              <div className="p-7">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#5a6a7e] font-bold">
                      Starting from
                    </p>
                    <p
                      className="text-4xl font-black text-[#e85d45] leading-none mt-1"
                      style={serif}
                    >
                      {service.balance}
                    </p>
                  </div>
                  <span className="text-xs text-[#5a6a7e] font-semibold pb-1">
                    per person
                  </span>
                </div>

                {existingBooking ? (
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-3">
                      <FiCheck />
                    </div>
                    <h3 className="text-xl font-black mb-1">
                      Request already sent
                    </h3>
                    <p className="text-sm text-[#5a6a7e] mb-5">
                      Status:{" "}
                      <b className="capitalize text-amber-700">
                        {existingBooking.status}
                      </b>
                      <br />
                      We'll contact you shortly.
                    </p>
                    <Link
                      to="/my-bookings"
                      className="inline-block px-7 py-3 bg-[#0d1f35] text-white rounded-2xl text-sm font-bold hover:bg-[#0b6b62] transition-all"
                    >
                      View My Bookings
                    </Link>
                  </div>
                ) : (
                  <>
                    {!user && (
                      <div className="mt-5 flex gap-3 items-start bg-[#0b6b62]/8 border border-[#0b6b62]/20 rounded-2xl p-4">
                        <FiLock className="text-[#0b6b62] mt-0.5 shrink-0" />
                        <p className="text-xs text-[#0d1f35]/80 leading-relaxed">
                          Fill in your details freely. You'll be asked to{" "}
                          <b>log in only when you confirm</b> — your answers
                          stay saved.
                        </p>
                      </div>
                    )}

                    <div className="mt-6 space-y-5">
                      <div>
                        <Label icon={<FiCalendar size={12} />}>
                          Preferred travel date
                        </Label>
                        <input
                          type="date"
                          value={date}
                          min={todayLocal()}
                          onChange={(e) => {
                            setDate(e.target.value);
                            setErrors((p) => ({ ...p, date: "" }));
                          }}
                          className={inputCls(errors.date)}
                        />
                        <FieldError msg={errors.date} />
                      </div>

                      <div>
                        <Label icon={<FiUsers size={12} />}>Travelers</Label>
                        <div className="flex items-center bg-[#f5f0e8] rounded-2xl p-1.5 gap-2">
                          <button
                            type="button"
                            aria-label="Decrease travelers"
                            onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                            disabled={travelers <= 1}
                            className="w-11 h-11 flex items-center justify-center rounded-xl text-[#5a6a7e] hover:bg-white active:scale-90 transition disabled:opacity-40"
                          >
                            <FiMinus />
                          </button>
                          <span
                            className="flex-1 text-center text-3xl font-black"
                            style={serif}
                          >
                            {travelers}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase travelers"
                            onClick={() =>
                              setTravelers((t) => Math.min(MAX_TRAVELERS, t + 1))
                            }
                            disabled={travelers >= MAX_TRAVELERS}
                            className="w-11 h-11 flex items-center justify-center rounded-xl text-[#5a6a7e] hover:bg-white active:scale-90 transition disabled:opacity-40"
                          >
                            <FiPlus />
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label icon={<FiPhone size={12} />}>Phone (BD)</Label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phoneNumber}
                          maxLength={11}
                          placeholder="01XXXXXXXXX"
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "");
                            if (v.length <= 11) setPhoneNumber(v);
                            setErrors((p) => ({ ...p, phone: "" }));
                          }}
                          className={inputCls(errors.phone)}
                        />
                        <FieldError msg={errors.phone} />
                      </div>

                      <div>
                        <Label icon={<FiMapPin size={12} />}>Your address</Label>
                        <textarea
                          rows={3}
                          value={address}
                          placeholder="House No, Road No, Area, City"
                          onChange={(e) => {
                            if (countWords(e.target.value) <= MAX_ADDRESS_WORDS)
                              setAddress(e.target.value);
                            setErrors((p) => ({ ...p, address: "" }));
                          }}
                          className={`${inputCls(errors.address)} resize-none`}
                        />
                        <div className="flex justify-between">
                          <FieldError msg={errors.address} />
                          <p className="text-xs text-[#5a6a7e] mt-2 ml-auto">
                            {wordCount}/{MAX_ADDRESS_WORDS} words
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label optional>Special requests</Label>
                        <textarea
                          rows={2}
                          value={notes}
                          maxLength={MAX_NOTES}
                          placeholder="Dietary needs, pickup point, anything else…"
                          onChange={(e) => setNotes(e.target.value)}
                          className={`${inputCls(false)} resize-none`}
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 bg-[#f5f0e8] border border-[#e7dfd0] rounded-2xl p-5 text-sm">
                      <div className="flex justify-between text-[#5a6a7e]">
                        <span>
                          {service.balance} × {travelers}{" "}
                          {travelers > 1 ? "travelers" : "traveler"}
                        </span>
                        <span className="font-bold text-[#0d1f35]">
                          BDT {total.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-dashed border-[#d9cfbb] mt-3 pt-3 flex justify-between items-baseline">
                        <span className="font-black">Total estimate</span>
                        <span className="text-2xl font-black text-[#e85d45]" style={serif}>
                          BDT {total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={confirmBooking}
                      disabled={submitting}
                      className="mt-5 w-full py-4 bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-[#0d1f35] font-black uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-[#c9a84c]/30 active:scale-[0.99] transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1f35]/30 border-t-[#0d1f35]" />
                      )}
                      {submitting
                        ? "Submitting…"
                        : user
                          ? "Confirm Booking Request"
                          : "Log in to Confirm Booking"}
                    </button>
                  </>
                )}

                <ul className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-[#5a6a7e] font-semibold">
                  <li className="flex items-center gap-1.5">
                    <FiCheck className="text-[#0b6b62]" /> No payment now
                  </li>
                  <li className="flex items-center gap-1.5">
                    <FiCheck className="text-[#0b6b62]" /> Reply within 24h
                  </li>
                  <li className="flex items-center gap-1.5">
                    <FiCheck className="text-[#0b6b62]" /> Cancel while pending
                  </li>
                  <li className="flex items-center gap-1.5">
                    <FiCheck className="text-[#0b6b62]" /> Secure login
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        {/* ───────── Related ───────── */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-black mb-6" style={serif}>
              You may also like
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((s) => (
                <Link
                  key={s._id}
                  to={`/booking/${s._id}`}
                  className="group bg-white border border-[#e7dfd0] rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={s.picture}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex items-center justify-between gap-3">
                    <p className="font-black leading-tight line-clamp-2">{s.name}</p>
                    <p className="font-black text-[#e85d45] shrink-0">{s.balance}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ───────── Mobile sticky bar ───────── */}
      {!existingBooking && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#e7dfd0] px-5 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#5a6a7e] font-bold">
              Total estimate
            </p>
            <p className="text-xl font-black text-[#e85d45]">
              BDT {total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={scrollToForm}
            className="px-6 py-3 bg-[#0d1f35] text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            Book now
          </button>
        </div>
      )}

      {showModal && (
        <Modal
          closeModal={() => setShowModal(false)}
          service={service}
          travelers={lastBooking?.travelers ?? travelers}
          date={lastBooking?.date ?? date}
          bookingId={lastBooking?.id}
          total={lastBooking?.total}
        />
      )}
    </main>
  );
};

export default Booking;
