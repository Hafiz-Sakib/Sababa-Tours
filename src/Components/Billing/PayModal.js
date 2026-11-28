// src/Components/Billing/PayModal.js
// Centered checkout modal for the Billing page. A demo flow that behaves like a real gateway:
//   Card    : add card (Motion Brew "Add card") -> card form with test-card button -> bank 3-D Secure code -> processing -> receipt
//   bKash / Nagad : account number -> SMS verification code -> wallet PIN -> processing -> receipt
// No real money moves. The saved card keeps only brand, last four, name and expiry.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiCreditCard,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiSmartphone,
  FiTrash2,
  FiX,
  FiZap,
} from "react-icons/fi";
import AddCard from "../ui/brew/AddCard";
import PayLogo from "../ui/PayLogo";
import { money, fmtDateTime } from "../Utilities/payment";
import {
  BANKS,
  BRAND_LABEL,
  accountOk,
  brandOf,
  clearCard,
  cvcLen,
  digits,
  expiryOk,
  formatExpiry,
  formatNumber,
  holderName,
  loadCard,
  luhnOk,
  maskAccount,
  maskPhone,
  numberLen,
  phoneOk,
  randomOtp,
  randomAccount,
  randomPhone,
  randomRef,
  randomTestCard,
  saveCard,
} from "../Utilities/cards";

const serif = { fontFamily: "var(--font-display)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WALLET = {
  bKash: { color: "#e2136e", grad: "linear-gradient(135deg,#e2136e,#a30b50)", pin: 5, prefix: "BK", sms: "bKash" },
  Nagad: { color: "#f6921e", grad: "linear-gradient(135deg,#f6921e,#d4380d)", pin: 4, prefix: "NG", sms: "Nagad" },
  Bank: { color: "#0b9a4b", grad: "linear-gradient(135deg,#0b9a4b,#066f36)", pin: 4, prefix: "BN", sms: "Bank OTP" },
};
const CARD_GRAD = "linear-gradient(135deg,#0F5C46,#26A59E)";

const inputCls =
  "w-full rounded-xl border bg-page-alt px-4 py-3 text-[15px] font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-muted/70 focus:border-brand/60 focus:bg-surface";

const Field = ({ label, error, children, hint }) => (
  <label className="block">
    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">{label}</span>
    {children}
    {error ? (
      <span className="mt-1.5 block text-xs font-semibold text-red-500">{error}</span>
    ) : hint ? (
      <span className="mt-1.5 block text-xs text-muted">{hint}</span>
    ) : null}
  </label>
);

/* the dark card, live while typing */
const CardFace = ({ number, name, expiry, brand, last4, small = false }) => {
  const display = last4
    ? `•••• •••• •••• ${last4}`
    : (() => {
        const raw = digits(number).padEnd(numberLen(brand), "•").slice(0, numberLen(brand));
        return brand === "amex"
          ? [raw.slice(0, 4), raw.slice(4, 10), raw.slice(10)].join(" ")
          : raw.replace(/(.{4})/g, "$1 ").trim();
      })();
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b2e33] to-[#0d0e10] text-white shadow-[0_22px_40px_-18px_rgba(0,0,0,0.6)] ${small ? "p-4" : "p-5"}`}
      style={{ aspectRatio: "1.586 / 1", maxWidth: 360 }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-start justify-between">
        <span className="h-[26px] w-9 rounded-md bg-gradient-to-br from-[#e8c985] to-[#b88f3c]" />
        <span className="text-xs font-black italic tracking-wider text-white/90">{brand === "card" ? "" : BRAND_LABEL[brand]}</span>
      </div>
      <p className="mt-5 font-mono text-[clamp(13px,4.2vw,18px)] tracking-[0.12em] text-white/95">{display}</p>
      <div className="mt-4 flex items-end justify-between gap-3 text-[10px] leading-tight">
        <div className="min-w-0">
          <p className="text-white/45">Cardholder</p>
          <p className="max-w-[190px] truncate text-xs font-semibold uppercase tracking-wide">{name || "YOUR NAME"}</p>
        </div>
        <div className="text-right">
          <p className="text-white/45">Expires</p>
          <p className="text-xs font-semibold">{expiry || "MM/YY"}</p>
        </div>
      </div>
    </div>
  );
};

