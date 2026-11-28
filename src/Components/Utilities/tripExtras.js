// src/Components/Utilities/tripExtras.js
// Extra booking information: trip category, lead traveler, hotel room, flight.
// These rules mirror the server (sababa-tours-backend/extras.js). The server always validates again.

export const CATEGORIES = [
  { id: "Family", hint: "Parents, kids, grandparents" },
  { id: "Couple", hint: "Honeymoon or a getaway for two" },
  { id: "Friends", hint: "A group of friends" },
  { id: "Solo", hint: "Travelling on your own" },
  { id: "Corporate", hint: "Team trip or company retreat" },
];
export const ROOM_TYPES = [
  { id: "Standard", hint: "Comfortable, essentials covered" },
  { id: "Deluxe", hint: "More space, better view" },
  { id: "Family Suite", hint: "Connected beds, room for kids" },
  { id: "Luxury Suite", hint: "Premium room with extras" },
];
export const BED_TYPES = ["Double", "Twin", "Any"];
export const MEAL_PLANS = ["Room only", "Breakfast", "Half board", "Full board"];
export const CABINS = ["Economy", "Premium Economy", "Business"];
export const FLIGHT_MODES = [
  { id: "own", label: "I have my flight", hint: "Share the details so we can plan the pickup" },
  { id: "arrange", label: "Please arrange it", hint: "Our desk finds and books a flight" },
  { id: "none", label: "No flight needed", hint: "Travelling by road or already there" },
];

export const MAX_ROOMS = 10;
export const MAX_NIGHTS = 14;

const FLIGHT_NO_REGEX = /^[A-Z0-9]{2}-?\d{1,4}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const INTL_PHONE_REGEX = /^\+?\d{8,15}$/;
const NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,79}$/u;

export const defaultExtras = (fullName = "") => ({
  category: "",
  traveler: { fullName, nationality: "Bangladeshi", children: 0, emergencyName: "", emergencyPhone: "" },
  hotel: { needed: true, roomType: "Standard", rooms: 1, bedType: "Any", mealPlan: "Breakfast", nights: 2, requests: "" },
  flight: { mode: "none", departFrom: "", airline: "", flightNo: "", arrivalTime: "", returnFlightNo: "", returnDate: "", cabin: "Economy", roundTrip: true },
});

/* merge a saved / server value onto the defaults so every field exists */
export const withDefaults = (saved = {}, fullName = "") => {
  const d = defaultExtras(fullName);
  return {
    category: saved.category || d.category,
    traveler: { ...d.traveler, ...(saved.traveler || {}) },
    hotel: { ...d.hotel, ...(saved.hotel || {}) },
    flight: {
      ...d.flight,
      ...(saved.flight || {}),
      returnDate: saved.flight?.returnDate ? String(saved.flight.returnDate).slice(0, 10) : "",
    },
  };
};

/* errors are keyed "category", "traveler.fullName", "hotel.rooms", "flight.flightNo" ... */
export const validateExtras = (x, { travelers = 1, date = "" } = {}) => {
  const e = {};
  if (!CATEGORIES.some((c) => c.id === x.category)) e.category = "Choose the type of trip.";

  const t = x.traveler;
  if (!NAME_REGEX.test(String(t.fullName).trim())) e["traveler.fullName"] = "Enter the lead traveler's full name.";
  const kids = Number(t.children) || 0;
  if (!Number.isInteger(kids) || kids < 0) e["traveler.children"] = "Enter a valid number.";
  else if (kids >= travelers) e["traveler.children"] = "At least one adult is needed.";
  const en = String(t.emergencyName).trim();
  const ep = String(t.emergencyPhone).replace(/[\s-]/g, "");
  if (en && !NAME_REGEX.test(en)) e["traveler.emergencyName"] = "Enter a valid name.";
  if (ep && !INTL_PHONE_REGEX.test(ep)) e["traveler.emergencyPhone"] = "Enter a valid phone number.";
  if (en && !ep) e["traveler.emergencyPhone"] = "Add a phone number for this contact.";
  if (ep && !en) e["traveler.emergencyName"] = "Add a name for this contact.";

  const h = x.hotel;
  if (h.needed) {
    const rooms = Number(h.rooms);
    const nights = Number(h.nights);
    if (!Number.isInteger(rooms) || rooms < 1 || rooms > MAX_ROOMS) e["hotel.rooms"] = `Between 1 and ${MAX_ROOMS}.`;
    else if (rooms > travelers) e["hotel.rooms"] = "More rooms than travelers.";
    if (!Number.isInteger(nights) || nights < 1 || nights > MAX_NIGHTS) e["hotel.nights"] = `Between 1 and ${MAX_NIGHTS}.`;
  }

  const f = x.flight;
  if (f.mode !== "none") {
    if (String(f.departFrom).trim().length < 2) e["flight.departFrom"] = "Enter the city you fly from.";
    if (f.mode === "own") {
      if (String(f.airline).trim().length < 2) e["flight.airline"] = "Enter the airline.";
      if (!FLIGHT_NO_REGEX.test(String(f.flightNo).replace(/\s/g, "").toUpperCase())) e["flight.flightNo"] = "e.g. BG435";
      if (!TIME_REGEX.test(f.arrivalTime)) e["flight.arrivalTime"] = "Enter the arrival time.";
      const rn = String(f.returnFlightNo).replace(/\s/g, "").toUpperCase();
      if (rn && !FLIGHT_NO_REGEX.test(rn)) e["flight.returnFlightNo"] = "e.g. BG436";
      if (f.returnDate && date && f.returnDate < date) e["flight.returnDate"] = "Before the trip date.";
    }
  }
  return e;
};

