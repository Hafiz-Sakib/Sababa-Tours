// src/Components/Home/JourneyMap.js
// Interactive route map: tap a pin (or a card) and a route is drawn from Dhaka to that region,
// with a little plane travelling along it. The outline is a simplified, illustrative sketch of Bangladesh.
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiNavigation, FiSun } from "react-icons/fi";
import { destinations, seasonLabel, seasons } from "../../data/travel";
import { AnimatePresence, Reveal, motion, useReducedMotion } from "../ui/Motion";

/* [longitude, latitude] — simplified outline, clockwise from the north-west */
const OUTLINE = [
  [88.08, 26.3], [88.4, 26.62], [88.7, 26.45], [89.0, 26.3], [89.35, 26.1], [89.8, 26.0], [89.85, 25.3],
  [90.4, 25.15], [91.0, 25.15], [91.5, 25.15], [91.9, 25.1], [92.25, 24.9], [92.0, 24.4], [91.85, 24.15],
  [91.55, 23.6], [91.95, 23.2], [92.35, 23.25], [92.45, 22.8], [92.6, 22.2], [92.35, 21.7], [92.3, 20.75],
  [92.1, 21.2], [91.95, 21.45], [91.8, 22.0], [91.8, 22.3], [91.45, 22.8], [91.0, 22.5], [90.9, 22.2],
  [90.5, 22.15], [90.3, 21.85], [89.9, 21.8], [89.6, 21.85], [89.3, 21.9], [89.1, 21.8], [89.0, 22.1],
  [88.85, 22.35], [88.7, 22.55], [88.95, 22.8], [88.9, 23.3], [88.65, 23.6], [88.4, 24.0], [88.15, 24.45],
  [88.05, 24.7], [88.25, 25.2], [88.45, 25.55], [88.1, 25.8],
];

const project = ([lng, lat]) => [(lng - 87.8) * 92, (26.8 - lat) * 100];
const outlinePath = OUTLINE.map((p, i) => `${i ? "L" : "M"}${project(p).map((n) => n.toFixed(1)).join(" ")}`).join(" ") + "Z";

const DHAKA = project([90.41, 23.81]);
const coords = {
  bandarban: [92.22, 22.19],
  rangamati: [92.17, 22.65],
  cox: [91.98, 21.45],
};
/* rough travel times from Dhaka, for orientation only */
const fromDhaka = {
  bandarban: { road: "about 7–8 hrs by road", note: "Via Chattogram, then up into the hills" },
  rangamati: { road: "about 6–7 hrs by road", note: "Via Chattogram, then a scenic hill road" },
  cox: { road: "about 8–10 hrs by road", note: "Or about 1 hr by air" },
};

const routeTo = (key) => {
  const [x, y] = project(coords[key]);
  const [dx, dy] = DHAKA;
  return `M${dx} ${dy} Q${(dx + x) / 2 + 40} ${(dy + y) / 2 - 30} ${x} ${y}`;
};

