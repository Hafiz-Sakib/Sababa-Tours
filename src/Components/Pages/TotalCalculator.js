// src/Components/Pages/TotalCalculator.js
// "Honest totals, worked out" for the About tab: Motion Brew "Rolling stepper" for travelers.
// The rule it shows is the one on the booking form: total = price per traveler x travelers, and the advance is
// ADVANCE_PERCENT of it once the desk confirms a date. The price field is only an example.
import { useState } from "react";
import RollingStepper from "../ui/brew/RollingStepper";
import { AnimatedNumber, Reveal } from "../ui/Motion";
import { ADVANCE_PERCENT } from "../Utilities/payment";

const TotalCalculator = () => {
  const [travelers, setTravelers] = useState(4);
  const [price, setPrice] = useState(8000);
  const total = price * travelers;
  const advance = Math.ceil((total * ADVANCE_PERCENT) / 100);

  return (
    <section className="bg-sandy py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">Honest totals</p>
          <h2 className="text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            See how a total is worked out
          </h2>
          <p className="mt-5 max-w-md text-muted leading-relaxed">
            A package total is its price multiplied by the number of travelers. Change the group size and the price below to try it. The price is only an example, so check the real one on each package.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8">
            <RollingStepper value={travelers} onChange={setTravelers} min={1} max={20} label="Travelers" />
            <label className="mt-6 block text-xs font-bold text-muted" htmlFor="calc-price">
              Example price per traveler (BDT)
            </label>
            <input
              id="calc-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
              className="mt-2 w-full rounded-xl border border-line bg-page-alt px-4 py-3 text-base font-semibold outline-none transition focus:border-brand"
            />
            <dl className="mt-6 space-y-3 border-t border-line pt-6">
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-muted">Total</dt>
                <dd className="text-3xl font-black" style={{ fontFamily: "var(--font-display)" }}>
                  <AnimatedNumber value={total} prefix="BDT " />
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-muted">{ADVANCE_PERCENT}% advance, when your date needs one</dt>
                <dd className="font-bold text-brand-ink">
                  <AnimatedNumber value={advance} prefix="BDT " />
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default TotalCalculator;
