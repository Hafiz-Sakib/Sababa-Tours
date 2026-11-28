// src/Components/Booking/TripExtras.js
// Form pieces for the extra booking information. Used by the booking wizard (one piece per step)
// and by the edit modal (all pieces in one scrolling form).
//   CategoryPicker  - what kind of trip
//   TravelerFields  - lead traveler, nationality, children, emergency contact
//   StayFlightFields - hotel room + flight
// All take: value (the extras object), set(group, key, val), errors, and travelers / date where needed.
import { FiAlertCircle, FiCheck, FiMinus, FiPlus } from "react-icons/fi";
import { FiHome, FiNavigation, FiUser } from "react-icons/fi";
import { AnimatePresence, motion } from "../ui/Motion";
import {
  BED_TYPES, CABINS, CATEGORIES, FLIGHT_MODES, MAX_NIGHTS, MAX_ROOMS, MEAL_PLANS, ROOM_TYPES, stayDates,
} from "../Utilities/tripExtras";

const base =
  "w-full border bg-sandy rounded-2xl px-4 py-3.5 text-base sm:text-sm outline-none transition-all duration-200 focus:bg-surface focus:ring-4 focus:ring-brand/10";
const cls = (err) => `${base} ${err ? "border-red-400 focus:border-red-500" : "border-line focus:border-brand/60"}`;

const Label = ({ children, optional }) => (
  <label className="mb-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
    {children}
    {optional && <span className="font-medium normal-case tracking-normal text-muted/60">(optional)</span>}
  </label>
);
const Err = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-500">
        <FiAlertCircle size={13} /> {msg}
      </motion.p>
    )}
  </AnimatePresence>
);
const SubHead = ({ icon, title, text }) => (
  <div className="mb-5 flex items-start gap-3">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-lg text-brand-ink">{icon}</span>
    <div>
      <h4 className="text-lg font-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h4>
      {text && <p className="mt-0.5 text-sm text-muted">{text}</p>}
    </div>
  </div>
);

/* a row of selectable cards / chips */
const Choice = ({ options, value, onChange, label, cols = "sm:grid-cols-2" }) => (
  <div role="radiogroup" aria-label={label} className={`grid gap-2.5 ${cols}`}>
    {options.map((o) => {
      const id = typeof o === "string" ? o : o.id;
      const text = typeof o === "string" ? o : o.label || o.id;
      const hint = typeof o === "string" ? "" : o.hint;
      const on = value === id;
      return (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(id)}
          className={`relative flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
            on ? "border-brand bg-brand/10 ring-2 ring-brand/20" : "border-line bg-sandy hover:border-brand/50"
          }`}
        >
          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-brand bg-brand text-white" : "border-line text-transparent"}`}>
            <FiCheck size={11} strokeWidth={4} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{text}</span>
            {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
          </span>
        </button>
      );
    })}
  </div>
);

const Counter = ({ value, min, max, onChange, label }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-line bg-sandy px-3 py-2">
    <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-9 w-9 place-items-center rounded-full bg-surface ring-1 ring-line transition active:scale-90 disabled:opacity-35">
      <FiMinus />
    </button>
    <span className="min-w-[2ch] flex-1 text-center text-lg font-bold tabular-nums" aria-live="polite">{value}</span>
    <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-9 w-9 place-items-center rounded-full bg-btn text-white transition active:scale-90 disabled:opacity-35">
      <FiPlus />
    </button>
  </div>
);

