// src/Components/Blogs/Blogs.js
// Travel journal: featured story, category tabs, search, expandable articles, FAQ.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCalendar, FiChevronDown, FiClock, FiSearch, FiTag } from "react-icons/fi";
import { articles } from "../../data/travel";
import {
  AnimatePresence,
  AnimatedNumber,
  BlurAccordion,
  BlurText,
  PillTabs,
  Reveal,
  ScrollProgress,
  TiltCard,
  motion,
} from "../ui/Motion";

const faqs = [
  {
    q: "Can Sababa Tours customize a package?",
    a: "Yes. Every listed package can be adjusted for dates, group size, hotel standard, transport style, pace, and special interests.",
  },
  {
    q: "Do I need to pay online to request a booking?",
    a: "No. The booking form creates a request first. Our team confirms availability, itinerary details, and payment steps afterward.",
  },
  {
    q: "Are guides and drivers vetted?",
    a: "Yes. We work with trusted local partners and match guides based on destination, language needs, safety requirements, and trip style.",
  },
  {
    q: "Can you arrange corporate or group travel?",
    a: "Yes. We plan retreats, educational trips, private group tours, and family events with custom logistics and support.",
  },
];

const categories = ["All", ...new Set(articles.map((a) => a.category))];

const Meta = ({ a }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-widest text-muted">
    <span className="flex items-center gap-1.5"><FiTag className="text-lagoon-ink" /> {a.category}</span>
    <span className="flex items-center gap-1.5"><FiCalendar className="text-lagoon-ink" /> {a.date}</span>
    <span className="flex items-center gap-1.5"><FiClock className="text-lagoon-ink" /> {a.read}</span>
  </div>
);

const Body = ({ a, open }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0, filter: "blur(6px)" }}
        animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
        exit={{ height: 0, opacity: 0, filter: "blur(6px)" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="overflow-hidden"
      >
        <div className="space-y-3 pt-4 text-muted leading-relaxed">
          {a.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Toggle = ({ open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={open}
    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-lagoon-ink transition-all hover:gap-3"
  >
    {open ? "Show less" : "Read the notes"}
    <motion.span animate={{ rotate: open ? 180 : 0 }}><FiChevronDown /></motion.span>
  </button>
);

const Blogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openTitle, setOpenTitle] = useState(null);

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
        return matchesSearch && (activeCategory === "All" || a.category === activeCategory);
      }),
    [searchTerm, activeCategory],
  );

  const [featured, ...rest] = filtered;
  const toggle = (t) => setOpenTitle((cur) => (cur === t ? null : t));

  return (
    <main className="min-h-screen bg-page pt-[76px] text-ink">
      <ScrollProgress />

      {/* Hero */}
      <section className="relative overflow-hidden bg-panel2 py-20 md:py-28 text-white">
        <img
          src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&q=85"
          alt="Travel journal"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/70" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <p className="text-[#f4c76b] uppercase tracking-[0.25em] text-sm font-bold">Travel Journal</p>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
            <BlurText text="Useful insight before you pack." />
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            Destination guides, planning advice, and stories from the field by the Sababa travel desk.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:px-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <PillTabs
            id="journal-cats"
            items={categories.map((c) => ({ id: c, label: c }))}
            value={activeCategory}
            onChange={setActiveCategory}
          />
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-line bg-page-alt pl-11 pr-4 py-4 rounded-2xl focus:border-lagoon outline-none"
            />
          </div>
        </div>

        <p className="mb-8 text-sm text-muted">
          <b className="text-ink"><AnimatedNumber value={filtered.length} /></b> {filtered.length === 1 ? "article" : "articles"}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface py-16 text-center">
            <p className="text-lg font-bold">Nothing matches that search.</p>
            <button onClick={() => { setSearchTerm(""); setActiveCategory("All"); }} className="mt-4 rounded-full bg-btn px-6 py-3 text-sm font-bold text-white hover:bg-lagoon">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured */}
            <Reveal>
              <article className="grid overflow-hidden rounded-[2rem] border border-line bg-surface shadow-sm lg:grid-cols-2">
                <div className="relative min-h-[260px] overflow-hidden">
                  <img src={featured.image} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute left-5 top-5 rounded-full bg-[#f4c76b] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-navy">Featured</span>
                </div>
                <div className="p-8 md:p-10">
                  <Meta a={featured} />
                  <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">{featured.title}</h2>
                  <p className="mt-3 text-muted">{featured.excerpt}</p>
                  <Body a={featured} open={openTitle === featured.title} />
                  <Toggle open={openTitle === featured.title} onClick={() => toggle(featured.title)} />
                </div>
              </article>
            </Reveal>

            {/* Rest */}
            {rest.length > 0 && (
              <motion.div layout className="mt-8 grid items-start gap-8 md:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {rest.map((a, i) => (
                    <motion.div key={a.title} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                      <TiltCard max={3} className="rounded-3xl">
                        <article className="overflow-hidden rounded-3xl border border-line bg-surface transition-shadow hover:shadow-xl">
                          <div className="relative h-56 overflow-hidden">
                            <img src={a.image} alt={a.title} className="h-full w-full object-cover" />
                          </div>
                          <div className="p-7">
                            <Meta a={a} />
                            <h3 className="mt-4 text-xl font-black leading-tight">{a.title}</h3>
                            <p className="mt-2 text-muted">{a.excerpt}</p>
                            <Body a={a} open={openTitle === a.title} />
                            <Toggle open={openTitle === a.title} onClick={() => toggle(a.title)} />
                          </div>
                        </article>
                      </TiltCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}

        {/* Guide promo */}
        <Reveal delay={0.05}>
          <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-[2rem] bg-panel2 p-8 text-white md:flex-row md:p-10">
            <div>
              <h3 className="text-2xl font-black">Ready to pack?</h3>
              <p className="mt-1 text-white/65">Use the travel guide's checklist, or see which month suits your destination.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/guide" className="inline-flex items-center gap-2 rounded-full bg-[#f4c76b] px-7 py-3.5 text-sm font-black uppercase tracking-widest text-navy">
                Travel guide <FiArrowRight />
              </Link>
              <Link to="/destinations" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-bold">Destinations</Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ Section */}
      <section className="bg-surface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-lagoon-ink uppercase tracking-widest text-sm font-bold">FAQ</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-black leading-tight">Common questions, clear answers.</h2>
            <p className="mt-6 text-muted text-lg">
              Need something specific? Reach out — we’re happy to help shape your journey.
            </p>
            <Link to="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-lagoon-ink transition-all hover:gap-4">
              Talk to the desk <FiArrowRight />
            </Link>
          </div>
          <BlurAccordion items={faqs} />
        </div>
      </section>
    </main>
  );
};

export default Blogs;
