// src/Components/NewsLetter.js
import { useEffect, useRef } from "react";
import { FiArrowRight, FiMail } from "react-icons/fi";

const NewsLetter = () => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-24 md:py-32 bg-panel relative overflow-hidden noise">
      {/* Background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(38,165,158,0.18)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(15,92,70,0.08)_0%,transparent_55%)]" />

      {/* Decorative ring */}
      <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-on/5 animate-spin-slow" />
      <div
        className="absolute -left-16 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-accent/6 animate-spin-slow"
        style={{ animationDirection: "reverse" }}
      />

      <div
        ref={ref}
        className="reveal relative max-w-2xl mx-auto px-6 text-center"
      >
        {/* Label */}
        <div className="divider-accent mb-6 max-w-xs mx-auto">
          <span className="text-accent text-[10px] font-bold tracking-[0.35em] uppercase whitespace-nowrap px-4">
            Stay Inspired
          </span>
        </div>

        <h2
          className="text-4xl md:text-5xl font-black text-on mb-6 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Weekly stories from
          <br />
          <em className="text-shimmer not-italic">the trails of Bangladesh</em>
        </h2>

        <p className="text-on/55 text-[17px] max-w-md mx-auto mb-10 leading-relaxed">
          Curated travel insights, hidden gems, responsible tourism tips, and
          seasonal recommendations.
        </p>

        {/* Input row */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-1 flex items-center gap-3 px-5 py-4 glass border-on/15 rounded-full focus-within:border-accent/50 transition-all duration-300">
            <FiMail className="text-accent shrink-0" />
            <input
              type="email"
              placeholder="Your email address"
              className="bg-transparent flex-1 outline-none text-on placeholder:text-on/35 text-sm"
            />
          </div>
          <button
            className="
            group px-8 py-4 bg-gradient-to-r from-cta to-accent-lt
            text-deep font-black uppercase tracking-widest text-xs
            rounded-full hover:shadow-xl hover:shadow-accent/25
            hover:scale-105 active:scale-95
            transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap btn-glow
          "
          >
            Subscribe
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <p className="text-on/25 text-xs mt-5">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default NewsLetter;
