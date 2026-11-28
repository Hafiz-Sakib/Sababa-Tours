// src/Components/Pages/About.js
// The "Our Story" half of the Meet Us page (hero + tab switch live in MeetUs.js).
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiMapPin,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { FlipCard, Reveal, TiltCard } from "../ui/Motion";
import Review from "../Home/Review";
import TotalCalculator from "./TotalCalculator";

const promises = [
  { icon: <FiCheckCircle />, title: "Honest totals", text: "A package total is the price multiplied by travelers. Our desk confirms the final amount with you before anything else." },
  { icon: <FiUsers />, title: "Real people", text: "Every request is reviewed by our travel desk, and we reply within 24 hours." },
  { icon: <FiMapPin />, title: "Local partners", text: "Vetted guides, drivers and stays, matched to your destination and trip style." },
  { icon: <FiClock />, title: "Room to change", text: "Pending requests can be cancelled any time from My Bookings." },
];

const explore = [
  { to: "/destinations", kicker: "Places", title: "Destinations", text: "Compare Bandarban, Rangamati and Cox's Bazar by season and style." },
  { to: "/guide", kicker: "Prepare", title: "Travel guide", text: "A packing checklist and practical tips for every kind of trip." },
  { to: "/services", kicker: "Book", title: "Tour packages", text: "Browse live packages and send a request in a few steps." },
];

const values = [
  "Human travel planning with clear, honest communication",
  "Vetted guides, stays, drivers, and experience partners",
  "Local culture, environmental care, and fair community relationships",
  "Flexible itineraries designed around real traveler needs",
];

