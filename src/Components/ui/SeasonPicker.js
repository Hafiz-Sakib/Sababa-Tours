// src/Components/ui/SeasonPicker.js
// "When should I go?" Pick a month, see how each region rates, with a 12-month heat strip.
import { useState } from "react";
import { MONTHS, destinations, seasonLabel, seasons } from "../../data/travel";
import { motion } from "./Motion";

const TONE = {
  3: "bg-brand text-white",
  2: "bg-accent text-deep",
  1: "bg-line text-muted",
};

const SeasonPicker = ({ className = "" }) => {
  const [m, setM] = useState(new Date().getMonth());
  return (
    <div className={`rounded-[2rem] border border-line bg-surface p-5 shadow-[0_20px_60px_rgba(16,24,40,0.08)] sm:p-8 ${className}`}>
      <div role="tablist" aria-label="Month" className="flex flex-wrap gap-1.5">
        {MONTHS.map((name, i) => (
          <button
            key={name}
            role="tab"
            aria-selected={m === i}
            onClick={() => setM(i)}
            className={`relative rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
              m === i ? "text-white" : "text-muted hover:bg-sandy"
            }`}
          >
            {m === i && (
              <motion.span layoutId="season-pill" className="absolute inset-0 rounded-full bg-btn" transition={{ type: "spring", stiffness: 420, damping: 32 }} />
            )}
            <span className="relative">{name}</span>
          </button>
        ))}
      </div>

      <div className="mt-7 space-y-5">
        {destinations.map((d) => {
          const score = seasons[d.key][m];
          return (
            <div key={d.slug}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-bold">{d.name}</p>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${TONE[score]}`}>{seasonLabel[score]}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-sandy">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                  initial={false}
                  animate={{ width: `${(score / 3) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              <div className="mt-2 flex gap-1" aria-hidden>
                {seasons[d.key].map((v, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${v === 3 ? "bg-brand" : v === 2 ? "bg-accent" : "bg-line"} ${i === m ? "ring-2 ring-deep ring-offset-1" : ""}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-muted">General seasonal guidance. Conditions change, so our desk confirms the latest before you travel.</p>
    </div>
  );
};

export default SeasonPicker;