/* one hidden input, N visible boxes (verification code or PIN) */
const CodeBoxes = ({ length, value, onChange, mask = false, error = false, autoFocus = true }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={error ? "err" : "ok"}
      animate={error && !reduce ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mx-auto w-fit"
      onClick={() => ref.current?.focus()}
    >
      <div className="flex gap-2">
        {Array.from({ length }).map((_, i) => {
          const active = i === value.length;
          return (
            <div
              key={i}
              className={`grid h-12 w-10 place-items-center rounded-xl border text-xl font-black text-ink transition sm:h-14 sm:w-12 ${
                error ? "border-red-400 bg-red-500/5" : active ? "border-brand bg-surface ring-2 ring-brand/25" : "border-line bg-page-alt"
              }`}
            >
              {value[i] ? (mask ? "•" : value[i]) : active ? <span className="h-5 w-px animate-pulse bg-brand" /> : ""}
            </div>
          );
        })}
      </div>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(digits(e.target.value).slice(0, length))}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={mask ? "PIN" : "Verification code"}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </motion.div>
  );
};

/* a text message that slides in with the demo code */
const SmsBanner = ({ from, code, onFill }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [code]);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          key={code}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          onClick={onFill}
          className="mx-auto mt-5 flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-3 text-left shadow-card"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white"><FiSmartphone /></span>
          <span className="min-w-0 flex-1">
            <span className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted">
              <span>{from}</span><span>now</span>
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-ink">
              Your verification code is <b className="font-mono tracking-wider">{code}</b>. Do not share it with anyone.
            </span>
            <span className="mt-1 block text-[11px] font-bold text-brand-ink">Tap to autofill · demo message</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const Primary = ({ children, color, className = "", ...p }) => (
  <button
    type="button"
    {...p}
    style={color ? { background: color } : undefined}
    className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${color ? "" : "bg-btn"} ${className}`}
  >
    {children}
  </button>
);

const Ghost = ({ children, className = "", ...p }) => (
  <button type="button" {...p} className={`text-xs font-bold text-muted transition hover:text-ink ${className}`}>
    {children}
  </button>
);

/* the three progress lines while the "bank" works */
const Processing = ({ steps, run, onDone, onFail, color }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    let alive = true;
    const tick = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 900);
    (async () => {
      try {
        const [res] = await Promise.all([run(), sleep(steps.length * 900 + 200)]);
        if (alive) onDone(res);
      } catch (e) {
        if (alive) onFail(e);
      }
    })();
    return () => {
      alive = false;
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="py-6 text-center">
      <div className="relative mx-auto h-16 w-16">
        <span className="absolute inset-0 rounded-full border-4 border-line" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent" style={{ borderTopColor: color }} />
        <FiLock className="absolute inset-0 m-auto text-muted" size={20} />
      </div>
      <h3 className="mt-5 text-lg font-black text-ink" style={serif}>Processing payment</h3>
      <p className="mt-1 text-sm text-muted">Please keep this window open. Do not press back or refresh.</p>
      <ul className="mx-auto mt-6 max-w-xs space-y-3 text-left">
        {steps.map((s, n) => (
          <li key={s} className={`flex items-center gap-3 text-sm font-semibold transition ${n <= i ? "text-ink" : "text-muted/50"}`}>
            <span className="grid h-6 w-6 place-items-center rounded-full border border-line">
              {n < i ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white"><FiCheck size={13} strokeWidth={3} /></motion.span>
              ) : n === i ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-line border-t-brand" />
              ) : null}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Success = ({ amount, method, receipt, bookingName, onDone, onInvoice }) => (
  <div className="py-2 text-center">
    <motion.span
      initial={{ scale: 0, rotate: -40 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 14 }}
      className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full ring-4 ring-emerald-400/50"
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: 1.2, repeat: 1 }}
      />
      <FiCheck size={38} strokeWidth={3} />
    </motion.span>
    <h3 className="mt-5 text-2xl font-black text-ink" style={serif}>Payment successful</h3>
    <p className="mt-1 text-sm text-muted">Your payment for {bookingName} has been received.</p>
    <p className="mt-4 text-4xl font-black text-emerald-600" style={serif}>{money(amount)}</p>

    <dl className="mx-auto mt-5 max-w-sm divide-y divide-line rounded-2xl border border-line bg-page-alt text-left text-sm">
      {[
        ["Paid with", receipt.label],
        ["Transaction ID", receipt.ref],
        ["Date", fmtDateTime(receipt.at)],
        ["Status", "Completed"],
      ].map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <dt className="text-muted">{k}</dt>
          <dd className={`text-right font-bold text-ink ${k === "Transaction ID" ? "font-mono text-xs" : ""}`}>{v}</dd>
        </div>
      ))}
    </dl>

    <div className="mt-6 grid grid-cols-2 gap-3">
      <button type="button" onClick={onInvoice} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-bold text-ink transition hover:border-brand/50">
        <FiFileText /> Invoice
      </button>
      <Primary onClick={onDone}>Done</Primary>
    </div>
    <p className="mt-3 text-[11px] text-muted">{method} · demo payment, no real money was charged.</p>
  </div>
);

const Failure = ({ message, onRetry, onClose }) => (
  <div className="py-4 text-center">
    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-500">
      <FiAlertCircle size={30} />
    </motion.span>
    <h3 className="mt-4 text-xl font-black text-ink" style={serif}>Payment failed</h3>
    <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{message || "Something went wrong. You were not charged."}</p>
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button type="button" onClick={onClose} className="h-12 rounded-2xl border border-line bg-surface text-sm font-bold text-ink hover:border-brand/50">Close</button>
      <Primary onClick={onRetry}><FiRefreshCw /> Try again</Primary>
    </div>
  </div>
);

/* ─────────────── the checkout itself ─────────────── */
const Checkout = ({ amount, method, booking, user, onConfirm, onClose, onInvoice }) => {
  const isCard = method === "Card";
  const wallet = WALLET[method];
  const color = isCard ? "#0F5C46" : wallet.color;
  const isBank = method === "Bank";
  const firstStep = isBank ? "bank" : "mobile";
  const holder = holderName(user); // the Google account name by default

  const saved = useMemo(() => loadCard(user?.uid), [user?.uid]);
  const [card, setCard] = useState(saved);
  const [step, setStep] = useState(isCard ? (saved ? "saved" : "empty") : firstStep);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  // card form
  const [num, setNum] = useState("");
  const [name, setName] = useState(holder);
  const nameEdited = useRef(false);
  // the Google profile can arrive a moment after the modal opens: keep the name in step until the customer types their own
  useEffect(() => {
    if (!nameEdited.current) setName(holder);
  }, [holder]);
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const brand = brandOf(num);

  // wallet
  const [phone, setPhone] = useState(() => (phoneOk(booking?.phoneNumber) ? digits(booking.phoneNumber) : ""));
  const [agree, setAgree] = useState(true);
  // bank
  const [bank, setBank] = useState("");
  const [acct, setAcct] = useState("");
  const [pin, setPin] = useState("");

  // code
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState(randomOtp);
  const [codeErr, setCodeErr] = useState(false);
  const [wait, setWait] = useState(30);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (step !== "otp") return undefined;
    setWait(30);
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, [step, otp]);

  const fillTest = () => {
    const t = randomTestCard(holder || "TEST USER");
    setNum(t.number);
    setName(t.name);
    setExp(t.expiry);
    setCvc(t.cvc);
    setTouched(false);
  };

  const errs = useMemo(() => {
    const e = {};
    const n = digits(num);
    if (n.length !== numberLen(brand) || !luhnOk(n)) e.num = "Enter a valid card number";
    if (name.trim().length < 3) e.name = "Enter the name on the card";
    if (!expiryOk(exp)) e.exp = "Enter a valid expiry";
    if (digits(cvc).length !== cvcLen(brand)) e.cvc = `${cvcLen(brand)} digits`;
    return e;
  }, [num, name, exp, cvc, brand]);

  const from = useRef("form");
  const goOtp = (m, origin = "form") => {
    from.current = origin;
    setMeta(m);
    setCode("");
    setCodeErr(false);
    setOtp(randomOtp());
    setStep("otp");
  };

  const payForm = () => {
    setTouched(true);
    if (Object.keys(errs).length) return;
    const last4 = digits(num).slice(-4);
    const c = { brand, last4, name: name.trim(), exp };
    if (remember) {
      saveCard(user?.uid, c);
      setCard(c);
    }
    goOtp({ brand, last4, label: `${BRAND_LABEL[brand]} •••• ${last4}`, prefix: "CH" });
  };

  const paySaved = () => {
    setTouched(true);
    if (digits(cvc).length !== cvcLen(card.brand)) return;
    goOtp({ brand: card.brand, last4: card.last4, label: `${BRAND_LABEL[card.brand]} •••• ${card.last4}`, prefix: "CH" }, "saved");
  };

  const payBankStart = () => {
    setTouched(true);
    if (!bank || !accountOk(acct) || !agree) return;
    goOtp({ account: maskAccount(acct), label: `${bank} ${maskAccount(acct)}`, prefix: wallet.prefix });
  };

  const payWalletStart = () => {
    setTouched(true);
    if (!phoneOk(phone) || !agree) return;
    goOtp({ account: maskPhone(phone), label: `${method} ${maskPhone(phone)}`, prefix: wallet.prefix });
  };

  const verify = useCallback(() => {
    if (code !== otp) {
      setCodeErr(true);
      setTimeout(() => setCodeErr(false), 700);
      return;
    }
    if (isCard) setStep("processing");
    else {
      setPin("");
      setStep("pin");
    }
  }, [code, otp, isCard]);

  // auto-verify once all six digits are in
  useEffect(() => {
    if (step === "otp" && code.length === 6) {
      const t = setTimeout(verify, 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [code, step, verify]);

  const run = useCallback(async () => {
    const ref = randomRef(meta.prefix);
    await onConfirm({ method, ref, brand: meta.brand, last4: meta.last4, account: meta.account });
    return { ref, label: meta.label, at: new Date().toISOString() };
  }, [meta, method, onConfirm]);

  const retry = () => {
    setError("");
    setStep(isCard ? (card ? "saved" : "form") : firstStep);
  };

  const steps = isCard
    ? ["Securing connection", "Authorising with your bank", "Confirming payment"]
    : isBank
      ? ["Connecting to your bank", "Verifying your banking PIN", "Confirming payment"]
      : [`Connecting to ${method}`, "Verifying your PIN", "Confirming payment"];

  const phase = { empty: 0, saved: 0, form: 0, mobile: 0, bank: 0, otp: 1, pin: 2, processing: 3, success: 3, error: 3 }[step];
  const canBack = ["form", "otp", "pin"].includes(step);
  const back = () => {
    if (step === "form") setStep(card ? "saved" : "empty");
    else if (step === "otp") setStep(isCard ? (from.current === "saved" ? "saved" : "form") : firstStep);
    else if (step === "pin") setStep("otp");
  };
  const busy = step === "processing";
  const reduce = useReducedMotion();

  useEffect(() => {
    const h = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [busy, onClose]);

  const view = (key, children) => (
    <motion.div
      key={key}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !busy && onClose()}
        className="absolute inset-0 bg-scrim/70 backdrop-blur-md"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Secure payment"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="relative flex max-h-[94vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
      >
        {/* header */}
        <div className="relative shrink-0 px-6 pb-5 pt-5 text-white" style={{ background: isCard ? CARD_GRAD : wallet.grad }}>
          <span aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/75">
                {isCard ? <FiCreditCard /> : isBank ? <FiShield /> : <FiSmartphone />} {isCard ? "Card payment" : isBank ? "Bank payment" : `${method} payment`}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-white/90">Sababa Tours · {booking?.serviceName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!isCard && <PayLogo method={method} size="md" />}
              {!busy && step !== "success" && (
                <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25">
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>
          <div className="relative mt-3 flex items-end justify-between">
            <p className="text-3xl font-black leading-none whitespace-nowrap sm:text-4xl" style={serif}>{money(amount)}</p>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">
              <FiShield size={11} /> Secure checkout
            </span>
          </div>
          {/* progress */}
          <div className="relative mt-4 flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((n) => (
              <span key={n} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <motion.span className="block h-full rounded-full bg-white" initial={false} animate={{ width: phase > n || phase === 3 ? "100%" : phase === n ? "45%" : "0%" }} transition={{ duration: 0.5 }} />
              </span>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {canBack && (
            <button type="button" onClick={back} className="mb-4 -mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink">
              <FiArrowLeft /> Back
            </button>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {step === "empty" &&
              view("empty",
                <AddCard
                  holder={(holder || "Your name").toUpperCase()}
                  title="Add a card to pay"
                  text="Your card is tied to your account. Add one to pay for this booking in a few taps."
                  note="Encrypted end to end. This is a demo: use the test card button."
                  onAdd={() => setStep("form")}
                  className="!max-w-none !border-0 !bg-transparent !p-0 !shadow-none"
                />,
              )}

            {step === "saved" && card &&
              view("saved",
                <div>
                  <CardFace brand={card.brand} last4={card.last4} name={card.name} expiry={card.exp} />
                  <div className="mt-5 grid grid-cols-[1fr_120px] items-end gap-3">
                    <p className="text-sm text-muted">Saved card for <b className="text-ink">{card.name}</b>. Enter the security code to pay.</p>
                    <Field label="CVC" error={touched && digits(cvc).length !== cvcLen(card.brand) ? `${cvcLen(card.brand)} digits` : ""}>
                      <input
                        value={cvc}
                        onChange={(e) => setCvc(digits(e.target.value).slice(0, cvcLen(card.brand)))}
                        inputMode="numeric"
                        placeholder={"•".repeat(cvcLen(card.brand))}
                        autoComplete="cc-csc"
                        className={`${inputCls} text-center tracking-[0.3em] ${touched && digits(cvc).length !== cvcLen(card.brand) ? "border-red-400" : "border-line"}`}
                      />
                    </Field>
                  </div>
                  <Primary color={color} className="mt-6" onClick={paySaved}><FiLock size={15} /> Pay {money(amount)}</Primary>
                  <div className="mt-4 flex items-center justify-between">
                    <Ghost onClick={() => { setCvc(""); setNum(""); setExp(""); setTouched(false); setStep("form"); }}>Use a different card</Ghost>
                    <Ghost
                      className="inline-flex items-center gap-1 hover:!text-red-500"
                      onClick={() => { clearCard(user?.uid); setCard(null); setCvc(""); setStep("empty"); }}
                    >
                      <FiTrash2 size={12} /> Remove card
                    </Ghost>
                  </div>
                </div>,
              )}

            {step === "form" &&
              view("form",
                <div>
                  <CardFace number={num} brand={brand} name={name} expiry={exp} />
                  <button
                    type="button"
                    onClick={fillTest}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/60 bg-brand-soft/40 py-2.5 text-xs font-black uppercase tracking-widest text-brand-ink transition hover:bg-brand-soft/70"
                  >
                    <FiZap size={14} /> Use test card (random)
                  </button>
                  <div className="mt-4 space-y-3.5">
                    <Field label="Card number" error={touched && errs.num}>
                      <input
                        value={num}
                        onChange={(e) => setNum(formatNumber(e.target.value))}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="1234 5678 9012 3456"
                        className={`${inputCls} font-mono tracking-wider ${touched && errs.num ? "border-red-400" : "border-line"}`}
                      />
                    </Field>
                    <Field label="Name on card" error={touched && errs.name}>
                      <input
                        value={name}
                        onChange={(e) => { nameEdited.current = true; setName(e.target.value.replace(/[^a-zA-Z .'-]/g, "").slice(0, 26)); }}
                        autoComplete="cc-name"
                        placeholder="As printed on the card"
                        className={`${inputCls} uppercase ${touched && errs.name ? "border-red-400" : "border-line"}`}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Expiry" error={touched && errs.exp}>
                        <input
                          value={exp}
                          onChange={(e) => setExp(formatExpiry(e.target.value))}
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/YY"
                          className={`${inputCls} ${touched && errs.exp ? "border-red-400" : "border-line"}`}
                        />
                      </Field>
                      <Field label="CVC" error={touched && errs.cvc}>
                        <input
                          value={cvc}
                          onChange={(e) => setCvc(digits(e.target.value).slice(0, cvcLen(brand)))}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          placeholder={"•".repeat(cvcLen(brand))}
                          className={`${inputCls} tracking-[0.3em] ${touched && errs.cvc ? "border-red-400" : "border-line"}`}
                        />
                      </Field>
                    </div>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-muted">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" />
                    Save this card to my account for next time
                  </label>
                  <Primary color={color} className="mt-5" onClick={payForm}><FiLock size={15} /> Pay {money(amount)}</Primary>
                </div>,
              )}

            {step === "bank" &&
              view("bank",
                <div>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-page-alt p-4">
                    <PayLogo method="Bank" size="lg" />
                    <div className="min-w-0">
                      <p className="font-black text-ink" style={serif}>Bank payment</p>
                      <p className="text-xs text-muted">Pay from your bank account to <b className="text-ink">Sababa Tours</b></p>
                    </div>
                  </div>
                  <Field label="Select your bank" error={touched && !bank ? "Choose your bank" : ""}>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {BANKS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBank(n)}
                          aria-pressed={bank === n}
                          className={`truncate rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${bank === n ? "border-brand bg-brand-soft/60 text-brand-ink ring-2 ring-brand/25" : "border-line bg-page-alt text-muted hover:text-ink"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="mt-4 space-y-3.5">
                    <Field label="Account holder" hint="Taken from your Google account">
                      <input value={holder.toUpperCase()} readOnly tabIndex={-1} className={`${inputCls} cursor-default uppercase opacity-80`} />
                    </Field>
                    <Field label="Account number" error={touched && !accountOk(acct) ? "Enter a valid account number (10 to 16 digits)" : ""}>
                      <input
                        value={acct}
                        onChange={(e) => setAcct(digits(e.target.value).slice(0, 16))}
                        inputMode="numeric"
                        placeholder="Your bank account number"
                        className={`${inputCls} font-mono tracking-wider ${touched && !accountOk(acct) ? "border-red-400" : "border-line"}`}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setBank((b) => b || BANKS[0]); setAcct(randomAccount()); }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-ink hover:underline"
                  >
                    <FiZap size={12} /> Fill demo account
                  </button>
                  <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-muted">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />
                    I agree to the terms and the bank payment conditions.
                  </label>
                  <Primary color={color} className="mt-5" disabled={!agree} onClick={payBankStart}>Continue</Primary>
                </div>,
              )}

            {step === "mobile" &&
              view("mobile",
                <div>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-page-alt p-4">
                    <PayLogo method={method} size="lg" />
                    <div>
                      <p className="font-black text-ink" style={serif}>{method}</p>
                      <p className="text-xs text-muted">Pay from your {method} account to <b className="text-ink">Sababa Tours</b></p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Field label={`Your ${method} account number`} error={touched && !phoneOk(phone) ? "Enter a valid number, e.g. 01XXXXXXXXX" : ""}>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(digits(e.target.value).slice(0, 11))}
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="01XXXXXXXXX"
                        className={`${inputCls} font-mono tracking-wider ${touched && !phoneOk(phone) ? "border-red-400" : "border-line"}`}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhone(randomPhone())}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-ink hover:underline"
                  >
                    <FiZap size={12} /> Fill demo number
                  </button>
                  <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-muted">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />
                    I agree to the terms and the {method} payment conditions.
                  </label>
                  <Primary color={color} className="mt-5" disabled={!agree} onClick={payWalletStart}>Continue</Primary>
                </div>,
              )}

            {step === "otp" &&
              view("otp",
                <div className="text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft/60 text-brand-ink"><FiShield size={26} /></span>
                  <h3 className="mt-4 text-xl font-black text-ink" style={serif}>{isCard ? "Verify with your bank" : isBank ? "Verify with your bank" : "Enter verification code"}</h3>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                    {isCard
                      ? `Your bank sent a 6-digit code to the phone linked to the card ending ${meta?.last4}.`
                      : isBank
                        ? `${bank} sent a 6-digit code by SMS to the phone linked to account ${maskAccount(acct)}.`
                        : `We sent a 6-digit code by SMS to ${maskPhone(phone)}.`}
                  </p>
                  <div className="mt-6">
                    <CodeBoxes length={6} value={code} onChange={setCode} error={codeErr} />
                  </div>
                  {codeErr && <p className="mt-3 text-xs font-semibold text-red-500">That code is not right. Check the message and try again.</p>}
                  <SmsBanner from={isCard ? "Bank OTP" : isBank ? bank : WALLET[method].sms} code={otp} onFill={() => setCode(otp)} />
                  <Primary color={color} className="mt-6" disabled={code.length !== 6} onClick={verify}>Verify</Primary>
                  <div className="mt-4 text-xs text-muted">
                    {wait > 0 ? (
                      <>Resend code in <b className="text-ink">0:{String(wait).padStart(2, "0")}</b></>
                    ) : (
                      <Ghost onClick={() => { setOtp(randomOtp()); setCode(""); }}>Resend code</Ghost>
                    )}
                  </div>
                </div>,
              )}

            {step === "pin" &&
              view("pin",
                <div className="text-center">
                  <PayLogo method={method} size="lg" className="mx-auto" />
                  <h3 className="mt-4 text-xl font-black text-ink" style={serif}>{isBank ? "Enter your banking PIN" : `Enter your ${method} PIN`}</h3>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                    Confirm the payment of <b className="text-ink">{money(amount)}</b> from {isBank ? `${bank} ${maskAccount(acct)}` : maskPhone(phone)}.
                  </p>
                  <div className="mt-6">
                    <CodeBoxes length={wallet.pin} value={pin} onChange={setPin} mask />
                  </div>
                  <p className="mt-3 text-[11px] text-muted">Demo: any {wallet.pin}-digit PIN works.</p>
                  <Primary color={color} className="mt-6" disabled={pin.length !== wallet.pin} onClick={() => setStep("processing")}>
                    Confirm {money(amount)}
                  </Primary>
                </div>,
              )}

            {step === "processing" &&
              view("processing",
                <Processing
                  steps={steps}
                  color={color}
                  run={run}
                  onDone={(r) => { setReceipt(r); setStep("success"); }}
                  onFail={(e) => { setError(e?.message || ""); setStep("error"); }}
                />,
              )}

            {step === "success" && receipt &&
              view("success",
                <Success amount={amount} method={method} receipt={receipt} bookingName={booking?.serviceName} onDone={onClose} onInvoice={() => onInvoice(onClose)} />,
              )}

            {step === "error" && view("error", <Failure message={error} onRetry={retry} onClose={onClose} />)}
          </AnimatePresence>
        </div>

        {/* footer */}
        {step !== "success" && (
          <div className="shrink-0 border-t border-line bg-page-alt px-6 py-3 text-center text-[11px] text-muted">
            <FiLock className="mr-1 inline -mt-0.5" size={11} /> 256-bit encrypted · Demo checkout, no real money is charged
          </div>
        )}
      </motion.div>
    </div>
  );
};

const PayModal = ({ open, ...props }) => {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  return createPortal(
    <AnimatePresence>{open && <Checkout key={`${props.method}-${props.amount}`} {...props} />}</AnimatePresence>,
    document.body,
  );
};

export default PayModal;
