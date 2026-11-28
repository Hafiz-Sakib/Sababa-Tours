// src/Components/Utilities/cards.js
// Demo card helpers: brand detection, Luhn check, formatting, random TEST cards, and a small "saved card" store.
// Only brand, last four digits, holder name and expiry are ever saved (never the full number or the CVC).
// This is a demo checkout: no real money moves and no card data leaves the browser.

export const digits = (s) => String(s || "").replace(/\D/g, "");

export const brandOf = (num) => {
  const n = digits(num);
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|22[2-9]|2[3-6]\d|27[01]|2720)/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "card";
};

export const BRAND_LABEL = { visa: "VISA", mastercard: "Mastercard", amex: "AMEX", card: "Card" };

export const cvcLen = (brand) => (brand === "amex" ? 4 : 3);

/* 4-4-4-4 (amex 4-6-5) */
export const formatNumber = (num) => {
  const n = digits(num);
  if (brandOf(n) === "amex") {
    const d = n.slice(0, 15);
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  }
  return n.slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
};

export const numberLen = (brand) => (brand === "amex" ? 15 : 16);

export const luhnOk = (num) => {
  const n = digits(num);
  if (n.length < 12) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
};

/* "1234" -> "12/34", keeps the slash out of the way while typing */
export const formatExpiry = (v) => {
  const d = digits(v).slice(0, 4);
  if (d.length === 0) return "";
  let mm = d.slice(0, 2);
  if (d.length === 1 && Number(d) > 1) return "0" + d + "/";
  if (mm.length === 2 && Number(mm) > 12) mm = "12";
  return d.length > 2 ? `${mm}/${d.slice(2)}` : d.length === 2 ? `${mm}/` : mm;
};

export const expiryOk = (v) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(v || "");
  if (!m) return false;
  const mm = Number(m[1]);
  const yy = 2000 + Number(m[2]);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  return yy > now.getFullYear() || (yy === now.getFullYear() && mm >= now.getMonth() + 1);
};

const rnd = (n) => Math.floor(Math.random() * n);
const randDigits = (n) => Array.from({ length: n }, () => rnd(10)).join("");

const withLuhn = (partial) => {
  for (let c = 0; c < 10; c++) if (luhnOk(partial + c)) return partial + c;
  return partial + "0";
};

/* a random, Luhn-valid TEST card (Visa or Mastercard), future expiry, random CVC */
export const randomTestCard = (name = "") => {
  const visa = Math.random() < 0.55;
  const number = visa ? withLuhn("4" + randDigits(14)) : withLuhn("5" + (1 + rnd(5)) + randDigits(13));
  const y = (new Date().getFullYear() + 2 + rnd(5)) % 100;
  return {
    number: formatNumber(number),
    name,
    expiry: `${String(1 + rnd(12)).padStart(2, "0")}/${String(y).padStart(2, "0")}`,
    cvc: randDigits(3),
  };
};

/* random 6-digit demo codes and ids */
export const randomOtp = () => String(100000 + rnd(900000));
export const randomRef = (prefix) =>
  prefix + Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[rnd(32)]).join("");

/* bd mobile number: 01[3-9]XXXXXXXX */
export const phoneOk = (v) => /^01[3-9]\d{8}$/.test(digits(v));
export const maskPhone = (v) => {
  const d = digits(v);
  return d.length >= 11 ? `${d.slice(0, 3)}••••${d.slice(-3)}` : d;
};
export const randomPhone = () => "01" + (3 + rnd(7)) + randDigits(8);

/* saved card, per logged-in user, browser only */
const key = (uid) => `sababa_card_${uid || "guest"}`;
export const loadCard = (uid) => {
  try {
    const raw = JSON.parse(localStorage.getItem(key(uid)) || "null");
    return raw && raw.last4 ? raw : null;
  } catch {
    return null;
  }
};
export const saveCard = (uid, card) => {
  try {
    localStorage.setItem(key(uid), JSON.stringify(card));
  } catch {
    /* storage unavailable: the card is simply not remembered */
  }
};
export const clearCard = (uid) => {
  try {
    localStorage.removeItem(key(uid));
  } catch {
    /* ignore */
  }
};

/* name shown on the card by default: the Google (or sign-up) display name, then the e-mail name */
export const holderName = (user) => {
  const clean = (v) => String(v || "").replace(/[^a-zA-Z .'-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 26);
  const candidates = [
    user?.displayName,
    ...(user?.providerData || []).map((p) => p?.displayName),
    (user?.email || "").split("@")[0].replace(/[._\-+0-9]+/g, " "),
  ];
  for (const c of candidates) {
    const n = clean(c);
    if (n.length >= 2) return n;
  }
  return "Card Holder"; // e.g. a name written only in Bangla letters
};

/* Bangladeshi banks for the bank payment (demo) */
export const BANKS = [
  "City Bank", "Dutch-Bangla Bank", "BRAC Bank", "Islami Bank", "Sonali Bank", "Eastern Bank",
  "Janata Bank", "Agrani Bank", "Prime Bank", "Mutual Trust Bank", "Pubali Bank", "Standard Chartered",
];
export const accountOk = (v) => digits(v).length >= 10 && digits(v).length <= 16;
export const maskAccount = (v) => {
  const d = digits(v);
  return d.length > 4 ? `•••• ${d.slice(-4)}` : d;
};
export const randomAccount = () => String(1 + rnd(9)) + randDigits(12);

export const randomCvc = (brand) => randDigits(brand === "amex" ? 4 : 3);