/* the object sent to / read from the server */
export const toPayload = (x) => {
  const t = x.traveler;
  const h = x.hotel;
  const f = x.flight;
  const hotel = h.needed
    ? { needed: true, roomType: h.roomType, rooms: Number(h.rooms), bedType: h.bedType, mealPlan: h.mealPlan, nights: Number(h.nights), requests: String(h.requests || "").trim() }
    : { needed: false };
  let flight = { mode: f.mode };
  if (f.mode === "arrange") flight = { mode: "arrange", departFrom: f.departFrom.trim(), cabin: f.cabin, roundTrip: !!f.roundTrip };
  if (f.mode === "own") {
    flight = {
      mode: "own",
      departFrom: f.departFrom.trim(),
      airline: f.airline.trim(),
      flightNo: f.flightNo.replace(/\s/g, "").toUpperCase(),
      arrivalTime: f.arrivalTime,
      returnFlightNo: f.returnFlightNo.replace(/\s/g, "").toUpperCase(),
      returnDate: f.returnDate || "",
    };
  }
  return {
    category: x.category,
    traveler: {
      fullName: t.fullName.trim(),
      nationality: String(t.nationality || "").trim() || "Bangladeshi",
      children: Number(t.children) || 0,
      emergencyName: String(t.emergencyName || "").trim(),
      emergencyPhone: String(t.emergencyPhone || "").replace(/[\s-]/g, ""),
    },
    hotel,
    flight,
  };
};

/* which keys belong to which wizard step */
export const errorsFor = (errors, prefix) => Object.keys(errors).filter((k) => k === prefix || k.startsWith(prefix + "."));

/* short readable summaries (receipt, review, my bookings, admin, invoice) */
export const hotelSummary = (h) => {
  if (!h) return "";
  if (!h.needed) return "Own stay (no hotel needed)";
  const bits = [`${h.roomType}${h.rooms > 1 ? ` × ${h.rooms}` : ""}`, `${h.nights} ${h.nights === 1 ? "night" : "nights"}`, h.mealPlan];
  if (h.bedType && h.bedType !== "Any") bits.push(`${h.bedType} bed`);
  return bits.join(" · ");
};
export const flightSummary = (f) => {
  if (!f || !f.mode) return "";
  if (f.mode === "none") return "No flight needed";
  if (f.mode === "arrange") return `Desk arranges · from ${f.departFrom} · ${f.cabin}${f.roundTrip ? " · return" : " · one way"}`;
  const out = `${f.airline} ${f.flightNo} · from ${f.departFrom} · lands ${f.arrivalTime}`;
  const back = f.returnFlightNo || f.returnDate ? ` · return ${[f.returnFlightNo, f.returnDate ? String(f.returnDate).slice(0, 10) : ""].filter(Boolean).join(" ")}` : "";
  return out + back;
};
export const travelerSummary = (t, travelers) => {
  if (!t?.fullName) return "";
  const kids = Number(t.children) || 0;
  const adults = Math.max(0, (Number(travelers) || 0) - kids);
  return `${t.fullName} · ${adults} ${adults === 1 ? "adult" : "adults"}${kids ? ` + ${kids} ${kids === 1 ? "child" : "children"}` : ""}`;
};

/* check-in / check-out dates from the trip date and nights (YYYY-MM-DD in, readable out) */
export const stayDates = (dateStr, nights) => {
  if (!dateStr || !nights) return null;
  const a = new Date(`${String(dateStr).slice(0, 10)}T00:00`);
  const b = new Date(a);
  b.setDate(b.getDate() + Number(nights));
  const f = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${f(a)} → ${f(b)}`;
};

/* label / value rows describing a saved booking's extra details (older bookings without them return []) */
export const extraRows = (b) => {
  const rows = [];
  if (!b) return rows;
  if (b.category) rows.push({ key: "category", label: "Trip type", value: b.category });
  if (b.traveler?.fullName) {
    rows.push({ key: "traveler", label: "Lead traveler", value: travelerSummary(b.traveler, b.travelers) });
    if (b.traveler.nationality) rows.push({ key: "nationality", label: "Nationality", value: b.traveler.nationality });
    if (b.traveler.emergencyName) rows.push({ key: "emergency", label: "Emergency contact", value: `${b.traveler.emergencyName} · ${b.traveler.emergencyPhone}` });
  }
  if (b.hotel && (b.hotel.needed === true || b.hotel.needed === false)) {
    rows.push({ key: "hotel", label: "Hotel room", value: hotelSummary(b.hotel) });
    if (b.hotel.needed) {
      const d = stayDates(b.preferredDate, b.hotel.nights);
      if (d) rows.push({ key: "stay", label: "Check-in → out", value: d });
      if (b.hotel.requests) rows.push({ key: "hreq", label: "Room requests", value: b.hotel.requests });
    }
  }
  if (b.flight?.mode) rows.push({ key: "flight", label: "Flight", value: flightSummary(b.flight) });
  return rows;
};

/* one line for CSV exports */
export const extrasForCsv = (b) => ({
  category: b.category || "",
  traveler: b.traveler?.fullName || "",
  children: b.traveler?.children ?? "",
  emergency: b.traveler?.emergencyName ? `${b.traveler.emergencyName} ${b.traveler.emergencyPhone}` : "",
  hotel: b.hotel ? hotelSummary(b.hotel) : "",
  flight: b.flight?.mode ? flightSummary(b.flight) : "",
});
