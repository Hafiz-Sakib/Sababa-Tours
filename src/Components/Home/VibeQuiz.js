// src/Components/Home/VibeQuiz.js
// "Find your region" quiz: four quick taps, then a ranked match across all three regions.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAnchor, FiArrowLeft, FiArrowRight, FiCloudRain, FiCoffee, FiHeart, FiMusic, FiRefreshCw,
  FiSunrise, FiSunset, FiTrendingUp, FiUser, FiUsers, FiWind, FiClock, FiCalendar,
} from "react-icons/fi";
import { destinations } from "../../data/travel";
import { AnimatePresence, Aurora, Reveal, motion, useReducedMotion } from "../ui/Motion";

const questions = [
  {
    q: "What does your perfect morning look like?",
    options: [
      { label: "Sunrise above the clouds", icon: FiSunrise, s: { bandarban: 2 } },
      { label: "A slow boat on calm water", icon: FiAnchor, s: { rangamati: 2 } },
      { label: "Coffee and a long beach walk", icon: FiCoffee, s: { cox: 2 } },
    ],
  },
  {
    q: "Who is coming along?",
    options: [
      { label: "Friends who love a challenge", icon: FiUsers, s: { bandarban: 2, rangamati: 1 } },
      { label: "Just the two of us", icon: FiHeart, s: { rangamati: 2, cox: 1 } },
      { label: "The whole family", icon: FiUser, s: { cox: 2, rangamati: 1 } },
    ],
  },
  {
    q: "Pick a soundtrack for the trip",
    options: [
      { label: "Rain on leaves and waterfalls", icon: FiCloudRain, s: { bandarban: 2 } },
      { label: "Folk songs drifting over a lake", icon: FiMusic, s: { rangamati: 2 } },
      { label: "Waves and a sunset playlist", icon: FiSunset, s: { cox: 2 } },
    ],
  },
  {
    q: "How long can you get away?",
    options: [
      { label: "A quick 2–3 days", icon: FiWind, s: { rangamati: 2, bandarban: 1 } },
      { label: "4–5 days", icon: FiTrendingUp, s: { bandarban: 2, cox: 1 } },
      { label: "A full week", icon: FiCalendar, s: { cox: 2, bandarban: 1 } },
    ],
  },
];
const MAX = questions.length * 2;

const VibeQuiz = () => {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState([]); // option index per answered question
  const reduce = useReducedMotion();
  const done = picks.length === questions.length;

  const ranked = useMemo(() => {
    const total = Object.fromEntries(destinations.map((d) => [d.key, 0]));
    picks.forEach((p, qi) => Object.entries(questions[qi].options[p].s).forEach(([k, v]) => (total[k] += v)));
    return destinations
      .map((d) => ({ ...d, pct: Math.round((total[d.key] / MAX) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  }, [picks]);

  const choose = (i) => {
    setPicks((p) => [...p.slice(0, step), i]);
    setStep((s) => s + 1);
  };
  const back = () => {
    setPicks((p) => p.slice(0, -1));
    setStep((s) => Math.max(0, s - 1));
  };
  const restart = () => {
    setPicks([]);
    setStep(0);
  };
  const win = ranked[0];

  return (
    <section className="relative overflow-hidden bg-panel py-24 text-on">
      <Aurora className="opacity-60" />
      <div className="relative mx-auto max-w-3xl px-6">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-accent-lt">30-second quiz</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Which region is your vibe?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-on/70">Four quick taps and we will tell you where to start. No sign-up, no email.</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-[2rem] bg-surface p-6 text-ink shadow-[0_40px_90px_rgba(0,0,0,0.25)] sm:p-9">
            {/* progress */}
            <div className="mb-7 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={Math.min(step, questions.length)}>
                {questions.map((_, i) => (
                  <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <motion.span
                      className="block h-full rounded-full bg-gradient-to-r from-brand to-accent"
                      initial={false}
                      animate={{ width: i < step ? "100%" : "0%" }}
                      transition={{ duration: reduce ? 0 : 0.4 }}
                    />
                  </span>
                ))}
              </div>
              <span className="text-[11px] font-bold tabular-nums text-muted">{Math.min(step + 1, questions.length)}/{questions.length}</span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {!done ? (
                <motion.div
                  key={`q${step}`}
                  initial={{ opacity: 0, x: reduce ? 0 : 36 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduce ? 0 : -36 }}
                  transition={{ duration: 0.28 }}
                >
                  <h3 className="text-2xl font-black leading-snug md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                    {questions[step].q}
                  </h3>
                  <div className="mt-6 grid gap-3">
                    {questions[step].options.map((o, i) => {
                      const Icon = o.icon;
                      return (
                        <motion.button
                          key={o.label}
                          type="button"
                          whileHover={reduce ? undefined : { x: 6 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => choose(i)}
                          className="group flex items-center gap-4 rounded-2xl border border-line bg-sandy px-5 py-4 text-left transition-colors hover:border-brand hover:bg-brand/10"
                        >
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-xl text-brand-ink ring-1 ring-line transition-colors group-hover:bg-btn group-hover:text-white">
                            <Icon />
                          </span>
                          <span className="flex-1 text-sm font-bold md:text-base">{o.label}</span>
                          <FiArrowRight className="text-muted opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                        </motion.button>
                      );
                    })}
                  </div>
                  {step > 0 && (
                    <button type="button" onClick={back} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-muted transition hover:text-ink">
                      <FiArrowLeft /> Back
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-ink">Your best match</p>
                  <div className="relative mt-3 overflow-hidden rounded-3xl">
                    <img src={win.image} alt={win.name} className="h-52 w-full object-cover md:h-64" />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/30 to-transparent" />
                    <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3 text-white">
                      <div>
                        <p className="text-3xl font-black md:text-4xl">{win.name}</p>
                        <p className="text-sm text-white/80">{win.tag}</p>
                      </div>
                      <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-black backdrop-blur">{win.pct}% match</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted">
                    <b className="text-ink">{win.highlight}.</b> Best for {win.bestFor.toLowerCase()}, usually {win.duration.toLowerCase()}.
                  </p>

                  <div className="mt-5 space-y-3">
                    {ranked.map((r, i) => (
                      <div key={r.key}>
                        <div className="mb-1 flex justify-between text-xs font-bold">
                          <span>{r.name}</span>
                          <span className="tabular-nums text-muted">{r.pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-line">
                          <motion.div
                            className={`h-full rounded-full ${i === 0 ? "bg-gradient-to-r from-brand to-accent" : "bg-muted/50"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${r.pct}%` }}
                            transition={{ duration: reduce ? 0 : 0.9, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link to="/services" className="inline-flex items-center gap-2 rounded-full bg-btn px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-brand">
                      See packages <FiArrowRight />
                    </Link>
                    <Link to="/destinations" className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-sandy">
                      <FiClock /> Destination guide
                    </Link>
                    <button type="button" onClick={restart} className="inline-flex items-center gap-2 px-2 py-3 text-xs font-bold text-muted transition hover:text-ink">
                      <FiRefreshCw /> Retake
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default VibeQuiz;
