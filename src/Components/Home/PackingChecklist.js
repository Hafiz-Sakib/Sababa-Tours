// src/Components/Home/PackingChecklist.js
// Region-aware packing list with a progress ring. Ticks are remembered in this browser only.
import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiRefreshCw } from "react-icons/fi";
import { destinations } from "../../data/travel";
import { AnimatePresence, PillTabs, Reveal, motion, useReducedMotion } from "../ui/Motion";

const STORE = "sababa-packing";

const common = [
  "ID and a copy of your booking",
  "Phone and a power bank",
  "Reusable water bottle",
  "Sunscreen and sunglasses",
  "Any personal medicines",
];
const byRegion = {
  bandarban: ["Grippy trail shoes", "Light rain jacket", "Quick-dry clothes", "Insect repellent", "Small daypack", "Torch or headlamp"],
  rangamati: ["Hat and light cotton clothes", "Dry bag for your phone", "Comfortable sandals", "Light scarf for the lake breeze", "Cash for village markets", "Camera"],
  cox: ["Swimwear and a towel", "Flip-flops", "Beach bag", "Light cover-up", "Lip balm with SPF", "Zip pouch to keep sand off electronics"],
};

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
};

const R = 52;
const C = 2 * Math.PI * R;

const PackingChecklist = () => {
  const [key, setKey] = useState(destinations[0].key);
  const [checked, setChecked] = useState(load); // { "region|item": true }
  const reduce = useReducedMotion();
  const d = destinations.find((x) => x.key === key);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(checked));
    } catch {
      /* storage blocked: still works for this visit */
    }
  }, [checked]);

  const groups = useMemo(
    () => [
      { title: "Essentials", items: common.map((t) => ({ id: `all|${t}`, t })) },
      { title: `For ${d.name}`, items: byRegion[key].map((t) => ({ id: `${key}|${t}`, t })) },
    ],
    [key, d.name],
  );
  const all = groups.flatMap((g) => g.items);
  const done = all.filter((i) => checked[i.id]).length;
  const pct = done / all.length;
  const complete = done === all.length;

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const reset = () =>
    setChecked((c) => {
      const next = { ...c };
      all.forEach((i) => delete next[i.id]);
      return next;
    });

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Before you go</p>
            <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Pack smart, travel light
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">Tick things off as you pack. We remember your list on this device.</p>
            <div className="mt-7 flex justify-center">
              <PillTabs id="pack-dest" items={destinations.map((x) => ({ id: x.key, label: x.name }))} value={key} onChange={setKey} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid gap-8 rounded-[2rem] border border-line bg-sandy p-6 shadow-card sm:p-9 md:grid-cols-[220px_1fr]">
            {/* progress ring */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
                  <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="stroke-line" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    className={complete ? "stroke-accent" : "stroke-brand"}
                    strokeDasharray={C}
                    initial={false}
                    animate={{ strokeDashoffset: C * (1 - pct) }}
                    transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div>
                    <p className="text-4xl font-black tabular-nums">{Math.round(pct * 100)}%</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{done}/{all.length} packed</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 min-h-[44px]" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={complete ? "yes" : "no"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-bold text-brand-ink"
                  >
                    {complete ? `All set for ${d.name}!` : "Keep going, you are getting there."}
                  </motion.p>
                </AnimatePresence>
              </div>
              <button type="button" onClick={reset} disabled={!done} className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-muted transition hover:text-ink disabled:opacity-40">
                <FiRefreshCw /> Reset list
              </button>
            </div>

            {/* list */}
            <div className="space-y-7">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-ink">{g.title}</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {g.items.map((it) => {
                      const on = !!checked[it.id];
                      return (
                        <li key={it.id}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggle(it.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition active:scale-[0.98] ${
                              on ? "border-brand/40 bg-brand/10" : "border-line bg-surface hover:border-brand/50"
                            }`}
                          >
                            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-brand bg-brand text-white" : "border-line text-transparent"}`}>
                              <motion.span initial={false} animate={{ scale: on ? 1 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }} className="grid">
                                <FiCheck className="text-sm" />
                              </motion.span>
                            </span>
                            <span className={`font-semibold transition ${on ? "text-muted line-through decoration-brand/50" : ""}`}>{it.t}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default PackingChecklist;
