// src/Components/Pages/Guide.js
// Travel guide: a packing checklist per trip type with a progress ring, plus practical tips.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiArrowRight, FiCheck, FiRotateCcw } from "react-icons/fi";
import { guideTips, packing } from "../../data/travel";
import { Aurora, BlurAccordion, BlurText, PillTabs, Reveal, ScrollProgress, motion } from "../ui/Motion";

const serif = { fontFamily: "var(--font-display)" };
const TYPES = [
  { id: "hills", label: "Hills" },
  { id: "lake", label: "Lake" },
  { id: "beach", label: "Beach" },
];

const Ring = ({ pct }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" className="stroke-line" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className="stroke-brand"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-bold tabular-nums">{Math.round(pct)}%</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">packed</p>
        </div>
      </div>
    </div>
  );
};

const Guide = () => {
  const [type, setType] = useState("hills");
  const [done, setDone] = useState({});
  const list = packing[type];
  const checked = list.filter((it) => done[`${type}:${it}`]).length;
  const pct = list.length ? (checked / list.length) * 100 : 0;
  const reset = () =>
    setDone((d) => {
      const n = { ...d };
      list.forEach((it) => delete n[`${type}:${it}`]);
      return n;
    });
  const toggle = (it) => setDone((d) => ({ ...d, [`${type}:${it}`]: !d[`${type}:${it}`] }));
  const msg = useMemo(
    () => (pct === 100 ? "All packed. Have a wonderful trip!" : checked ? `${list.length - checked} left to pack` : "Tick things off as you pack"),
    [pct, checked, list.length],
  );

  return (
    <main className="min-h-screen bg-sandy pt-[76px] text-ink">
      <ScrollProgress />

      <section className="relative overflow-hidden bg-panel py-20 text-on md:py-28">
        <Aurora />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent-lt">Travel guide</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl" style={serif}>
            <BlurText text="Pack light, travel well." />
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-on/75">A checklist for every kind of trip and the small habits that keep it safe and smooth.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 lg:px-10">
        <div className="-mt-20 relative z-10 mb-8">
          <PillTabs id="guide-type" items={TYPES} value={type} onChange={setType} />
        </div>

        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <div className="flex flex-col items-center rounded-[2rem] border border-line bg-surface p-6 text-center shadow-sm">
              <Ring pct={pct} />
              <p className="mt-4 text-sm font-semibold">{msg}</p>
              <button onClick={reset} className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-bold text-muted transition hover:bg-sandy">
                <FiRotateCcw /> Reset
              </button>
            </div>
          </div>

          <ul className="space-y-2.5">
            {list.map((it, i) => {
              const on = !!done[`${type}:${it}`];
              return (
                <motion.li key={`${type}:${it}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <button
                    type="button"
                    onClick={() => toggle(it)}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${on ? "border-brand/40 bg-brand/8" : "border-line bg-surface hover:border-brand/40"}`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1 transition ${on ? "bg-brand text-white ring-brand" : "bg-surface text-transparent ring-line"}`}>
                      <FiCheck size={15} strokeWidth={3} />
                    </span>
                    <span className={`font-medium transition ${on ? "text-muted line-through" : ""}`}>{it}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Good habits</p>
            <h2 className="text-3xl font-black md:text-4xl" style={serif}>Safe, smooth, respectful</h2>
            <p className="mt-4 text-muted">Short, practical notes from our travel desk. Ask us anything specific to your route.</p>
            <div className="mt-8 flex gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-xl" />
              <p className="text-sm">
                <b>In an emergency</b>, call <b>999</b>, the national emergency number in Bangladesh, then tell your Sababa coordinator.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <BlurAccordion items={guideTips} />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-black md:text-4xl" style={serif}>Ready to choose a trip?</h2>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/services" className="inline-flex items-center justify-center gap-2 rounded-full bg-btn px-8 py-4 text-sm font-bold text-white hover:bg-brand">
            Browse packages <FiArrowRight />
          </Link>
          <Link to="/destinations" className="rounded-full border border-deep/20 px-8 py-4 text-sm font-bold hover:bg-surface">Explore destinations</Link>
        </div>
      </section>
    </main>
  );
};

export default Guide;