const metrics = [
  {
    icon: <FiUsers />,
    value: "12k+",
    label: "Curated Journeys",
    detail:
      "Private holidays, family escapes, group tours, and corporate retreats planned with hands-on support.",
  },
  {
    icon: <FiMapPin />,
    value: "34",
    label: "Partner Destinations",
    detail:
      "Trusted local operators across beaches, hills, rivers, heritage towns, and cultural routes.",
  },
  {
    icon: <FiStar />,
    value: "4.9",
    label: "Average Rating",
    detail:
      "Consistent traveler feedback for communication, reliability, guide quality, and itinerary pacing.",
  },
  {
    icon: <FiClock />,
    value: "24/7",
    label: "Traveler Support",
    detail:
      "On-trip assistance for schedule changes, transfer questions, local coordination, and emergencies.",
  },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const About = () => {
  const [activeMetric, setActiveMetric] = useState(0);
  const philosophyRef = useReveal();
  const metricsRef = useReveal();
  const valuesRef = useReveal();
  const selected = metrics[activeMetric];

  return (
    <>
      {/* ── Philosophy ── */}
      <section className="py-20 md:py-28 bg-surface">
        <div
          ref={philosophyRef}
          className="reveal max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center"
        >
          <div className="relative rounded-[32px] overflow-hidden shadow-2xl img-zoom">
            <img
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=85"
              alt="Travel consultation"
              className="w-full h-[480px] object-cover"
            />
            {/* Floating rating card */}
            <div className="absolute bottom-8 left-8 bg-surface rounded-2xl px-7 py-5 shadow-2xl border border-line">
              <p
                className="text-5xl font-black text-brand-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                4.9
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">
                Guest Rating
              </p>
            </div>
          </div>

          <div>
            <p className="text-brand-ink uppercase tracking-[0.25em] text-[10px] font-bold mb-5">
              Our Philosophy
            </p>
            <h2
              className="text-4xl md:text-5xl font-black leading-tight text-ink mb-8"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Premium travel is not louder.
              <br />
              <em className="text-accent not-italic">It is smoother.</em>
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              Sababa Tours blends deep destination expertise with
              concierge-style planning. We help travelers discover Bangladesh's
              beaches, hills, rivers, and culture through practical, respectful
              itineraries.
            </p>
          </div>
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className="bg-panel py-20 md:py-28 text-on relative overflow-hidden noise">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(38,165,158,0.15)_0%,transparent_55%)]" />
        <div
          ref={metricsRef}
          className="reveal relative max-w-7xl mx-auto px-6 lg:px-10"
        >
          <div className="grid lg:grid-cols-2 gap-14 mb-12">
            <div>
              <p className="text-accent uppercase tracking-[0.25em] text-[10px] font-bold mb-5">
                Agency Metrics
              </p>
              <h2
                className="text-4xl md:text-5xl font-black text-on"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Numbers that reflect real travel care.
              </h2>
              <p className="mt-5 text-on/50 text-sm">
                Select a metric to learn more.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {metrics.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMetric(i)}
                  className={`
                    p-7 rounded-[24px] border text-left transition-all duration-400 about-stat-card
                    ${
                      activeMetric === i
                        ? "border-accent bg-surface text-ink shadow-2xl scale-[1.03]"
                        : "border-on/10 bg-on/4 hover:border-on/25 hover:bg-on/7"
                    }
                  `}
                >
                  <div
                    className={`text-3xl mb-5 ${activeMetric === i ? "text-accent" : "text-accent"}`}
                  >
                    {m.icon}
                  </div>
                  <p
                    className={`text-4xl font-black ${activeMetric === i ? "text-ink" : "text-on"}`}
                    style={{
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {m.value}
                  </p>
                  <p
                    className={`mt-1.5 text-[10px] font-black uppercase tracking-widest ${activeMetric === i ? "text-muted" : "text-on/50"}`}
                  >
                    {m.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div
            className="glass border-on/12 p-10 rounded-[28px] text-on transition-all duration-500"
            key={activeMetric}
            style={{ animation: "fadeIn 0.4s ease both" }}
          >
            <div className="flex items-center gap-6 mb-6">
              <div className="text-5xl text-accent">{selected.icon}</div>
              <div>
                <p className="text-accent text-[10px] uppercase tracking-widest font-bold">
                  {selected.label}
                </p>
                <p
                  className="text-5xl font-black mt-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {selected.value}
                </p>
              </div>
            </div>
            <p className="text-on/65 leading-relaxed">{selected.detail}</p>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-20 md:py-28 bg-surface">
        <div
          ref={valuesRef}
          className="reveal max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-14"
        >
          <div>
            <p className="text-brand-ink uppercase tracking-[0.25em] text-[10px] font-bold mb-5">
              Why Travelers Choose Us
            </p>
            <h2
              className="text-4xl md:text-5xl font-black leading-tight text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Details handled by people who know the ground.
            </h2>
            <Link
              to="/meet-us#talk"
              className="mt-8 inline-flex items-center gap-3 bg-btn text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-deep transition-all duration-300 group btn-glow"
            >
              Speak With Us
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {values.map((v, i) => (
              <div
                key={i}
                className="group flex gap-5 bg-sandy border border-line p-6 rounded-[20px] hover:border-accent/30 hover:bg-line/50 transition-all duration-300 card-premium"
                style={{ transitionDelay: `${i * 0.05}s` }}
              >
                <FiCheckCircle className="text-xl text-brand-ink mt-0.5 shrink-0 group-hover:text-accent transition-colors duration-300" />
                <p className="text-muted leading-relaxed text-sm">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promises (flip cards) ── */}
      <section className="py-20 md:py-28 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Reveal>
            <p className="text-brand-ink uppercase tracking-[0.25em] text-[10px] font-bold mb-5">What you can count on</p>
            <h2 className="text-4xl md:text-5xl font-black mb-12 max-w-2xl" style={{ fontFamily: "var(--font-display)" }}>
              Four promises, in plain words
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {promises.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07}>
                <div className="h-64">
                  <FlipCard
                    front={
                      <div className="flex h-full flex-col justify-between rounded-[2rem] border border-line bg-sandy p-7">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-xl text-brand-ink">{p.icon}</span>
                        <div>
                          <h3 className="text-xl font-bold">{p.title}</h3>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted">Tap to flip</p>
                        </div>
                      </div>
                    }
                    back={
                      <div className="flex h-full flex-col justify-center rounded-[2rem] bg-panel p-7 text-on">
                        <h3 className="text-lg font-bold text-accent-lt">{p.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-on/80">{p.text}</p>
                      </div>
                    }
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Honest totals: Rolling stepper ── */}
      <TotalCalculator />

      {/* ── Traveler reviews (moved here from Home) ── */}
      <Review />

      {/* ── Explore more ── */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid md:grid-cols-3 gap-6">
          {explore.map((e, i) => (
            <Reveal key={e.to} delay={i * 0.08}>
              <TiltCard max={4} className="h-full rounded-3xl">
                <Link to={e.to} className="group flex h-full flex-col justify-between rounded-3xl border border-line bg-surface p-8 transition-shadow hover:shadow-xl">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-ink">{e.kicker}</span>
                    <h3 className="mt-3 text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>{e.title}</h3>
                    <p className="mt-2 text-sm text-muted">{e.text}</p>
                  </div>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all group-hover:gap-4">
                    Open <FiArrowRight />
                  </span>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-panel py-20 text-on relative overflow-hidden noise">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(15,92,70,0.07)_0%,transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-accent/12 border border-accent/20 flex items-center justify-center text-2xl text-accent mb-6">
              <FiGlobe />
            </div>
            <h2
              className="text-4xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Planning a special trip?
            </h2>
            <p className="text-on/55 mt-3 max-w-md">
              Honeymoons, family holidays, private adventures, or corporate
              retreats — we craft them all.
            </p>
          </div>
          <Link
            to="/services"
            className="shrink-0 px-10 py-5 bg-gradient-to-r from-cta to-accent-lt text-deep font-black uppercase tracking-widest rounded-full hover:shadow-xl hover:shadow-accent/25 hover:scale-105 transition-all duration-300 btn-glow whitespace-nowrap"
          >
            Browse Packages
          </Link>
        </div>
      </section>
    </>
  );
};

export default About;
