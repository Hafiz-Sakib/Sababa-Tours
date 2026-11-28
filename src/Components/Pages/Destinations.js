// src/Components/Pages/Destinations.js
// Destinations built from the REAL packages in the database: pick a region or country, set a budget,
// search, sort, and see the live packages that go there. Nothing here is hard-coded per place.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiGlobe, FiMapPin, FiRefreshCw, FiSearch, FiTag, FiX } from "react-icons/fi";
import ServiceCard from "../Services/ServiceCard";
import TripIndex from "../ui/brew/TripIndex";
import ContactCard from "../ui/brew/ContactCard";
import { API_BASE_URL, DESK_EMAIL } from "../../config";
import { fixImageUrl, imgProps } from "../Utilities/image";
import {
  AnimatePresence,
  AnimatedNumber,
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

/* a package location reads "Paris, France": the last part is the country */
const REGION_OF = {
  France: "Europe", Italy: "Europe", Greece: "Europe", UK: "Europe", Spain: "Europe", Switzerland: "Europe",
  Germany: "Europe", Czechia: "Europe", Netherlands: "Europe",
  India: "Asia", China: "Asia", Maldives: "Asia", Cambodia: "Asia", Japan: "Asia", Indonesia: "Asia",
  Singapore: "Asia", Malaysia: "Asia", Thailand: "Asia", Vietnam: "Asia", "Hong Kong": "Asia",
  "South Korea": "Asia", Nepal: "Asia", Bhutan: "Asia", Bangladesh: "Asia",
  UAE: "Middle East", Jordan: "Middle East", Turkey: "Middle East", "Saudi Arabia": "Middle East",
  Egypt: "Africa", "South Africa": "Africa", Tanzania: "Africa", "Zambia & Zimbabwe": "Africa",
  USA: "North America", Canada: "North America", Mexico: "North America",
  Peru: "South America", Brazil: "South America", "Argentina & Brazil": "South America",
  Australia: "Oceania", "French Polynesia": "Oceania",
};
const REGION_ORDER = ["Asia", "Europe", "Middle East", "Africa", "North America", "South America", "Oceania", "Other"];

const priceOf = (b) => parseFloat(String(b ?? "").replace(/[^0-9.]/g, "")) || 0;
const daysOf = (d) => parseInt(String(d || "").match(/\d+/)?.[0], 10) || 0;
const countryOf = (loc) => String(loc || "").split(",").pop().trim() || "Other";
const bdt = (n) => `BDT ${Math.round(n).toLocaleString("en-IN")}`;
const SORTS = {
  newest: { label: "Newest first", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a, b) => b.price - a.price },
  "days-asc": { label: "Shortest trip first", fn: (a, b) => a.days - b.days || a.price - b.price },
};

