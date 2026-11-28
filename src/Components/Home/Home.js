// src/Components/Home/Home.js
// Home: a boarding-pass trip planner in the hero, an expanding destination strip,
// live packages from the API with category tabs, a scroll-drawn journey route,
// numbers computed from real data, FAQ, reviews.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCalendar,
  FiClock,
  FiCompass,
  FiHeadphones,
  FiMinus,
  FiPlus,
  FiShield,
  FiSliders,
  FiUsers,
} from "react-icons/fi";
import ServiceCard from "../Services/ServiceCard";
import Showcase from "./Showcase";
import JourneyMap from "./JourneyMap";
import VibeQuiz from "./VibeQuiz";
import ItineraryExplorer from "./ItineraryExplorer";
import PackingChecklist from "./PackingChecklist";
import DepthCarousel from "../ui/brew/DepthCarousel";
import HighlightText from "../ui/brew/HighlightText";
import SeasonPicker from "../ui/SeasonPicker";
import { articles, destinations } from "../../data/travel";
import { API_BASE_URL } from "../../config";
import { fetchRetry } from "../Utilities/apiFetch";
import {
  AnimatedNumber,
  AnimatePresence,
  Aurora,
  BlurAccordion,
  BlurText,
  FlipWords,
  Magnetic,
  PillTabs,
  Reveal,
  RollingNumber,
  Shimmer,
  TiltCard,
  motion,
  useReducedMotion,
} from "../ui/Motion";
import { useScroll, useTransform } from "motion/react";

/* ─────────────────────────── data ─────────────────────────── */
const tripStyles = [
  { name: "Relaxed", pace: "Slow mornings · scenic transfers · premium stays", multiplier: 145 },
  { name: "Adventure", pace: "Guided trails · early starts · local experiences", multiplier: 118 },
  { name: "Luxury", pace: "Private transport · upgraded rooms · concierge", multiplier: 210 },
];

const journey = [
  { title: "Tell us your plan", text: "Share preferred dates, group size and travel mood, or send a request straight from a package." },
  { title: "We shape the itinerary", text: "Our travel desk checks availability and replies within 24 hours with stays, transport and experiences." },
  { title: "Confirm and go", text: "Once confirmed, we handle the details and stay on standby until you are back." },
];

const pillars = [
  { icon: <FiCompass />, title: "Tailored itineraries", text: "Built around your pace, budget, dates and travel style." },
  { icon: <FiShield />, title: "Trusted local experts", text: "Licensed guides, vetted stays and transparent planning." },
  { icon: <FiHeadphones />, title: "Concierge support", text: "Real people on standby from request to return." },
];

const faqs = [
  { q: "How does booking work?", a: "Choose a package, pick your date and traveler details, and send the request. Our team reviews it and confirms with next steps. You can track every request in My Bookings." },
  { q: "Can I customise an itinerary?", a: "Yes. Use the trip planner to shape travelers, days and style, then talk to us. We tailor stays, transport and experiences to your pace and budget." },
  { q: "Can I cancel a request?", a: "Pending requests can be cancelled anytime from My Bookings. Once a trip is confirmed, contact our concierge team and we will help with changes." },
  { q: "Is support available during the trip?", a: "Our concierge team is on standby from confirmation to the day you return, by phone and WhatsApp." },
];

const parsePrice = (b) => parseFloat(String(b ?? "").replace(/[^0-9.]/g, "")) || 0;

/* ─────────────────────────── boarding-pass planner ─────────────────────────── */
const Stepper = ({ label, value, min, max, onChange, icon }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl bg-sandy px-4 py-3">
    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
      {icon}
      {label}
    </span>
    <span className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink ring-1 ring-line transition active:scale-90 disabled:opacity-35"
      >
        <FiMinus />
      </button>
      <RollingNumber value={value} className="min-w-[1.6em] justify-center text-2xl font-bold text-ink" />
      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="grid h-9 w-9 place-items-center rounded-full bg-btn text-white transition active:scale-90 disabled:opacity-35"
      >
        <FiPlus />
      </button>
    </span>
  </div>
);

