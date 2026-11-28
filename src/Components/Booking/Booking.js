// src/Components/Booking/Booking.js
// Booking flow (inspired by the Nikah Community Center wizard):
//   Trip -> Date -> Details -> Review & confirm, with a live receipt beside it.
// Server contract is unchanged: POST /api/bookings { serviceId, travelers, preferredDate, phoneNumber, address, notes, userName }.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit2,
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
import TripCalendar from "../ui/TripCalendar";
import {
  AnimatePresence,
  Aurora,
  BlurAccordion,
  BlurText,
  Reveal,
  RollingNumber,
  Shimmer,
  TiltCard,
  motion,
  useReducedMotion,
} from "../ui/Motion";
import { auth } from "../../Firebase.init";
import { API_BASE_URL } from "../../config";
import { authFetch } from "../Utilities/authFetch";

const MAX_TRAVELERS = 20;
const MAX_ADDRESS_WORDS = 30;
const MAX_NOTES = 500;
const PHONE_REGEX = /^(013|014|015|016|017|018|019)\d{8}$/;

const STEPS = [
  { id: "trip", label: "Trip", hint: "Travelers" },
  { id: "date", label: "Date", hint: "Pick a day" },
  { id: "details", label: "Details", hint: "Contact & address" },
  { id: "confirm", label: "Confirm", hint: "Review & send" },
];

const inclusions = [
  "Dedicated trip coordinator",
  "Vetted local guide & driver",
  "Flexible travel date request",
  "Detailed itinerary planning",
  "Safety briefing & support",
  "24/7 on-trip assistance",
];

const howItWorks = [
  { title: "Send your request", text: "Pick a date, add your details and confirm. No payment needed." },
  { title: "We review & call you", text: "Our travel desk checks availability and contacts you within 24 hours." },
  { title: "Confirm & travel", text: "Once confirmed, we plan the itinerary and you enjoy the trip." },
];

