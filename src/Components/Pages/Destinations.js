// src/Components/Pages/Destinations.js
// Region guide: pick a place, see when to go, what to do, and the live packages that go there.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiCompass, FiMapPin, FiUsers } from "react-icons/fi";
import ServiceCard from "../Services/ServiceCard";
import SeasonPicker from "../ui/SeasonPicker";
import { API_BASE_URL } from "../../config";
import { MONTHS, destinations, matchesRegion, seasonLabel, seasons } from "../../data/travel";
import {
  AnimatePresence,
  Aurora,
  BlurText,
  PillTabs,
  Reveal,
  ScrollProgress,
  Shimmer,
  TiltCard,
  motion,
} from "../ui/Motion";

const serif = { fontFamily: "var(--font-display)" };

const Destinations = () => {
  const [active, setActive] = useState(destinations[0].slug);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/services`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data;
        if (!off) setServices((list || []).map((s) => ({ ...s, id: s._id })));
      } catch {
        if (!off) setServices([]);
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, []);

  const d = destinations.find((x) => x.slug === active);
  const packages = useMemo(() => services.filter((s) => matchesRegion(s, d)), [services, d]);
  const things = d.highlight.split("·").map((t) => t.trim());
  // best months as wrap-around ranges, e.g. Oct–Feb rather than Jan–Dec
  const bestRange = (() => {
    const v = seasons[d.key];
    const runs = [];
    for (let i = 0; i < 12; i++) {
      if (v[i] !== 3 || v[(i + 11) % 12] === 3) continue;
      let j = i;
      while (v[(j + 1) % 12] === 3 && (j + 1) % 12 !== i) j++;
      runs.push(i === j % 12 ? MONTHS[i] : `${MONTHS[i]}–${MONTHS[j % 12]}`);
    }
    return runs.join(", ") || "—";
  })();

  return (
    <main className="min-h-screen bg-sandy pt-[76px] text-ink">
      <ScrollProgress />

      <section className="relative overflow-hidden bg-panel py-20 text-white md:py-28">
        <Aurora />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e8c96a]">Destinations</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl" style={serif}>
            <BlurText text="Pick a landscape, then the right month." />
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75">
            Three regions we know well. See what each is best for, when it shines, and the packages that go there.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="-mt-20 mb-10 relative z-10">
          <PillTabs id="dest-tabs" items={destinations.map((x) => ({ id: x.slug, label: x.name }))} value={active} onChange={setActive} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={d.slug}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <TiltCard max={2.5} className="overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(13,31,53,0.18)]">
              <img src={d.image} alt={d.name} className="h-[360px] w-full object-cover md:h-[460px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h2 className="text-4xl font-black" style={serif}>{d.name}</h2>
                <p className="mt-1 text-white/80">{d.tag}</p>
              </div>
            </TiltCard>

            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  [<FiUsers key="u" />, "Best for", d.bestFor],
                  [<FiClock key="c" />, "Duration", d.duration],
                  [<FiCompass key="g" />, "Best months", bestRange],
                ].map(([icon, k, v]) => (
                  <div key={k} className="rounded-2xl border border-line bg-surface p-4">
                    <span className="text-lagoon-ink">{icon}</span>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted">{k}</p>
                    <p className="text-sm font-bold leading-snug">{v}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-line bg-surface p-6">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-lagoon-ink">Signature moments</h3>
                <ul className="space-y-2.5">
                  {things.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm">
                      <FiMapPin className="mt-0.5 shrink-0 text-[#c9a84c]" /> {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-dashed border-line pt-4 text-sm text-muted">
                  <b className="text-ink">Getting there.</b> {d.getting}
                </p>
              </div>

              <div className="rounded-3xl border border-line bg-surface p-6">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-lagoon-ink">Through the year</h3>
                <div className="flex gap-1">
                  {seasons[d.key].map((v, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div className={`h-10 rounded-lg ${v === 3 ? "bg-lagoon" : v === 2 ? "bg-[#c9a84c]" : "bg-line"}`} title={`${MONTHS[i]}: ${seasonLabel[v]}`} />
                      <span className="mt-1 block text-[10px] font-semibold text-muted">{MONTHS[i][0]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted">
                  {[3, 2, 1].map((v) => (
                    <span key={v} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${v === 3 ? "bg-lagoon" : v === 2 ? "bg-[#c9a84c]" : "bg-line"}`} />
                      {seasonLabel[v]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="text-3xl font-black md:text-4xl" style={serif}>Packages in {d.name}</h2>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-bold text-lagoon-ink transition-all hover:gap-4">
              All packages <FiArrowRight />
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-7 md:grid-cols-3">{[0, 1, 2].map((i) => <Shimmer key={i} className="h-96 rounded-[28px]" />)}</div>
          ) : packages.length ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          ) : (
            <div className="rounded-3xl bg-sandy p-10 text-center">
              <p className="text-muted">No listed package for {d.name} right now. We can still build one for you.</p>
              <Link to="/contact" className="mt-5 inline-block rounded-full bg-btn px-7 py-3 text-sm font-bold text-white hover:bg-lagoon">Ask our desk</Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-lagoon-ink">When should I go?</p>
            <h2 className="text-3xl font-black md:text-4xl" style={serif}>Compare every region by month</h2>
          </div>
          <SeasonPicker />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-[2rem] bg-panel p-8 text-white sm:flex-row">
            <div>
              <h3 className="text-2xl font-black" style={serif}>Know what to pack?</h3>
              <p className="mt-1 text-white/65">Our travel guide has a checklist for hills, lakes and beaches.</p>
            </div>
            <Link to="/guide" className="shrink-0 rounded-full bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] px-8 py-4 text-sm font-black uppercase tracking-widest text-navy">Open the guide</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default Destinations;
