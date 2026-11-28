// src/Components/Pages/MeetUs.js
// One page for the old About + Contact pages. A sliding switch in the hero flips between
// "Our Story" (who we are) and "Talk to Us" (enquiry form, channels, FAQ). The choice lives in
// the URL hash (#story / #talk) so it can be linked, bookmarked and shared.
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCompass, FiMessageCircle } from "react-icons/fi";
import { AnimatePresence, LayoutGroup, motion } from "../ui/Motion";
import { ScrollProgress } from "../ui/Motion";
import About from "./About";
import Contact from "./Contact";

const TABS = {
  story: {
    label: "Our Story",
    icon: FiCompass,
    eyebrow: "Meet Sababa Tours",
    title: "A travel agency built for calm, confident journeys.",
    text: "Refined, reliable trips with careful pacing, trusted local partners and hands-on support from first idea to final return.",
    img: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1600&q=85",
  },
  talk: {
    label: "Talk to Us",
    icon: FiMessageCircle,
    eyebrow: "Concierge Desk",
    title: "Tell us where you want to go.",
    text: "Share your vision and our travel desk will craft the perfect journey. We reply within 24 hours.",
    img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=85",
  },
};

const MeetUs = () => {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const bodyRef = useRef(null);
  const first = useRef(true);
  const active = hash === "#talk" ? "talk" : "story";
  const t = TABS[active];

  const go = (id) => {
    if (id !== active) navigate({ pathname: "/meet-us", hash: id }, { replace: true });
  };

  /* after switching, bring the new content into view (not on first load) */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = bodyRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    document.title = `${t.label} · Sababa Tours`;
  }, [t.label]);

  return (
    <main className="min-h-screen bg-sandy pt-[76px] text-ink">
      <ScrollProgress />

      {/* ── Hero with the story / talk switch ── */}
      <section className="relative overflow-hidden bg-panel text-on noise">
        <AnimatePresence mode="sync">
          <motion.img
            key={t.img}
            src={t.img}
            alt=""
            aria-hidden
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 0.45, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-scrim/95 via-scrim/80 to-scrim/55" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(38,165,158,0.15)_0%,transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-10 md:pt-24 md:pb-28">
          <LayoutGroup id="meet-switch">
            <div role="tablist" aria-label="Meet Us sections" className="inline-flex rounded-full bg-surface/90 p-1 shadow-lg ring-1 ring-ink/[.08] backdrop-blur-xl">
              {Object.entries(TABS).map(([id, tab]) => {
                const Icon = tab.icon;
                const on = id === active;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => go(id)}
                    className="relative rounded-full px-5 py-2.5 text-[13px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {on && (
                      <motion.span
                        layoutId="meet-pill"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-btn shadow-[0_6px_16px_-6px_rgb(var(--btn)/0.6)]"
                      />
                    )}
                    <span className={`relative flex items-center gap-2 transition-colors ${on ? "text-white" : "text-ink/60 hover:text-ink"}`}>
                      <Icon className="h-4 w-4" /> {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mt-10"
            >
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-accent-lt">{t.eyebrow}</p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tighter md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
                {t.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on/75">{t.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Body ── */}
      <div ref={bodyRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            role="tabpanel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {active === "story" ? <About /> : <div className="bg-page"><Contact /></div>}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};

export default MeetUs;