const Select = ({ value, onChange, options, err }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={cls(err)}>
    {options.map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
);

/* ───────────────────────── category ───────────────────────── */
export const CategoryPicker = ({ value, set, errors }) => (
  <div>
    <Label>Type of trip</Label>
    <Choice options={CATEGORIES} value={value.category} onChange={(v) => set("category", null, v)} label="Type of trip" />
    <Err msg={errors.category} />
  </div>
);

/* ───────────────────────── lead traveler ───────────────────────── */
export const TravelerFields = ({ value, set, errors, travelers }) => {
  const t = value.traveler;
  const adults = Math.max(0, travelers - (Number(t.children) || 0));
  return (
    <div className="space-y-5">
      <SubHead icon={<FiUser />} title="Lead traveler" text="The name on the booking. We use it for hotel check-in and the itinerary." />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <input type="text" autoComplete="name" value={t.fullName} maxLength={80} placeholder="As on your ID" onChange={(e) => set("traveler", "fullName", e.target.value)} className={cls(errors["traveler.fullName"])} />
          <Err msg={errors["traveler.fullName"]} />
        </div>
        <div>
          <Label>Nationality</Label>
          <input type="text" value={t.nationality} maxLength={40} placeholder="Bangladeshi" onChange={(e) => set("traveler", "nationality", e.target.value)} className={cls(false)} />
        </div>
      </div>

      <div>
        <Label>Children among {travelers} {travelers === 1 ? "traveler" : "travelers"}</Label>
        <div className="grid items-center gap-3 sm:grid-cols-[180px_1fr]">
          <Counter value={Number(t.children) || 0} min={0} max={Math.max(0, travelers - 1)} onChange={(n) => set("traveler", "children", n)} label="children" />
          <p className="text-sm text-muted"><b className="text-ink">{adults}</b> {adults === 1 ? "adult" : "adults"}{Number(t.children) ? <> and <b className="text-ink">{t.children}</b> {Number(t.children) === 1 ? "child" : "children"}</> : null}</p>
        </div>
        <Err msg={errors["traveler.children"]} />
      </div>

      <div>
        <Label optional>Emergency contact</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <input type="text" value={t.emergencyName} maxLength={80} placeholder="Contact name" onChange={(e) => set("traveler", "emergencyName", e.target.value)} className={cls(errors["traveler.emergencyName"])} />
            <Err msg={errors["traveler.emergencyName"]} />
          </div>
          <div>
            <input type="tel" inputMode="tel" value={t.emergencyPhone} maxLength={16} placeholder="Phone, e.g. 017XXXXXXXX" onChange={(e) => set("traveler", "emergencyPhone", e.target.value.replace(/[^\d+\s-]/g, ""))} className={cls(errors["traveler.emergencyPhone"])} />
            <Err msg={errors["traveler.emergencyPhone"]} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── hotel + flight ───────────────────────── */
export const StayFlightFields = ({ value, set, errors, travelers, date }) => {
  const h = value.hotel;
  const f = value.flight;
  const dates = stayDates(date, h.nights);
  return (
    <div className="space-y-10">
      {/* hotel */}
      <div>
        <SubHead icon={<FiHome />} title="Hotel room" text="Tell us how you like to stay. Final room and price are confirmed by our desk." />
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          {[
            [true, "Book a room for me"],
            [false, "I have my own stay"],
          ].map(([v, t]) => (
            <button
              key={t}
              type="button"
              aria-pressed={h.needed === v}
              onClick={() => set("hotel", "needed", v)}
              className={`rounded-2xl border px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${h.needed === v ? "border-brand bg-brand/10 ring-2 ring-brand/20" : "border-line bg-sandy hover:border-brand/50"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {h.needed && (
            <motion.div key="hotel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-5 pb-1">
                <div>
                  <Label>Room type</Label>
                  <Choice options={ROOM_TYPES} value={h.roomType} onChange={(v) => set("hotel", "roomType", v)} label="Room type" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label>Rooms</Label>
                    <Counter value={Number(h.rooms) || 1} min={1} max={Math.min(MAX_ROOMS, travelers)} onChange={(n) => set("hotel", "rooms", n)} label="rooms" />
                    <Err msg={errors["hotel.rooms"]} />
                  </div>
                  <div>
                    <Label>Nights</Label>
                    <Counter value={Number(h.nights) || 1} min={1} max={MAX_NIGHTS} onChange={(n) => set("hotel", "nights", n)} label="nights" />
                    {dates && <p className="mt-2 text-xs text-muted">Check-in → check-out: <b className="text-ink">{dates}</b></p>}
                    <Err msg={errors["hotel.nights"]} />
                  </div>
                  <div>
                    <Label>Bed preference</Label>
                    <Select value={h.bedType} onChange={(v) => set("hotel", "bedType", v)} options={BED_TYPES} />
                  </div>
                  <div>
                    <Label>Meal plan</Label>
                    <Select value={h.mealPlan} onChange={(v) => set("hotel", "mealPlan", v)} options={MEAL_PLANS} />
                  </div>
                </div>
                <div>
                  <Label optional>Room requests</Label>
                  <input type="text" value={h.requests} maxLength={200} placeholder="High floor, sea view, quiet room…" onChange={(e) => set("hotel", "requests", e.target.value)} className={cls(false)} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* flight */}
      <div>
        <SubHead icon={<FiNavigation />} title="Flight" text="Flying in? Share the details so our driver is waiting when you land." />
        <Choice options={FLIGHT_MODES} value={f.mode} onChange={(v) => set("flight", "mode", v)} label="Flight" cols="sm:grid-cols-3" />

        <AnimatePresence initial={false} mode="wait">
          {f.mode !== "none" && (
            <motion.div key={f.mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-5">
              <div>
                <Label>Flying from (city)</Label>
                <input type="text" value={f.departFrom} maxLength={40} placeholder="Dhaka, Sylhet, Dubai…" onChange={(e) => set("flight", "departFrom", e.target.value)} className={cls(errors["flight.departFrom"])} />
                <Err msg={errors["flight.departFrom"]} />
              </div>

              {f.mode === "arrange" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label>Cabin class</Label>
                    <Select value={f.cabin} onChange={(v) => set("flight", "cabin", v)} options={CABINS} />
                  </div>
                  <div>
                    <Label>Trip</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[[true, "Round trip"], [false, "One way"]].map(([v, t]) => (
                        <button key={t} type="button" aria-pressed={!!f.roundTrip === v} onClick={() => set("flight", "roundTrip", v)} className={`rounded-2xl border px-3 py-3.5 text-sm font-bold transition ${!!f.roundTrip === v ? "border-brand bg-brand/10 ring-2 ring-brand/20" : "border-line bg-sandy hover:border-brand/50"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted sm:col-span-2">Flight fares are not part of the package total. Our desk shares options and prices before anything is booked.</p>
                </div>
              )}

              {f.mode === "own" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label>Airline</Label>
                    <input type="text" value={f.airline} maxLength={40} placeholder="Biman, US-Bangla, Novoair…" onChange={(e) => set("flight", "airline", e.target.value)} className={cls(errors["flight.airline"])} />
                    <Err msg={errors["flight.airline"]} />
                  </div>
                  <div>
                    <Label>Flight number</Label>
                    <input type="text" value={f.flightNo} maxLength={7} placeholder="BG435" onChange={(e) => set("flight", "flightNo", e.target.value.toUpperCase())} className={`${cls(errors["flight.flightNo"])} uppercase`} />
                    <Err msg={errors["flight.flightNo"]} />
                  </div>
                  <div>
                    <Label>Arrival time at destination</Label>
                    <input type="time" value={f.arrivalTime} onChange={(e) => set("flight", "arrivalTime", e.target.value)} className={cls(errors["flight.arrivalTime"])} />
                    <Err msg={errors["flight.arrivalTime"]} />
                  </div>
                  <div className="hidden sm:block" />
                  <div>
                    <Label optional>Return flight number</Label>
                    <input type="text" value={f.returnFlightNo} maxLength={7} placeholder="BG436" onChange={(e) => set("flight", "returnFlightNo", e.target.value.toUpperCase())} className={`${cls(errors["flight.returnFlightNo"])} uppercase`} />
                    <Err msg={errors["flight.returnFlightNo"]} />
                  </div>
                  <div>
                    <Label optional>Return date</Label>
                    <input type="date" min={date || undefined} value={f.returnDate} onChange={(e) => set("flight", "returnDate", e.target.value)} className={cls(errors["flight.returnDate"])} />
                    <Err msg={errors["flight.returnDate"]} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
