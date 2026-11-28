// src/Components/Home/ItineraryExplorer.js
// A sample 3-day plan per region. Pick a region, step through the days, see morning / afternoon / evening.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiMoon, FiSun, FiSunrise } from "react-icons/fi";
import { destinations } from "../../data/travel";
import { AnimatePresence, PillTabs, Reveal, motion, useReducedMotion } from "../ui/Motion";

const SLOTS = [
  { key: "m", label: "Morning", icon: FiSunrise },
  { key: "a", label: "Afternoon", icon: FiSun },
  { key: "e", label: "Evening", icon: FiMoon },
];

const plans = {
  bandarban: [
    { title: "Arrive and settle", m: "Private road transfer from Chattogram or Dhaka, with a comfortable break on the way.", a: "Check in, meet your hill guide and walk through the route together.", e: "Local dinner and an early night before the sunrise start." },
    { title: "Into the hills", m: "Sunrise at a viewpoint above the clouds, with tea and a warm breakfast.", a: "Guided trail to a waterfall, with a picnic by the water.", e: "Rest, hot tea and stories with local hosts." },
    { title: "A slow exit", m: "An optional short walk or village visit before packing up.", a: "Lunch, then your private transfer onward.", e: "Home with the photos and the tired legs." },
  ],
  rangamati: [
    { title: "Road to the lake", m: "A scenic road journey from Chattogram, with stops built in.", a: "Lakeside check-in and an easy walk to stretch your legs.", e: "Sunset over the water from the shore." },
    { title: "A day on the lake", m: "Kaptai Lake cruise past quiet islands and hill villages.", a: "A local lunch of regional dishes.", e: "A free evening to rest or wander the market." },
    { title: "Craft and culture", m: "Visit an artisan village and watch weaving up close.", a: "A relaxed lunch and time to pick up handmade gifts.", e: "Private transfer back at an easy pace." },
  ],
  cox: [
    { title: "Arrive by the sea", m: "Road or air transfer, timed around your family's pace.", a: "Oceanfront check-in and unhurried beach time.", e: "Sunset dinner by the water." },
    { title: "Island day", m: "Boat out to an island for a day of swimming and sand.", a: "Seafood lunch and shade, with time to explore.", e: "Back to the hotel for a quiet night." },
    { title: "Last walk on the sand", m: "A slow breakfast and a final beach walk.", a: "Optional beachside shopping before checkout.", e: "Transfer home, sunburnt and happy." },
  ],
};

const ItineraryExplorer = () => {
  const [key, setKey] = useState(destinations[0].key);
  const [day, setDay] = useState(0);
  const reduce = useReducedMotion();
  const d = destinations.find((x) => x.key === key);
  const days = plans[key];
  const cur = days[day];

  useEffect(() => setDay(0), [key]);

  return (
    <section className="bg-sandy py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">A taste of the plan</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              What three days could look like
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">Choose a region and step through a sample itinerary. Your real plan is shaped around your dates, group and pace.</p>
            <div className="mt-7 flex justify-center">
              <PillTabs id="itin-dest" items={destinations.map((x) => ({ id: x.key, label: x.name }))} value={key} onChange={setKey} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid overflow-hidden rounded-[2rem] border border-line bg-surface shadow-card md:grid-cols-[0.8fr_1.2fr]">
            {/* left: photo + day stepper */}
            <div className="relative min-h-[320px] overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={key}
                  src={d.image}
                  alt={d.name}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/40 to-deep/10" />
              <div className="relative flex h-full flex-col justify-between p-6 text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Sample itinerary</p>
                  <p className="text-3xl font-black">{d.name}</p>
                </div>
                <ol className="mt-8 space-y-2" aria-label="Days">
                  {days.map((x, i) => {
                    const on = i === day;
                    return (
                      <li key={x.title}>
                        <button
                          type="button"
                          onClick={() => setDay(i)}
                          aria-current={on ? "step" : undefined}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left backdrop-blur transition ${on ? "bg-white/25" : "bg-white/10 hover:bg-white/15"}`}
                        >
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black transition ${on ? "bg-white text-deep" : "bg-white/20"}`}>{i + 1}</span>
                          <span className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/65">Day {i + 1}</span>
                            <span className="block truncate text-sm font-bold">{x.title}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* right: the day */}
            <div className="p-6 sm:p-9">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${key}-${day}`}
                  initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-ink">Day {day + 1} of {days.length}</p>
                  <h3 className="mt-2 text-3xl font-black" style={{ fontFamily: "var(--font-display)" }}>{cur.title}</h3>
                  <ul className="relative mt-8 space-y-6">
                    <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-0.5 bg-line" />
                    {SLOTS.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <motion.li
                          key={s.key}
                          initial={{ opacity: 0, x: reduce ? 0 : -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08 + i * 0.1, duration: 0.35 }}
                          className="relative flex gap-4"
                        >
                          <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-lg text-brand-ink ring-4 ring-surface">
                            <Icon />
                          </span>
                          <div className="pt-0.5">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{s.label}</p>
                            <p className="mt-1 leading-relaxed">{cur[s.key]}</p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>
              </AnimatePresence>

              <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <p className="text-xs text-muted">{d.duration} · {d.bestFor}</p>
                <Link to="/services" className="group inline-flex items-center gap-2 rounded-full bg-btn px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-brand">
                  Plan this trip <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ItineraryExplorer;
