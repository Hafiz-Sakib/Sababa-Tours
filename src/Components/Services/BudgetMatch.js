// src/Components/Services/BudgetMatch.js
// Budget section for the Packages page (Motion Brew "Amount slider"): drag the budget per traveler and see how many
// of the live packages fit. "Show these packages" filters the grid below.
import { useEffect, useMemo, useState } from "react";
import { FiArrowDown } from "react-icons/fi";
import AmountSlider from "../ui/brew/AmountSlider";
import { AnimatedNumber, Reveal } from "../ui/Motion";

const STEP = 500;

const BudgetMatch = ({ services, onApply, applied }) => {
  const prices = useMemo(() => services.map((s) => s.price).filter((p) => p > 0), [services]);
  const lo = prices.length ? Math.floor(Math.min(...prices) / STEP) * STEP : 0;
  const hi = prices.length ? Math.ceil(Math.max(...prices) / STEP) * STEP : 0;
  const [budget, setBudget] = useState(hi);

  // start at the top of the range once the packages have loaded
  useEffect(() => setBudget(hi), [hi]);

  if (prices.length < 2 || hi <= lo) return null;

  const fits = prices.filter((p) => p <= budget);
  const cheapest = Math.min(...prices);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
      <div className="grid items-center gap-12 rounded-[2.5rem] bg-panel px-6 py-14 text-on sm:px-10 lg:grid-cols-2 lg:px-14">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-accent-lt">Plan by budget</p>
          <h2 className="text-3xl font-black md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            What fits your budget per traveler?
          </h2>
          <p className="mt-4 max-w-md text-on/70">
            Package totals are the price multiplied by the number of travelers, so start with what each person can spend. Prices come straight from the live package list.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="text-ink">
            <AmountSlider value={budget} onChange={setBudget} min={lo} max={hi} step={STEP} prefix="৳" label="Budget per traveler">
              <p className="text-sm text-muted">
                <b className="text-lg font-black text-ink">
                  <AnimatedNumber value={fits.length} />
                </b>{" "}
                of {prices.length} packages fit
                {fits.length === 0 && ` (the lowest price is ৳${cheapest.toLocaleString()})`}.
              </p>
              <button
                type="button"
                disabled={fits.length === 0}
                onClick={() => onApply(budget)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-btn px-6 py-3 text-sm font-bold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                {applied === budget ? "Showing these packages" : "Show these packages"} <FiArrowDown />
              </button>
            </AmountSlider>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default BudgetMatch;