const faqs = [
  { q: "Do I have to pay now?", a: "No. Submitting the form only sends a request. Payment steps are shared after we confirm availability." },
  { q: "Can I change or cancel my request?", a: "Yes. You can cancel a pending request any time from My Bookings. For confirmed trips, please contact our team." },
  { q: "Is the total price final?", a: "The total is the package price multiplied by travelers. Our team confirms the final amount with you." },
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
const fmtLong = (d) =>
  d
    ? new Date(`${d}T00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";

const EASE = [0.22, 1, 0.36, 1];
const inputBase =
  "w-full border bg-sandy rounded-2xl px-4 py-3.5 text-base sm:text-sm outline-none transition-all duration-200 focus:bg-surface focus:ring-4 focus:ring-brand/10";
const inputCls = (err) =>
  `${inputBase} ${err ? "border-red-400 focus:border-red-500" : "border-line focus:border-brand/60"}`;

const Label = ({ icon, children, optional }) => (
  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted mb-2.5">
    {icon}
    {children}
    {optional && (
      <span className="normal-case tracking-normal font-medium text-muted/60">(optional)</span>
    )}
  </label>
);

const FieldError = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mt-2"
      >
        <FiAlertCircle size={13} /> {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

const Heading = ({ title, text }) => (
  <div className="mb-4">
    <h3 className="text-lg font-bold text-ink sm:text-xl">{title}</h3>
    {text && <p className="mt-0.5 text-xs text-muted sm:text-sm">{text}</p>}
  </div>
);

/* ───────── Stepper ───────── */
const Stepper = ({ step, onJump }) => (
  <nav aria-label="Booking progress" className="mb-7 sm:mb-9">
    <ol className="flex items-start">
      {STEPS.map((s, i) => {
        const done = i < step;
        const cur = i === step;
        return (
          <li
            key={s.id}
            className="relative flex flex-1 flex-col items-center text-center"
            aria-current={cur ? "step" : undefined}
          >
            {i > 0 && (
              <span
                aria-hidden
                className="absolute right-1/2 top-[17px] h-0.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-line"
              >
                <motion.span
                  className="block h-full origin-left bg-brand"
                  initial={false}
                  animate={{ scaleX: i <= step ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </span>
            )}
            <button
              type="button"
              disabled={!done}
              onClick={() => onJump(i)}
              aria-label={`${done ? "Go back to " : ""}${s.label}`}
              className={`relative z-10 grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ring-4 ring-surface transition-colors disabled:cursor-default ${
                done
                  ? "bg-brand text-white hover:bg-btn"
                  : cur
                    ? "bg-btn text-white"
                    : "bg-sandy text-muted"
              }`}
            >
              {done ? <FiCheck size={16} strokeWidth={3} /> : i + 1}
            </button>
            <span
              className={`mt-2 text-[11px] font-semibold leading-tight sm:text-sm ${
                cur ? "text-ink" : done ? "text-brand-ink" : "text-muted/60"
              }`}
            >
              {s.label}
            </span>
            <span className="mt-0.5 hidden text-xs text-muted/70 md:block">{s.hint}</span>
          </li>
        );
      })}
    </ol>
  </nav>
);

/* ───────── Receipt ───────── */
const Row = ({ k, v }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-sm text-muted">
    <span className="min-w-0">{k}</span>
    <span className="shrink-0 text-right font-medium tabular-nums text-ink">{v}</span>
  </div>
);

const Receipt = ({ service, travelers, date, total, className = "" }) => (
  <div
    className={`relative overflow-hidden rounded-[1.75rem] bg-surface p-5 shadow-[0_20px_60px_rgba(16,24,40,0.12)] ring-1 ring-line sm:p-6 ${className}`}
  >
    <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cta via-accent-lt to-brand" />
    <div className="flex items-center justify-between gap-3 pt-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Your request</p>
      {service.category && (
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-ink">
          {service.category}
        </span>
      )}
    </div>
    <p className="mt-3 line-clamp-2 text-base font-bold leading-snug text-ink">{service.name}</p>
    <div className="mt-3 divide-y divide-dashed divide-line">
      <div className="pb-2">
        <Row k="Location" v={service.location || "Bangladesh"} />
        <Row k="Duration" v={service.duration || "Flexible"} />
        <Row k="Travelers" v={travelers} />
        <Row k="Trip date" v={date ? new Date(`${date}T00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
      </div>
      <div className="pt-2">
        <Row k={`${service.balance} × ${travelers}`} v={`BDT ${total.toLocaleString()}`} />
      </div>
    </div>
    <div className="mt-3 flex items-end justify-between gap-4 border-t border-line pt-4">
      <span className="text-sm font-semibold text-ink">Total estimate</span>
      <RollingNumber value={total} prefix="BDT " className="text-3xl font-bold text-accent" />
    </div>
    <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
      <FiClock size={14} className="mt-0.5 shrink-0" />
      Nothing is charged now. Our team confirms the final amount and next steps within 24 hours.
    </p>
  </div>
);

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

  // Form values survive a trip to the login page (restored from the draft)
  const draft = useMemo(() => loadDraft(bookingId), [bookingId]);
  const [travelers, setTravelers] = useState(Number(draft.travelers) || 1);
  const [date, setDate] = useState(draft.date || "");
  const [phoneNumber, setPhoneNumber] = useState(draft.phoneNumber || "");
  const [address, setAddress] = useState(draft.address || "");
  const [notes, setNotes] = useState(draft.notes || "");
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(() => (draft.step >= 0 && draft.step <= 3 ? draft.step : 0));
  const [dir, setDir] = useState(1);
  const [agree, setAgree] = useState(false);
  const [tried, setTried] = useState(false);
  const [sheet, setSheet] = useState(false);
  const wizardTop = useRef(null);
  const firstRender = useRef(true);
  const reduce = !!useReducedMotion();

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
        JSON.stringify({ date, travelers, phoneNumber, address, notes, step }),
      );
    } catch {
      /* storage unavailable — ignore */
    }
  }, [bookingId, date, travelers, phoneNumber, address, notes, step]);

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
        toast.error("Could not reach the server. It may be waking up, so please wait a few seconds and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepOk = [
    () => travelers >= 1 && travelers <= MAX_TRAVELERS,
    () => !!date && date >= todayLocal(),
    () => PHONE_REGEX.test(phoneNumber) && !!address.trim() && wordCount <= MAX_ADDRESS_WORDS,
    () => agree,
  ];

  const go = (d) => {
    if (d > 0 && !stepOk[step]()) {
      setTried(true);
      setErrors(validate());
      toast.error(step === 3 ? "Please accept the request terms first" : "Please complete the highlighted fields");
      return;
    }
    setTried(false);
    setDir(d);
    setStep((s) => Math.max(0, Math.min(3, s + d)));
  };
  const jump = (i) => {
    if (i < step) {
      setTried(false);
      setDir(-1);
      setStep(i);
    }
  };
  const submit = () => {
    if (!agree) {
      setTried(true);
      toast.error("Please accept the request terms first");
      return;
    }
    const bad = [0, 1, 2].find((i) => !stepOk[i]());
    if (bad !== undefined) {
      setErrors(validate());
      setTried(true);
      setDir(-1);
      setStep(bad);
      toast.error("Please review your details first");
      return;
    }
    confirmBooking();
  };

  // scroll to the top of the wizard when the step changes (not on first paint)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    wizardTop.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─────────── Loading / not found ─────────── */
  if (loading) {
    return (
      <main className="min-h-screen bg-sandy pt-[76px]">
        <Shimmer className="h-[220px] rounded-none" />
        <div className="mx-auto mt-8 grid max-w-7xl gap-6 px-6 lg:grid-cols-[1fr_380px] lg:px-10">
          <Shimmer className="h-96 rounded-3xl" />
          <Shimmer className="h-96 rounded-3xl" />
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-sandy px-6 text-center">
        <div className="text-6xl mb-6">🗺️</div>
        <h1 className="text-4xl md:text-5xl font-black text-ink mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Package Not Found
        </h1>
        <p className="text-muted mb-8">Sorry, the tour you're looking for is no longer available.</p>
        <Link to="/services" className="px-8 py-4 bg-btn text-white rounded-full font-bold hover:bg-brand transition-all">
          Browse All Packages
        </Link>
      </main>
    );
  }

  const serif = { fontFamily: "var(--font-display)" };
  const highlights = [
    { icon: <FiStar />, label: "Guest rating", value: "4.9 / 5" },
    { icon: <FiClock />, label: "Duration", value: service.duration || "Flexible" },
    { icon: <FiMapPin />, label: "Location", value: service.location || "Bangladesh" },
    { icon: <FiShield />, label: "Support", value: "24/7 Concierge" },
  ];
  const slide = {
    enter: (d) => ({ opacity: 0, x: reduce ? 0 : d * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce ? 0 : d * -32 }),
  };
  const pct = ((travelers - 1) / (MAX_TRAVELERS - 1)) * 100;
  const chips = [1, 2, 4, 6, 10, 15, 20];
  const e = tried || Object.keys(errors).length ? errors : {};

  return (
    <main className="min-h-screen bg-sandy pt-[76px] text-ink pb-28 lg:pb-0">
      {/* ───────── Hero ───────── */}
      <section className="relative bg-panel overflow-hidden">
        <img
          src={service.picture}
          alt={service.name}
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-55" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/60 to-scrim/30" />
        <Aurora className="opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-6 pb-14 md:pb-16 min-h-[210px] md:min-h-[240px] flex flex-col justify-between">
          <Link
            to="/services"
            className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-widest text-on/80 hover:text-on hover:gap-3 transition-all"
          >
            <FiArrowLeft /> All packages
          </Link>
          <div className="mt-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {[service.category, service.location, service.duration].filter(Boolean).map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-on/15 backdrop-blur text-on text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-on/20"
                >
                  {i === 0 ? <FiTag size={11} /> : i === 1 ? <FiMapPin size={11} /> : <FiClock size={11} />}
                  {t}
                </span>
              ))}
            </div>
            <h1 className="text-2xl md:text-4xl font-black leading-[1.1] text-on max-w-3xl" style={serif}>
              <BlurText text={service.name} />
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-on/80 text-sm">
              <span className="flex items-center gap-1.5">
                <FiStar className="text-accent-lt fill-current" /> 4.9 guest rating
              </span>
              <span>
                From <b className="text-accent-lt text-lg">{service.balance}</b> / person
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Wizard ───────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-14 md:-mt-16 mb-8 relative z-10">
          {highlights.map((h) => (
            <div key={h.label} className="bg-surface border border-line rounded-2xl p-4 text-center shadow-sm">
              <div className="text-brand-ink text-lg mb-1.5 flex justify-center">{h.icon}</div>
              <p className="font-bold text-ink leading-tight text-sm">{h.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-1">{h.label}</p>
            </div>
          ))}
        </div>

        <div ref={wizardTop} className="scroll-mt-24 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <div className="min-w-0 rounded-[1.75rem] bg-surface p-4 shadow-[0_20px_60px_rgba(16,24,40,0.10)] ring-1 ring-line sm:rounded-[2rem] sm:p-8">
            {existingBooking ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-3">
                  <FiCheck />
                </div>
                <h3 className="text-xl font-black mb-1">Request already sent</h3>
                <p className="text-sm text-muted mb-5">
                  Status: <b className="capitalize text-amber-700">{existingBooking.status}</b>
                  <br />
                  We'll contact you shortly.
                </p>
                <Link to="/my-bookings" className="inline-block px-7 py-3 bg-btn text-white rounded-full text-sm font-bold hover:bg-brand transition-all">
                  View My Bookings
                </Link>
              </div>
            ) : (
              <>
                <Stepper step={step} onJump={jump} />

                <AnimatePresence mode="wait" custom={dir} initial={false}>
                  <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                    {/* STEP 0 — trip */}
                    {step === 0 && (
                      <div className="space-y-7">
                        <div>
                          <Heading title="Your package" text="You can change travelers and date in the next steps." />
                          <TiltCard max={3} className="flex gap-4 overflow-hidden rounded-3xl bg-sandy p-3 ring-1 ring-line">
                            <img src={service.picture} alt={service.name} className="h-16 w-20 shrink-0 rounded-xl object-cover sm:h-20 sm:w-28" />
                            <div className="min-w-0 py-1">
                              <p className="line-clamp-2 font-bold leading-snug text-ink">{service.name}</p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                                <FiMapPin size={12} /> {service.location || "Bangladesh"} · {service.duration || "Flexible"}
                              </p>
                              <p className="mt-2 text-xl font-bold text-accent">
                                {service.balance} <span className="text-xs font-normal text-muted">/ person</span>
                              </p>
                            </div>
                          </TiltCard>
                        </div>

                        <div className="relative overflow-hidden rounded-[1.75rem] bg-surface p-4 ring-1 ring-line sm:p-7">
                          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
                          <div className="relative flex items-center gap-3.5">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand-ink ring-1 ring-brand/15 sm:h-12 sm:w-12">
                              <FiUsers size={22} />
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-base font-bold sm:text-lg">Travelers</h3>
                              <p className="text-xs text-muted sm:text-sm">Up to {MAX_TRAVELERS} per request</p>
                            </div>
                          </div>

                          <div className="relative mt-6 flex flex-col items-center">
                            <div className="flex w-full max-w-md items-center justify-between rounded-full bg-sandy px-2.5 pb-5 pt-2.5 ring-1 ring-line sm:px-3.5 sm:pb-6 sm:pt-3.5">
                              <button
                                type="button"
                                aria-label="Fewer travelers"
                                disabled={travelers <= 1}
                                onClick={() => setTravelers((n) => Math.max(1, n - 1))}
                                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-muted ring-1 ring-line transition hover:text-ink active:scale-90 disabled:opacity-40 sm:h-14 sm:w-14"
                              >
                                <FiMinus size={20} />
                              </button>
                              <p className="min-w-0 flex-1 text-center text-5xl font-bold leading-none tracking-tight sm:text-6xl">
                                <RollingNumber value={travelers} />
                              </p>
                              <button
                                type="button"
                                aria-label="More travelers"
                                disabled={travelers >= MAX_TRAVELERS}
                                onClick={() => setTravelers((n) => Math.min(MAX_TRAVELERS, n + 1))}
                                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-btn text-white transition hover:bg-brand active:scale-90 disabled:opacity-40 sm:h-14 sm:w-14"
                              >
                                <FiPlus size={22} />
                              </button>
                            </div>
                            <span className="relative z-10 -mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand-ink ring-4 ring-surface sm:text-sm">
                              <FiUsers size={15} />
                              <span className="tabular-nums">{travelers}</span> {travelers === 1 ? "traveler" : "travelers"}
                            </span>
                          </div>

                          <div className="relative mt-5">
                            <input
                              type="range"
                              aria-label="Travelers"
                              min={1}
                              max={MAX_TRAVELERS}
                              step={1}
                              value={travelers}
                              onChange={(ev) => setTravelers(+ev.target.value)}
                              className="w-full accent-brand"
                              style={{ background: `linear-gradient(90deg,rgb(var(--brand)) ${pct}%,rgb(var(--line)) ${pct}%)`, height: 6, borderRadius: 99, appearance: "auto" }}
                            />
                            <div className="mt-1 flex justify-between px-0.5 text-xs font-medium tabular-nums text-muted">
                              <span>1</span>
                              <span>{MAX_TRAVELERS}</span>
                            </div>
                          </div>

                          <div className="relative mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Quick traveler counts">
                            {chips.map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setTravelers(n)}
                                aria-pressed={travelers === n}
                                className={`h-9 min-w-[3rem] rounded-full px-4 text-xs font-semibold tabular-nums ring-1 transition active:scale-95 ${
                                  travelers === n
                                    ? "bg-brand/10 text-brand-ink ring-2 ring-brand"
                                    : "bg-surface text-muted ring-line hover:ring-brand/60"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 1 — date */}
                    {step === 1 && (
                      <div className="grid gap-7 md:grid-cols-2 md:gap-8 lg:grid-cols-1 xl:grid-cols-2">
                        <div className="min-w-0">
                          <Heading title="Pick a travel date" text="Your preferred start date. We confirm availability." />
                          <div className="lg:max-w-md xl:max-w-none">
                            <TripCalendar
                              value={date}
                              min={todayLocal()}
                              onChange={(d) => {
                                setDate(d);
                                setErrors((p) => ({ ...p, date: "" }));
                              }}
                            />
                          </div>
                          <FieldError msg={e.date} />
                        </div>
                        <div>
                          <Heading title={date ? fmtLong(date) : "Then review your day"} text={date ? "Your preferred start date." : "Select a date on the calendar."} />
                          <div className="space-y-3">
                            <div className="flex items-center gap-3.5 rounded-2xl bg-sandy p-4 ring-1 ring-line">
                              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface text-brand-ink">
                                <FiCalendar size={20} />
                              </span>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Trip date</p>
                                <p className="font-semibold">{date ? fmtLong(date) : "Not selected yet"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3.5 rounded-2xl bg-sandy p-4 ring-1 ring-line">
                              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface text-brand-ink">
                                <FiClock size={20} />
                              </span>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Duration</p>
                                <p className="font-semibold">{service.duration || "Flexible"}</p>
                              </div>
                            </div>
                            <p className="rounded-2xl bg-amber-50 p-3 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                              Flexible on dates? Pick your best guess. Our desk will suggest alternatives if it is full.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2 — details */}
                    {step === 2 && (
                      <div className="space-y-7">
                        {!user && (
                          <div className="flex gap-3 items-start bg-brand/8 border border-brand/20 rounded-2xl p-4">
                            <FiLock className="text-brand-ink mt-0.5 shrink-0" />
                            <p className="text-xs text-ink/80 leading-relaxed">
                              Fill in your details freely. You'll be asked to <b>log in only when you confirm</b> — your answers stay saved.
                            </p>
                          </div>
                        )}
                        <div>
                          <Heading title="Who should we contact?" text="We call this number to confirm your trip." />
                          <div className="space-y-5">
                            <div>
                              <Label icon={<FiPhone size={12} />}>Phone number</Label>
                              <input
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={phoneNumber}
                                maxLength={11}
                                placeholder="017XXXXXXXX"
                                onChange={(ev) => {
                                  setPhoneNumber(ev.target.value.replace(/\D/g, ""));
                                  setErrors((p) => ({ ...p, phone: "" }));
                                }}
                                className={inputCls(e.phone)}
                              />
                              <FieldError msg={e.phone} />
                            </div>
                            <div>
                              <Label icon={<FiMapPin size={12} />}>Your address</Label>
                              <textarea
                                rows={3}
                                value={address}
                                placeholder="House No, Road No, Area, City"
                                onChange={(ev) => {
                                  if (countWords(ev.target.value) <= MAX_ADDRESS_WORDS) setAddress(ev.target.value);
                                  setErrors((p) => ({ ...p, address: "" }));
                                }}
                                className={`${inputCls(e.address)} resize-none`}
                              />
                              <div className="flex justify-between">
                                <FieldError msg={e.address} />
                                <p className="text-xs text-muted mt-2 ml-auto">{wordCount}/{MAX_ADDRESS_WORDS} words</p>
                              </div>
                            </div>
                            <div>
                              <Label optional>Special requests</Label>
                              <textarea
                                rows={3}
                                value={notes}
                                maxLength={MAX_NOTES}
                                placeholder="Dietary needs, pickup point, anything else…"
                                onChange={(ev) => setNotes(ev.target.value)}
                                className={`${inputCls(false)} resize-none`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 3 — confirm */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <Heading title="Review your request" text="Check everything once. You can still cancel while it is pending." />
                        {[
                          [0, "Trip", service.name, `${travelers} ${travelers === 1 ? "traveler" : "travelers"}`],
                          [1, "Trip date", fmtLong(date), service.duration || ""],
                          [2, "Contact", phoneNumber, address],
                        ].map(([to, k, a, b]) => (
                          <div key={k} className="flex items-start justify-between gap-3 rounded-2xl bg-sandy p-4 ring-1 ring-line">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{k}</p>
                              <p className="mt-0.5 break-words font-semibold">{a}</p>
                              {b && <p className="mt-0.5 break-words text-sm text-muted">{b}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => jump(to)}
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-brand-ink ring-1 ring-brand/30 transition hover:ring-brand"
                            >
                              <FiEdit2 size={14} /> Edit
                            </button>
                          </div>
                        ))}
                        {notes && (
                          <div className="rounded-2xl bg-sandy p-4 ring-1 ring-line">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Special requests</p>
                            <p className="mt-0.5 break-words text-sm">{notes}</p>
                          </div>
                        )}
                        <div className="lg:hidden">
                          <Receipt service={service} travelers={travelers} date={date} total={total} />
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-amber-300">
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-500 text-white">
                            <FiClock size={16} />
                          </span>
                          <p>
                            <b>No payment now.</b> This sends a request only. Our travel desk reviews availability and contacts you within 24 hours.
                          </p>
                        </div>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 ring-1 transition ${
                            agree ? "bg-brand/8 ring-brand" : tried && !agree ? "ring-red-400" : "ring-line"
                          }`}
                        >
                          <input type="checkbox" checked={agree} onChange={(ev) => setAgree(ev.target.checked)} className="peer sr-only" />
                          <span
                            aria-hidden
                            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand ${
                              agree ? "bg-brand text-white ring-brand" : "bg-surface text-transparent ring-line"
                            }`}
                          >
                            <FiCheck size={14} strokeWidth={3} />
                          </span>
                          <span className="text-sm leading-relaxed text-muted">
                            I understand the total estimate is <b className="text-ink">BDT {total.toLocaleString()}</b>, that the final amount is confirmed by the travel desk, and that I can cancel while the request is pending.
                          </span>
                        </label>
                        {!user && (
                          <div className="rounded-2xl bg-brand/8 p-4 text-center ring-1 ring-brand/20">
                            <p className="text-sm font-semibold text-brand-ink">Log in to send your request</p>
                            <p className="mt-1 text-xs text-muted">Your details are saved, you will come right back here.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* nav bar: pinned on phones, a row in the card on larger screens */}
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:z-auto sm:mt-8 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6 sm:backdrop-blur-none">
                  <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Back"
                      className={`inline-flex h-12 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-bold text-ink transition hover:bg-sandy active:scale-95 sm:px-7 ${step === 0 ? "hidden" : ""}`}
                    >
                      <FiArrowLeft /> <span className="hidden sm:inline">Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheet(true)}
                      aria-label="Show request summary"
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-brand/8 px-3 py-2 text-left ring-1 ring-brand/15 sm:mr-auto sm:max-w-[17rem] sm:flex-none lg:pointer-events-none lg:cursor-default"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] text-muted sm:text-xs">Total estimate</span>
                        <RollingNumber value={total} prefix="BDT " className="text-base font-bold text-ink sm:text-xl" />
                      </span>
                    </button>
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={() => go(1)}
                        aria-disabled={!stepOk[step]()}
                        className={`group inline-flex h-12 items-center gap-2 rounded-full bg-btn px-6 text-sm font-bold text-white transition hover:bg-brand active:scale-95 sm:px-8 ${stepOk[step]() ? "" : "opacity-80"}`}
                      >
                        Continue <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cta to-accent-lt px-5 text-sm font-black text-deep transition hover:shadow-lg hover:shadow-accent/30 active:scale-95 disabled:opacity-60 sm:px-8"
                      >
                        {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-deep/30 border-t-deep" />}
                        {submitting ? "Submitting…" : user ? "Confirm request" : "Log in to confirm"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <Receipt service={service} travelers={travelers} date={date} total={total} />
              <ul className="grid grid-cols-2 gap-2 px-2 text-[11px] font-semibold text-muted">
                {["No payment now", "Reply within 24h", "Cancel while pending", "Secure login"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <FiCheck className="text-brand-ink" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* ───────── Overview ───────── */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full bg-surface border border-line rounded-[28px] p-7 md:p-9 shadow-sm">
              <h2 className="text-3xl font-black mb-4" style={serif}>Trip Overview</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line">{service.about}</p>
              <h3 className="font-black uppercase tracking-widest text-[10px] text-brand-ink mt-9 mb-4">What's included</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {inclusions.map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3.5 rounded-2xl bg-sandy">
                    <span className="w-7 h-7 rounded-xl bg-brand/10 flex items-center justify-center text-brand-ink shrink-0">
                      <FiCheck size={14} />
                    </span>
                    <span className="text-sm text-muted font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="space-y-8">
            <Reveal delay={0.08}>
              <div className="bg-surface border border-line rounded-[28px] p-7 md:p-9 shadow-sm">
                <h2 className="text-2xl font-black mb-5" style={serif}>How it works</h2>
                <ol className="space-y-4">
                  {howItWorks.map((s, i) => (
                    <li key={s.title} className="flex gap-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-btn text-sm font-bold text-white">{i + 1}</span>
                      <div>
                        <p className="font-bold">{s.title}</p>
                        <p className="text-sm text-muted">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <BlurAccordion items={faqs} />
            </Reveal>
          </div>
        </div>

        {/* ───────── Related ───────── */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-black mb-6" style={serif}>You may also like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((s) => (
                <TiltCard key={s._id} max={4} className="rounded-3xl">
                  <Link
                    to={`/booking/${s._id}`}
                    className="group block bg-surface border border-line rounded-3xl overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-[16/8] overflow-hidden">
                      <img src={s.picture} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex items-center justify-between gap-3">
                      <p className="font-bold leading-tight line-clamp-2">{s.name}</p>
                      <p className="font-bold text-accent shrink-0">{s.balance}</p>
                    </div>
                  </Link>
                </TiltCard>
              ))}
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} className="absolute inset-0 bg-scrim/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative w-full max-w-sm"
            >
              <Receipt service={service} travelers={travelers} date={date} total={total} />
              <button onClick={() => setSheet(false)} className="mt-3 w-full rounded-full bg-surface py-3 text-sm font-bold text-ink">
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
