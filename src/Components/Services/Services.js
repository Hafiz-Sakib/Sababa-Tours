// src/Components/Services/Services.js
import { useEffect, useMemo, useRef, useState } from "react";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import ServiceCard from "./ServiceCard";
import BudgetMatch from "./BudgetMatch";
import RequestFlow from "./RequestFlow";
import { API_BASE_URL } from "../../config";
import { fetchRetry } from "../Utilities/apiFetch";

const API = `${API_BASE_URL}/api/services`;

const sortOptions = [
  { value: "default", label: "Recommended" },
  { value: "name", label: "Name" },
  { value: "price-asc", label: "Lowest Price" },
  { value: "price-desc", label: "Highest Price" },
];

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [maxPrice, setMaxPrice] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setFailed(false);
      // Render free tier may take ~50s to wake up
      const wakeTimer = setTimeout(() => {
        toast.loading("Waking up the server, this can take up to a minute. Please wait…", {
          id: "server-wake",
          duration: 60000,
        });
      }, 4000);
      try {
        const res = await fetchRetry(API);

        const result = await res.json();

        const servicesData = Array.isArray(result) ? result : result.data || [];

        setServices(
          servicesData.map((s) => ({
            ...s,
            id: s._id,
            price: parseFloat(String(s.balance).replace(/[^0-9.]/g, "")) || 0,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setServices([]);
        setFailed(true);
      } finally {
        clearTimeout(wakeTimer);
        toast.dismiss("server-wake");
        setLoading(false);
      }
    };

    fetchServices();
  }, [attempt]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  const filtered = useMemo(() => {
    return services
      .filter((s) => maxPrice === null || (s.price > 0 && s.price <= maxPrice))
      .filter((s) =>
        `${s.name || ""} ${s.about || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .sort((a, b) => {
        const pA = parseFloat(String(a.balance).replace(/[^0-9.]/g, "")) || 0;
        const pB = parseFloat(String(b.balance).replace(/[^0-9.]/g, "")) || 0;
        if (sortBy === "price-asc") return pA - pB;
        if (sortBy === "price-desc") return pB - pA;
        if (sortBy === "name")
          return (a.name || "").localeCompare(b.name || "");
        return 0;
      });
  }, [query, services, sortBy, maxPrice]);

  return (
    <main className="min-h-screen bg-sandy pt-[76px] text-ink">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-panel py-24 md:py-32 text-on noise">
        <div className="absolute inset-0 img-zoom">
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=85"
            alt="Travel packages"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-scrim/97 via-scrim/82 to-scrim/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(38,165,158,0.15)_0%,transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <p className="text-accent uppercase tracking-[0.28em] text-[10px] font-bold mb-5 animate-fade-in">
            Travel Packages
          </p>
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6 animate-fade-up"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Curated trips for every
            <br />
            kind of traveler.
          </h1>
          <p className="animate-fade-up delay-200 max-w-xl text-on/70 text-lg leading-relaxed">
            Handcrafted journeys across Bangladesh — from misty hill tracks to
            golden beaches.
          </p>
        </div>
      </section>

      {/* ── Search & sort strip (scrolls with the page; only the navbar is sticky) ── */}
      <section className="relative bg-panel border-y border-line py-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-muted text-sm" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations, hills, beaches, culture..."
                className="w-full border border-line bg-surface pl-12 pr-11 py-4 rounded-2xl focus:border-brand/50 outline-none text-sm placeholder:text-muted/50 transition-all duration-300"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted whitespace-nowrap">
                <FiFilter size={13} /> Sort by
              </span>
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300 active:scale-95 ${
                    sortBy === opt.value
                      ? "bg-btn text-white border-btn shadow-md"
                      : "border-line bg-surface text-muted hover:border-brand/40 hover:text-brand-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs font-bold text-muted">
            <span className="text-brand-ink">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "package" : "packages"} available
          </p>
        </div>
      </section>

      {/* ── Grid ── */}
      <section id="package-grid" className="max-w-7xl mx-auto px-6 py-14 lg:px-10 pb-16">
        {maxPrice !== null && (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-brand/10 px-4 py-2 text-sm font-bold text-brand-ink">Up to ৳{maxPrice.toLocaleString()} per traveler</span>
            <button type="button" onClick={() => setMaxPrice(null)} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-ink">
              <FiX /> Clear budget
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-36 gap-4">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-line border-t-brand" />
            <p className="text-muted text-sm">Loading packages…</p>
          </div>
        ) : failed ? (
          <div className="text-center py-36 bg-surface border border-line rounded-[32px] shadow-sm">
            <div className="text-5xl mb-6">📡</div>
            <p className="text-3xl font-black text-ink mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Could not load packages
            </p>
            <p className="text-muted mb-8">The server may still be waking up. Please try again.</p>
            <button
              onClick={() => setAttempt((n) => n + 1)}
              className="px-8 py-4 bg-btn text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand transition-all duration-300"
            >
              Retry
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div
            ref={gridRef}
            className="grid gap-7 md:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((s, i) => (
              <div key={s.id} style={{ animationDelay: `${i * 0.06}s` }}>
                <ServiceCard service={s} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-36 bg-surface border border-line rounded-[32px] shadow-sm">
            <div className="text-5xl mb-6">🗺️</div>
            <p
              className="text-3xl font-black text-ink mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              No matching packages found
            </p>
            <p className="text-muted mb-8">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => setQuery("")}
              className="px-8 py-4 bg-btn text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand transition-all duration-300"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      {/* ── Budget: Amount slider ── */}
      {!loading && (
        <BudgetMatch
          services={services}
          applied={maxPrice}
          onApply={(v) => {
            setMaxPrice(v);
            setQuery("");
            document.getElementById("package-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      )}

      {/* ── What happens next: Verify flow ── */}
      <RequestFlow />
    </main>
  );
};

export default Services;
