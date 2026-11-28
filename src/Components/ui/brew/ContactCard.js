// src/Components/ui/brew/ContactCard.js
// Inspired by Motion Brew's "Contact card" (https://motion-brew.com/components/contact-card, MIT © 2026 Md Eftakher).
// Not just a Contact button: an inline link that opens a small card with the desk's email (tap to copy) and a
// link to the message form. Closes on outside click or Esc.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FiArrowRight, FiCheck, FiCopy, FiMail } from "react-icons/fi";
import { GLIDE } from "./util";

export default function ContactCard({ label = "Ask the travel desk", email, to = "/meet-us#talk", title = "Travel desk", note = "We reply within 24 hours." }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const away = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the mailto link below still works */
    }
  };

  return (
    <span ref={box} className="relative inline-block">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 font-bold text-brand-ink underline decoration-brand/40 decoration-2 underline-offset-4 transition hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={title}
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.3, ease: GLIDE }}
            style={{ transformOrigin: "0% 0%" }}
            className="absolute left-0 top-full z-30 mt-3 w-72 rounded-3xl border border-line bg-surface p-5 text-left text-ink shadow-dock"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand-ink">
                <FiMail />
              </span>
              <div>
                <p className="text-sm font-black">{title}</p>
                <p className="text-xs text-muted">{note}</p>
              </div>
            </div>
            <button type="button" onClick={copy} className="mt-4 flex w-full items-center justify-between rounded-xl bg-sandy px-4 py-3 text-sm font-semibold transition hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <span className="truncate">{email}</span>
              {copied ? <FiCheck className="shrink-0 text-brand-ink" /> : <FiCopy className="shrink-0 text-muted" />}
            </button>
            <Link to={to} onClick={() => setOpen(false)} className="mt-3 flex items-center justify-between rounded-xl bg-btn px-4 py-3 text-sm font-bold text-white transition hover:bg-brand">
              Send a message <FiArrowRight />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
