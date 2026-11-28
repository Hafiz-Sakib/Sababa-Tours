// src/Components/Home/Showcase.js
// Home showcase built from Motion Brew cards (https://motion-brew.com, MIT):
//   Tilt card · Rolling card stack · Score card · Orbit card
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiGlobe, FiMapPin, FiPackage, FiTag } from "react-icons/fi";
import { articles, destinations } from "../../data/travel";
import { Reveal } from "../ui/Motion";
import GlareTiltCard from "../ui/brew/GlareTiltCard";
import RollingCardStack from "../ui/brew/RollingCardStack";
import ScoreCard from "../ui/brew/ScoreCard";
import OrbitCard from "../ui/brew/OrbitCard";
import logoMark from "../../assets/logo/logo-mark.png";
import { reviews, averageRating } from "./Review";

const Heading = ({ kicker, title, text }) => (
  <Reveal>
    <div className="mb-12 max-w-2xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">{kicker}</p>
      <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
      {text && <p className="mt-4 text-muted">{text}</p>}
    </div>
  </Reveal>
);

/* ratings grouped by kind of traveller, taken from the real review list */
const ratingBars = () => {
  const by = {};
  reviews.forEach((r) => {
    (by[r.group] = by[r.group] || []).push(r.rating);
  });
  return Object.entries(by).map(([label, list]) => ({
    label,
    value: Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(1)),
    max: 5,
  }));
};

const Showcase = ({ services = [], places = 0, fromPrice = 0 }) => {
  // everything is real data: static guide content plus the live packages when they have loaded
  const stack = [
    { title: "Regions in our guide", value: destinations.length, progress: Math.min(1, destinations.length / 6), color: "#26A59E", icon: FiGlobe, caption: "Hand-planned destinations" },
    { title: "Blog stories", value: articles.length, progress: Math.min(1, articles.length / 12), color: "#E2A33B", icon: FiTag, caption: "Travel notes from our desk" },
  ];
  if (services.length) {
    stack.unshift(
      { title: "Curated packages", value: services.length, progress: Math.min(1, services.length / 20), color: "#0F5C46", icon: FiPackage, caption: "Live from our package list" },
      { title: "Places covered", value: places, progress: Math.min(1, places / 12), color: "#3B9EEA", icon: FiMapPin, caption: "Across Bangladesh" },
    );
    if (fromPrice) stack.push({ title: "Packages from (BDT)", value: fromPrice, prefix: "৳", progress: 0.35, color: "#E0607E", icon: FiTag, caption: "Lowest live package price" });
  }

  const members = reviews.slice(0, 6).map((r) => ({ name: r.name.split(" ")[0], role: r.role, avatar: r.avatar }));

  return (
    <>
      {/* ══════════ Signature journeys: Tilt card ══════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <Heading
          kicker="Signature journeys"
          title="Pick a landscape, we plan the rest"
          text="Each region has its own pace and season. Move your cursor over a card to tilt it."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {destinations.slice(0, 3).map((d, i) => (
            <Reveal key={d.slug} delay={i * 0.08} className="h-full">
              <GlareTiltCard className="border border-line bg-surface shadow-card" glareOpacity={0.35}>
                <Link to="/destinations" className="group flex h-full flex-col">
                  <div className="relative h-56 overflow-hidden">
                    <img src={d.image} alt={d.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-bold text-ink shadow-sm backdrop-blur">
                      <FiClock className="text-brand-ink" /> {d.duration}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-ink">{d.bestFor}</p>
                    <h3 className="mt-2 text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
                      {d.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted">{d.tag}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-brand-ink transition-all group-hover:gap-4">
                      Explore {d.name} <FiArrowRight />
                    </span>
                  </div>
                </Link>
              </GlareTiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════ Sababa in numbers: Rolling stack · Score card · Orbit card ══════════ */}
      <section className="relative overflow-hidden bg-sandy py-24">
        <div aria-hidden className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <Heading
            kicker="Sababa in motion"
            title="Numbers, ratings and a growing community"
            text="Live package figures, what travelers say about us, and the people who plan their trips with the Sababa desk."
          />
          <div className="grid items-start justify-items-center gap-10 md:grid-cols-2 lg:grid-cols-3">
            <Reveal className="w-full pt-10">
              <div className="flex justify-center">
                <RollingCardStack cards={stack} interval={3800} label="Sababa in numbers" />
              </div>
            </Reveal>
            <Reveal delay={0.1} className="w-full">
              <div className="flex justify-center">
                <ScoreCard
                  title="Traveler satisfaction"
                  avatar={logoMark}
                  bars={ratingBars()}
                  overall={(averageRating / 5) * 100}
                  overallLabel={`From ${reviews.length} traveler reviews`}
                  focusSuffix=" travelers"
                />
              </div>
            </Reveal>
            <Reveal delay={0.2} className="w-full md:col-span-2 lg:col-span-1">
              <div className="flex justify-center">
                <OrbitCard
                  label="Travel with people who care"
                  subtitle="Families, friends and solo explorers plan their Bangladesh trips with our desk. Hover the rings, or drag to spin them."
                  cta="Start planning"
                  href="/meet-us#talk"
                  linkAs={Link}
                  members={members}
                  logo={<img src={logoMark} alt="" data-keep draggable="false" className="h-9 w-auto" />}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default Showcase;