const BoardingPass = () => {
  const [dest, setDest] = useState(0);
  const [style, setStyle] = useState(0);
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(4);
  const d = destinations[dest];
  const s = tripStyles[style];
  const estimate = travelers * days * s.multiplier * 10;

  return (
    <TiltCard max={3} className="w-full max-w-md rounded-[2rem] bg-surface text-ink shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
      {/* top: destination */}
      <div className="relative overflow-hidden rounded-t-[2rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={d.name}
            src={d.image}
            alt={d.name}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-44 w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/20 to-transparent" />
        <div className="absolute inset-x-6 bottom-4 flex items-end justify-between text-on">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent-lt">Your trip</p>
            <p className="text-2xl font-black leading-tight">{d.name}</p>
          </div>
          <span className="rounded-full bg-on/15 px-3 py-1 text-[11px] font-bold backdrop-blur">{d.duration}</span>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <PillTabs
          id="hero-dest"
          items={destinations.map((x, i) => ({ id: i, label: x.name }))}
          value={dest}
          onChange={setDest}
          className="w-full justify-between"
        />
        <p className="text-xs text-muted">
          <b className="text-ink">Best for {d.bestFor}.</b> {d.highlight}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {tripStyles.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setStyle(i)}
              aria-pressed={style === i}
              className={`rounded-2xl px-2 py-2.5 text-xs font-bold ring-1 transition ${
                style === i ? "bg-brand text-white ring-brand" : "bg-surface text-muted ring-line hover:ring-brand/50"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-[11px] text-muted">{s.pace}</p>

        <Stepper label="Travelers" value={travelers} min={1} max={20} onChange={setTravelers} icon={<FiUsers />} />
        <Stepper label="Days" value={days} min={1} max={14} onChange={setDays} icon={<FiClock />} />
      </div>

      {/* tear line */}
      <div className="relative">
        <span aria-hidden className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-panel" />
        <span aria-hidden className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-panel" />
        <div className="mx-6 border-t-2 border-dashed border-line" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Rough estimate</p>
          <RollingNumber value={estimate} prefix="BDT " className="text-3xl font-bold text-accent" />
          <p className="mt-1 text-[11px] text-muted">Indicative only. Packages show exact prices.</p>
        </div>
        <Link
          to="/services"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-btn px-5 py-3 text-xs font-bold text-white transition hover:bg-brand"
        >
          See packages <FiArrowRight className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </TiltCard>
  );
};

/* ─────────────────────────── destination strip ─────────────────────────── */
const DestinationStrip = () => {
  const [open, setOpen] = useState(0);
  return (
    <div className="flex h-[640px] flex-col gap-3 md:h-[520px] md:flex-row">
      {destinations.map((d, i) => {
        const on = open === i;
        return (
          <motion.button
            key={d.name}
            type="button"
            layout
            onMouseEnter={() => setOpen(i)}
            onFocus={() => setOpen(i)}
            onClick={() => setOpen(i)}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
            className="group relative min-h-0 overflow-hidden rounded-[2rem] text-left outline-none focus-visible:ring-4 focus-visible:ring-accent/60"
            style={{ flex: on ? 4 : 1 }}
            aria-expanded={on}
          >
            <img src={d.image} alt={d.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className={`absolute inset-0 transition-colors duration-500 ${on ? "bg-gradient-to-t from-scrim/90 via-scrim/25 to-transparent" : "bg-scrim/55"}`} />
            <div className="absolute inset-x-6 bottom-6 text-on">
              <p className={`font-black leading-tight ${on ? "text-3xl md:text-4xl" : "text-xl md:[writing-mode:vertical-rl] md:rotate-180"}`}>{d.name}</p>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3, delay: 0.08 }}
                    className="mt-3 max-w-md"
                  >
                    <p className="text-sm text-on/80">{d.tag}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-on/15 px-3 py-1.5 backdrop-blur">{d.bestFor}</span>
                      <span className="rounded-full bg-on/15 px-3 py-1.5 backdrop-blur">{d.duration}</span>
                    </div>
                    <p className="mt-3 text-xs text-accent-lt">{d.highlight}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────── scroll-drawn journey ─────────────────────────── */
const Journey = () => {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const grow = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} className="relative mx-auto max-w-3xl">
      <div aria-hidden className="absolute bottom-6 left-[22px] top-6 w-0.5 rounded-full bg-line" />
      <motion.div
        aria-hidden
        className="absolute bottom-6 left-[22px] top-6 w-0.5 origin-top rounded-full bg-gradient-to-b from-accent to-brand"
        style={{ scaleY: reduce ? 1 : grow }}
      />
      <ol className="space-y-12">
        {journey.map((j, i) => (
          <li key={j.title} className="relative pl-16">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-20% 0px" }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
              className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full bg-btn text-sm font-bold text-white ring-4 ring-surface"
            >
              {i + 1}
            </motion.span>
            <Reveal delay={0.05}>
              <h3 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
                {j.title}
              </h3>
              <p className="mt-2 text-muted leading-relaxed">{j.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
};

/* ─────────────────────────── component ─────────────────────────── */
/* every region's highlight line ("A · B · C") becomes one card; regions alternate so neighbours differ */
const moments = [0, 1, 2].flatMap((j) =>
  destinations
    .map((d) => {
      const t = d.highlight.split("·").map((x) => x.trim())[j];
      return t && { title: t.charAt(0).toUpperCase() + t.slice(1), kicker: d.name, image: d.image, text: d.tag };
    })
    .filter(Boolean),
);

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchRetry(`${API_BASE_URL}/api/services`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data;
        if (!cancelled) setServices((list || []).map((s) => ({ ...s, id: s._id })));
      } catch (error) {
        console.error("Failed to fetch services:", error);
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // everything below is computed from the live packages, nothing is hard-coded
  const categories = useMemo(() => [...new Set(services.map((s) => s.category).filter(Boolean))], [services]);
  const places = useMemo(() => new Set(services.map((s) => s.location).filter(Boolean)).size, [services]);
  const fromPrice = useMemo(() => {
    const prices = services.map((s) => parsePrice(s.balance)).filter(Boolean);
    return prices.length ? Math.min(...prices) : 0;
  }, [services]);
  const shown = services.filter((s) => cat === "all" || s.category === cat).slice(0, 6);
  const tabs = [{ id: "all", label: "All", badge: services.length }, ...categories.map((c) => ({ id: c, label: c }))];

  const liveStats = [
    { label: "Curated packages", node: <AnimatedNumber value={services.length} /> },
    { label: "Places covered", node: <AnimatedNumber value={places} /> },
    { label: "Prices from (BDT)", node: <AnimatedNumber value={fromPrice} /> },
  ];

  return (
    <main className="bg-sandy text-ink overflow-x-hidden">
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-panel pt-24 pb-16">
        <img
          src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=2000&q=90"
          alt="Bangladesh landscape"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-scrim/95 via-scrim/80 to-scrim/60 dark:via-brand/70 dark:to-scrim/90" />
        <Aurora className="opacity-70" />

        <div className="relative z-10 mx-auto grid w-full grid-cols-1 max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <div>
            <p className="mb-7 inline-flex items-center gap-3 text-xs font-bold tracking-[0.28em] text-accent">
              <span className="h-px w-10 bg-accent" /> BANGLADESH · HAND-PLANNED
            </p>
            <h1 className="text-5xl font-black leading-[1.05] text-on md:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
              <BlurText text="Journeys through" />
              <br />
              <span className="text-accent-lt">
                <BlurText text="the green delta." delay={0.3} />
              </span>
            </h1>
            <p className="mt-6 text-2xl font-bold text-on md:text-3xl">
              Discover{" "}
              <FlipWords className="text-accent-lt" words={["sea beaches", "misty hills", "mangrove forests", "living heritage"]} />
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-on/75">
              Hill trails, lake cruises and sunset beaches, planned around your pace by a local travel desk that stays with you all the way.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Magnetic>
                <Link
                  to="/services"
                  className="group flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-cta to-accent-lt px-9 py-4 text-sm font-black uppercase tracking-widest text-deep transition-shadow hover:shadow-xl hover:shadow-accent/30"
                >
                  Explore packages <FiArrowRight className="transition-transform group-hover:translate-x-1.5" />
                </Link>
              </Magnetic>
              <Link
                to="/meet-us#talk"
                className="flex items-center justify-center rounded-full border border-on/30 px-9 py-4 text-sm font-bold uppercase tracking-widest text-on transition hover:bg-on/10"
              >
                Talk to our desk
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <BoardingPass />
          </div>
        </div>
      </section>

      {/* ══════════════════ DESTINATIONS ══════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <Reveal>
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Where we take you</p>
              <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Three landscapes, one desk
              </h2>
            </div>
            <div className="max-w-sm">
              <p className="text-muted">Hover or tap a panel to open it. Each region has its own pace, season and best-fit traveler.</p>
              <Link to="/destinations" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
                Full destination guide <FiArrowRight />
              </Link>
            </div>
          </div>
        </Reveal>
        <DestinationStrip />
      </section>

      {/* ══════════════════ ROUTE MAP (interactive) ══════════════════ */}
      <JourneyMap />

      {/* ══════════════════ BEST TIME TO GO ══════════════════ */}
      <section className="mx-auto max-w-5xl px-6 pb-24 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">When should I go?</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Pick the month, see the best place
            </h2>
            <p className="mt-5 text-muted leading-relaxed">
              Hills, lakes and beaches each have a season when they shine. Choose a month and compare all three at a glance.
            </p>
            <Link to="/guide" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
              Read the travel guide <FiArrowRight />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <SeasonPicker />
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ VIBE QUIZ (interactive) ══════════════════ */}
      <VibeQuiz />

      {/* ══════════════════ LIVE PACKAGES ══════════════════ */}
      <section className="relative overflow-hidden bg-surface py-24">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Featured this season</p>
              <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                Handpicked journeys
              </h2>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest text-brand-ink transition-all hover:gap-4">
              Browse all <FiArrowRight />
            </Link>
          </div>

          {categories.length > 0 && (
            <div className="mb-8">
              <PillTabs id="home-cats" items={tabs} value={cat} onChange={setCat} />
            </div>
          )}

          {loading ? (
            <div className="grid gap-7 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Shimmer key={i} className="h-96 rounded-[28px]" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="rounded-3xl bg-sandy py-16 text-center text-muted">Packages are being prepared. Check back soon, or talk to our desk.</p>
          ) : (
            <motion.div layout className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {shown.map((s) => (
                  <motion.div key={s.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}>
                    <ServiceCard service={s} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════ WHY SABABA (bento) ══════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Why Sababa</p>
          <h2 className="mb-12 max-w-2xl text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            Planned by people, not templates
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="h-full rounded-[2rem] border border-line bg-surface p-8 transition-shadow hover:shadow-xl">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-xl text-brand-ink">{p.icon}</span>
                <h3 className="mt-6 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
          <Reveal className="md:col-span-3" delay={0.1}>
            <div className="relative overflow-hidden rounded-[2rem] bg-panel p-8 text-on md:p-10">
              <Aurora className="opacity-60" />
              <div className="relative grid gap-8 sm:grid-cols-3">
                {liveStats.map((st) => (
                  <div key={st.label}>
                    <p className="text-5xl font-black text-accent-lt" style={{ fontFamily: "var(--font-display)" }}>
                      {st.node}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-on/60">{st.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Showcase services={services} places={places} fromPrice={fromPrice} />

      {/* ══════════════════ HOW WE WORK: Highlight text ══════════════════ */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-10">
        <Reveal>
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Why travelers pick Sababa</p>
        </Reveal>
        <HighlightText
          className="text-3xl font-black leading-[1.35] md:text-5xl md:leading-[1.3]"
          parts={[
            "Every trip is ",
            { mark: "planned by hand" },
            " by a real person on our desk, with ",
            { mark: "vetted local guides and drivers" },
            " matched to the place and your pace, and ",
            { mark: "honest totals" },
            " confirmed before anything moves.",
          ]}
        />
      </section>

      {/* ══════════════════ MOMENTS: Depth carousel ══════════════════ */}
      <section className="relative overflow-hidden bg-sandy py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Built into every plan</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              The moments you will remember
            </h2>
            <p className="mt-5 max-w-md text-muted leading-relaxed">
              A waterfall picnic, a lake cruise, a sunset dinner. These are the highlights our desk builds each region's itinerary around. Swipe, use the arrows, or tap a card behind.
            </p>
            <Link to="/destinations" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
              See each region <FiArrowRight />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <DepthCarousel cards={moments} label="Trip highlights" />
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ JOURNEY ══════════════════ */}
      <section className="bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal>
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">How it works</p>
              <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
                From idea to itinerary
              </h2>
            </div>
          </Reveal>
          <Journey />
        </div>
      </section>

      {/* ══════════════════ SAMPLE ITINERARY + PACKING (interactive) ══════════════════ */}
      <ItineraryExplorer />
      <PackingChecklist />

      {/* ══════════════════ TRAVEL BLOG TEASER ══════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Travel Blog</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Notes from the field
            </h2>
          </Reveal>
          <Link to="/blogs" className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
            All articles <FiArrowRight />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.08}>
              <TiltCard max={4} className="h-full rounded-3xl">
                <Link to="/blogs" className="group block h-full overflow-hidden rounded-3xl border border-line bg-surface transition-shadow hover:shadow-xl">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={a.image} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                      <span className="text-brand-ink">{a.category}</span>
                      <span className="flex items-center gap-1"><FiCalendar /> {a.date}</span>
                    </p>
                    <h3 className="mt-3 text-lg font-bold leading-snug">{a.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-4 text-xs font-bold tracking-[0.28em] text-brand-ink">GOOD TO KNOW</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              <BlurText text="Questions, answered" />
            </h2>
          </div>
          <Reveal>
            <BlurAccordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="relative overflow-hidden bg-brand py-28 text-white">
        <Aurora className="opacity-60" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl">
            <FiSliders />
          </span>
          <h2 className="mb-6 text-4xl font-black tracking-tight md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            Ready for a better-planned trip?
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-lg text-white/75">Tell us your dream destination. Our team will shape the rest.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/meet-us#talk" className="rounded-full bg-surface px-10 py-4 font-black uppercase tracking-widest text-brand-ink transition hover:bg-accent hover:text-deep">
              Start planning
            </Link>
            <Link to="/register" className="rounded-full border-2 border-white/40 px-10 py-4 font-bold uppercase tracking-widest transition hover:border-surface hover:bg-white/10">
              Create account
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Home;