const JourneyMap = () => {
  const [active, setActive] = useState("bandarban");
  const reduce = useReducedMotion();
  const d = destinations.find((x) => x.key === active);
  const month = new Date().getMonth();
  const score = seasons[active][month];
  const path = routeTo(active);

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <div>
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Find your way</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              From Dhaka to the hills, lakes and sea
            </h2>
            <p className="mt-5 max-w-md text-muted leading-relaxed">
              Tap a pin on the map or pick a region below. We draw the route and show how far, how long and how the season looks right now.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-3">
            {destinations.map((x) => {
              const on = x.key === active;
              return (
                <button
                  key={x.key}
                  type="button"
                  onClick={() => setActive(x.key)}
                  aria-pressed={on}
                  className={`group flex items-center gap-4 rounded-3xl border p-3 text-left transition ${
                    on ? "border-brand bg-brand/10 shadow-card" : "border-line bg-sandy hover:border-brand/50"
                  }`}
                >
                  <img src={x.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold">{x.name}</span>
                    <span className="block truncate text-xs text-muted">{x.tag}</span>
                  </span>
                  <FiArrowRight className={`mr-2 shrink-0 transition ${on ? "translate-x-0 text-brand-ink" : "-translate-x-1 text-muted opacity-0 group-hover:opacity-100"}`} />
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-6 rounded-3xl border border-line bg-sandy p-5"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted"><FiNavigation /> From Dhaka</p>
                  <p className="mt-1 text-sm font-bold">{fromDhaka[active].road}</p>
                  <p className="text-[11px] text-muted">{fromDhaka[active].note}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted"><FiClock /> Trip length</p>
                  <p className="mt-1 text-sm font-bold">{d.duration}</p>
                  <p className="text-[11px] text-muted">{d.bestFor}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted"><FiSun /> This month</p>
                  <p className="mt-1 text-sm font-bold">{seasonLabel[score]}</p>
                  <div className="mt-1.5 flex gap-1" aria-hidden>
                    {[1, 2, 3].map((n) => (
                      <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= score ? "bg-brand" : "bg-line"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted">Travel times are approximate and depend on traffic and season. Our desk plans the transfers for you.</p>
              <Link to="/services" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
                See {d.name} packages <FiArrowRight />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        <Reveal delay={0.1}>
          <div className="relative mx-auto max-w-[460px] overflow-hidden rounded-[2rem] border border-line bg-sandy p-4 shadow-card">
            <svg viewBox="0 0 470 640" role="img" aria-label="Simplified map of Bangladesh with a route from Dhaka" className="h-auto w-full">
              <defs>
                <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" className="fill-line" />
                </pattern>
              </defs>
              <rect width="470" height="640" fill="url(#map-dots)" opacity="0.7" />

              <text x="30" y="590" className="fill-muted" fontSize="13" fontStyle="italic" opacity="0.8">Bay of Bengal</text>
              <text x="150" y="22" className="fill-muted" fontSize="11" letterSpacing="3" opacity="0.5">INDIA</text>
              <text x="395" y="470" className="fill-muted" fontSize="11" letterSpacing="3" opacity="0.5" transform="rotate(90 395 470)">MYANMAR</text>

              <path d={outlinePath} className="fill-brand/15 stroke-brand" strokeWidth="2.5" strokeLinejoin="round" />

              {/* route */}
              <path d={path} fill="none" className="stroke-muted" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" opacity="0.5" />
              <motion.path
                key={`draw-${active}`}
                d={path}
                fill="none"
                className="stroke-accent"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
              {!reduce && (
                <g key={`plane-${active}`}>
                  <circle r="6" className="fill-accent">
                    <animateMotion dur="2.6s" repeatCount="indefinite" path={path} />
                  </circle>
                  <circle r="12" className="fill-accent" opacity="0.2">
                    <animateMotion dur="2.6s" repeatCount="indefinite" path={path} />
                  </circle>
                </g>
              )}

              {/* Dhaka */}
              <g>
                <rect x={DHAKA[0] - 6} y={DHAKA[1] - 6} width="12" height="12" rx="3" className="fill-btn" transform={`rotate(45 ${DHAKA[0]} ${DHAKA[1]})`} />
                <text x={DHAKA[0] - 12} y={DHAKA[1] - 14} textAnchor="end" fontSize="13" fontWeight="700" className="fill-ink" style={{ paintOrder: "stroke", stroke: "rgb(var(--sandy))", strokeWidth: 4 }}>
                  Dhaka
                </text>
              </g>

              {/* region pins */}
              {destinations.map((x) => {
                const [cx, cy] = project(coords[x.key]);
                const on = x.key === active;
                return (
                  <g
                    key={x.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`${x.name} on the map`}
                    aria-pressed={on}
                    onClick={() => setActive(x.key)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setActive(x.key))}
                    className="cursor-pointer outline-none [&:focus-visible_.ring]:stroke-accent [&:focus-visible_.ring]:stroke-2"
                  >
                    <circle cx={cx} cy={cy} r="22" fill="transparent" />
                    {on && !reduce && (
                      <circle cx={cx} cy={cy} r="8" className="fill-brand" opacity="0.4">
                        <animate attributeName="r" values="8;24;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.45;0;0.45" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle className="ring fill-none" cx={cx} cy={cy} r="13" />
                    <circle cx={cx} cy={cy} r={on ? 9 : 7} className={on ? "fill-accent" : "fill-brand"} stroke="white" strokeWidth="2.5" style={{ transition: "r .25s" }} />
                    <text
                      x={cx - 16}
                      y={cy + 4}
                      textAnchor="end"
                      fontSize={on ? 14 : 12}
                      fontWeight={on ? 800 : 600}
                      className="fill-ink"
                      style={{ paintOrder: "stroke", stroke: "rgb(var(--sandy))", strokeWidth: 4 }}
                    >
                      {x.name}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="pb-1 text-center text-[11px] text-muted">Illustrative map, not to scale</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default JourneyMap;