const Destinations = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [region, setRegion] = useState("all");
  const [country, setCountry] = useState(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [budget, setBudget] = useState(null); // null = no limit
  const [spot, setSpot] = useState(0);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/services`);
      if (!res.ok) throw new Error("services");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data;
      setServices(
        (list || []).map((s) => {
          const c = countryOf(s.location);
          return { ...s, id: s._id, country: c, region: REGION_OF[c] || "Other", price: priceOf(s.balance), days: daysOf(s.duration) };
        }),
      );
    } catch {
      setServices([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ───── numbers from the real data ───── */
  const regions = useMemo(() => {
    const counts = {};
    services.forEach((s) => (counts[s.region] = (counts[s.region] || 0) + 1));
    return REGION_ORDER.filter((r) => counts[r]).map((r) => ({ name: r, count: counts[r] }));
  }, [services]);
  const maxPrice = useMemo(() => Math.max(10000, Math.ceil(Math.max(0, ...services.map((s) => s.price)) / 10000) * 10000), [services]);
  const minPrice = useMemo(() => Math.min(...services.filter((s) => s.price > 0).map((s) => s.price), Infinity), [services]);
  const limit = budget ?? maxPrice;
  const countryCount = useMemo(() => new Set(services.map((s) => s.country)).size, [services]);

  /* countries shown as chips: those of the chosen region, with their package counts */
  const countries = useMemo(() => {
    const counts = {};
    services.filter((s) => region === "all" || s.region === region).forEach((s) => (counts[s.country] = (counts[s.country] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [services, region]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return services
      .filter(
        (s) =>
          (region === "all" || s.region === region) &&
          (!country || s.country === country) &&
          s.price <= limit &&
          (!t || `${s.name} ${s.location} ${s.category} ${s.about}`.toLowerCase().includes(t)),
      )
      .sort(SORTS[sort].fn);
  }, [services, region, country, q, limit, sort]);

  // the spotlight follows the list: reset when the filter changes
  useEffect(() => setSpot(0), [region, country, q, limit, sort]);
  const picks = filtered.slice(0, 4);
  const hero = picks[Math.min(spot, picks.length - 1)];
  const stayDays = useMemo(() => {
    const d = filtered.map((s) => s.days).filter(Boolean).sort((a, b) => a - b);
    return d.length ? d[Math.floor(d.length / 2)] : 0;
  }, [filtered]);
  const cheapest = filtered.length ? Math.min(...filtered.map((s) => s.price)) : 0;

  const byDays = useMemo(() => [...filtered].sort((a, b) => a.days - b.days || a.price - b.price).slice(0, 8), [filtered]);
  const dirty = region !== "all" || country || q || budget !== null || sort !== "newest";
  const reset = () => {
    setRegion("all");
    setCountry(null);
    setQ("");
    setSort("newest");
    setBudget(null);
  };
  const jumpToGrid = () => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="min-h-screen bg-sandy pt-[76px] text-ink">
      <ScrollProgress />

      {/* ── Hero with live numbers ── */}
      <section className="relative overflow-hidden bg-panel py-20 text-on md:py-28">
        <Aurora />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent-lt">Destinations</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl" style={serif}>
            <BlurText text="Pick a place, set a budget, go." />
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-on/75">
            Every destination here is a real package you can book today. Filter by region, country, price or length of stay.
          </p>
          <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Packages", services.length, ""],
              ["Countries", countryCount, ""],
              ["Regions", regions.length, ""],
              ["From", Number.isFinite(minPrice) ? minPrice : 0, "BDT "],
            ].map(([l, n, p]) => (
              <div key={l} className="rounded-3xl border border-on/10 bg-white/[0.07] p-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-widest text-on/50">{l}</p>
                <p className="mt-1 text-xl font-black md:text-2xl" style={serif}>
                  <AnimatedNumber value={n} prefix={p} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <section id="region" className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="relative z-10 -mt-20 mb-8">
          <PillTabs
            id="dest-regions"
            items={[{ id: "all", label: "All regions", badge: services.length }, ...regions.map((r) => ({ id: r.name, label: r.name, badge: r.count }))]}
            value={region}
            onChange={(v) => {
              setRegion(v);
              setCountry(null);
            }}
          />
        </div>

        <div className="grid gap-4 rounded-3xl border border-line bg-surface p-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-muted">Search</span>
            <span className="relative block">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Paris, safari, island, temple…"
                className="w-full rounded-2xl border border-line bg-page-alt py-3 pl-11 pr-4 text-sm outline-none focus:border-brand"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted">
              <span>Budget per person</span>
              <span className="text-brand-ink">{budget === null ? "Any" : `up to ${bdt(limit)}`}</span>
            </span>
            <input
              type="range"
              min={10000}
              max={maxPrice}
              step={10000}
              value={limit}
              onChange={(e) => setBudget(Number(e.target.value) >= maxPrice ? null : Number(e.target.value))}
              className="h-11 w-full accent-[rgb(var(--brand))]"
              aria-label="Maximum price per person"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-muted">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-2xl border border-line bg-page-alt px-4 py-3 text-sm font-semibold outline-none focus:border-brand"
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={reset}
            disabled={!dirty}
            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-line px-5 text-sm font-bold text-muted transition hover:bg-sandy disabled:opacity-40"
          >
            <FiX /> Reset
          </button>
        </div>

        {/* country chips */}
        {countries.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {countries.map(([c, n]) => (
              <button
                key={c}
                type="button"
                onClick={() => setCountry((cur) => (cur === c ? null : c))}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  country === c ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink hover:border-brand/50"
                }`}
              >
                {c}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${country === c ? "bg-white/25" : "bg-line text-muted"}`}>{n}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Spotlight: hover a pick to change the picture ── */}
        {!loading && hero && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <TiltCard max={2.5} className="overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(16,24,40,0.18)]">
              <div className="relative h-[340px] md:h-[440px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.img
                    key={hero.id}
                    {...imgProps(hero.picture)}
                    alt={hero.name}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-transparent to-scrim/20" />
                <span className="absolute left-5 top-5 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-black text-ink backdrop-blur">
                  {hero.category}
                </span>
                <div className="absolute inset-x-6 bottom-6 text-on">
                  <h2 className="text-3xl font-black md:text-4xl" style={serif}>{hero.name}</h2>
                  <p className="mt-1 flex items-center gap-2 text-on/80">
                    <FiMapPin /> {hero.location}
                  </p>
                </div>
              </div>
            </TiltCard>

            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  [<FiGlobe key="g" />, country || (region === "all" ? "Worldwide" : region), `${filtered.length} package${filtered.length === 1 ? "" : "s"}`],
                  [<FiTag key="t" />, "Starting at", bdt(cheapest)],
                  [<FiClock key="c" />, "Typical stay", stayDays ? `${stayDays} days` : "Flexible"],
                ].map(([icon, k, v]) => (
                  <div key={k} className="rounded-2xl border border-line bg-surface p-4">
                    <span className="text-brand-ink">{icon}</span>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted">{k}</p>
                    <p className="text-sm font-bold leading-snug">{v}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-line bg-surface p-6">
                <h3 className="mb-1 text-xs font-black uppercase tracking-widest text-brand-ink">Top picks in this view</h3>
                <p className="mb-4 text-xs text-muted">Hover a pick to see it on the left, press it to open the package.</p>
                <ul className="space-y-2">
                  {picks.map((s, i) => (
                    <li key={s.id}>
                      <Link
                        to={`/booking/${s.id}`}
                        onMouseEnter={() => setSpot(i)}
                        onFocus={() => setSpot(i)}
                        className={`group flex items-center gap-3 rounded-2xl border p-2.5 transition ${
                          i === spot ? "border-brand bg-brand-soft/50" : "border-transparent hover:bg-page-alt"
                        }`}
                      >
                        <img {...imgProps(s.picture)} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black">{s.name}</span>
                          <span className="block truncate text-xs text-muted">{s.location} · {s.duration}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-black text-accent">{bdt(s.price)}</span>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">per person</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-dashed border-line pt-4 text-sm text-muted">{hero.about}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── All matching packages ── */}
      <section id="packages" className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="text-3xl font-black md:text-4xl" style={serif}>
              {country ? `Packages in ${country}` : region !== "all" ? `Packages in ${region}` : "All packages"}
              {!loading && <span className="ml-3 text-lg font-bold text-muted">({filtered.length})</span>}
            </h2>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
              Open the full list <FiArrowRight />
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-7 md:grid-cols-3">{[0, 1, 2].map((i) => <Shimmer key={i} className="h-96 rounded-[28px]" />)}</div>
          ) : failed ? (
            <div className="rounded-3xl bg-sandy p-10 text-center">
              <p className="text-muted">We could not load the packages. The server may be waking up, please try again in a few seconds.</p>
              <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-full bg-btn px-7 py-3 text-sm font-bold text-white hover:bg-brand">
                <FiRefreshCw /> Try again
              </button>
            </div>
          ) : filtered.length ? (
            <motion.div layout className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((s) => (
                  <motion.div key={s.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
                    <ServiceCard service={s} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-3xl bg-sandy p-10 text-center">
              <p className="text-muted">No package matches these filters. Widen the budget, or we can build one for you.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button onClick={reset} className="rounded-full border border-line px-7 py-3 text-sm font-bold hover:bg-surface">Reset filters</button>
                <Link to="/meet-us#talk" className="rounded-full bg-btn px-7 py-3 text-sm font-bold text-white hover:bg-brand">Ask our desk</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Choose by days: Trip index (real packages) ── */}
      {byDays.length > 1 && (
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">How long do you have?</p>
              <h2 className="text-3xl font-black md:text-4xl" style={serif}>Start from the days you can spare</h2>
              <p className="mt-3 text-muted">Packages from your current filters, sorted from the shortest trip to the longest. Hover one for its picture, press it to open it.</p>
            </div>
          </Reveal>
          <TripIndex
            key={byDays.map((s) => s.id).join("-")}
            items={byDays.map((s) => ({
              title: s.name,
              meta: `${s.duration} · ${s.location} · ${bdt(s.price)}`,
              image: fixImageUrl(s.picture),
              caption: s.category,
              to: `/booking/${s.id}`,
            }))}
            onSelect={jumpToGrid}
          />
        </section>
      )}

      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-5 rounded-[2rem] bg-panel p-8 text-on sm:flex-row">
            <div>
              <h3 className="text-2xl font-black" style={serif}>Know what to pack?</h3>
              <p className="mt-1 text-on/65">Our travel guide has checklists and planning tips for every kind of trip.</p>
            </div>
            <Link to="/guide" className="shrink-0 rounded-full bg-gradient-to-r from-cta to-accent-lt px-8 py-4 text-sm font-black uppercase tracking-widest text-deep">Open the guide</Link>
          </div>
        </Reveal>
      </section>

      <section className="bg-surface px-6 py-20 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-black md:text-4xl" style={serif}>Torn between two places?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Tell us your dates, budget and who is travelling, and our desk will suggest one. <ContactCard label="Ask the travel desk" email={DESK_EMAIL} title="Travel desk" note="Tell us your month, budget and group size." />
          </p>
        </Reveal>
      </section>
    </main>
  );
};

export default Destinations;
