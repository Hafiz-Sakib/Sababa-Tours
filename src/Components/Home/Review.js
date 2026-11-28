// src/Components/Home/Review.js
// Traveler reviews as cards in a Motion Brew-style Tilt carousel. Shown on the About page.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiStar } from "react-icons/fi";
import { FaQuoteRight } from "react-icons/fa";
import nadiaImg from "../../assets/Review/nadia.png";
import sabnamImg from "../../assets/Review/sabnam.jpg";
import sakibImg from "../../assets/Review/sakib.png";
import TiltCarousel from "../ui/brew/TiltCarousel";
import { Reveal } from "../ui/Motion";

export const reviews = [
  {
    name: "Nadia Rahman",
    group: "Families & couples",
    role: "Family Traveler",
    text: "Sababa made our Cox's Bazar and Bandarban itinerary feel effortless. Every transfer, stay, and guide was exactly as promised.",
    avatar: nadiaImg,
    rating: 5,
  },
  {
    name: "Sabnam Chowdhury",
    group: "Teams & corporate",
    role: "Corporate Retreat Lead",
    text: "The planning was polished and practical. Our team retreat had the right balance of adventure, comfort, and downtime.",
    avatar: sabnamImg,
    rating: 5,
  },
  {
    name: "Sakib",
    group: "Solo & weekend",
    role: "Solo Explorer",
    text: "I wanted local insight without stress. The team handled every detail and still gave me space to explore at my own pace.",
    avatar: sakibImg,
    rating: 4.5,
  },
  {
    name: "Tanvir Hasan",
    group: "Adventure & nature",
    role: "Adventure Traveler",
    text: "The entire trip felt smooth and well-organized. From transport to local guides, everything was handled perfectly while still giving us freedom to enjoy the journey.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
  },
  {
    name: "Nusrat Jahan",
    group: "Families & couples",
    role: "Family Vacationer",
    text: "Traveling with kids can be stressful, but this experience was incredibly comfortable and enjoyable. The accommodations and support exceeded our expectations.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
  },
  {
    name: "Mehedi Rahman",
    group: "Adventure & nature",
    role: "Nature Enthusiast",
    text: "I loved discovering hidden spots and scenic locations that I would never have found on my own. The trip felt authentic and unforgettable.",
    avatar: "https://randomuser.me/api/portraits/men/51.jpg",
    rating: 4,
  },
  {
    name: "Farzana Akter",
    group: "Families & couples",
    role: "Couple Traveler",
    text: "Our honeymoon tour was beautifully arranged with amazing attention to detail. Every destination felt special and relaxing.",
    avatar: "https://randomuser.me/api/portraits/women/57.jpg",
    rating: 5,
  },
  {
    name: "Rakib Chowdhury",
    group: "Solo & weekend",
    role: "Weekend Explorer",
    text: "Perfect short getaway! The itinerary was balanced, the local food recommendations were excellent, and the overall experience was worth every moment.",
    avatar: "https://randomuser.me/api/portraits/men/73.jpg",
    rating: 4,
  },
];

export const averageRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

/* a star that can be filled partly (4.5 stars) */
const Star = ({ fraction }) => (
  <span className="relative block h-4 w-4">
    <FiStar className="absolute inset-0 h-4 w-4 fill-line text-line" strokeWidth={1.5} />
    <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
      <FiStar className="h-4 w-4 fill-accent text-accent" strokeWidth={1.5} />
    </span>
  </span>
);

const Stars = ({ rating }) => (
  <span className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Star key={i} fraction={Math.max(0, Math.min(1, rating - i))} />
    ))}
  </span>
);

/* one review card: the reviewer's photo sits big at the top */
const ReviewCard = ({ r, active }) => (
  <article
    className={`relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border bg-surface p-5 shadow-card transition-colors duration-500 ${
      active ? "border-brand/40" : "border-line"
    }`}
  >
    <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand via-accent-lt to-accent" />
    <div className="mt-1.5 flex items-center gap-4">
      <img
        src={r.avatar}
        alt={r.name}
        draggable={false}
        data-keep
        className="h-[88px] w-[88px] shrink-0 rounded-[26px] object-cover shadow-[0_10px_24px_-10px_rgba(16,24,40,0.45)] ring-[3px] ring-brand/30"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-black leading-tight text-ink">{r.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">{r.role}</p>
        <div className="mt-2.5">
          <Stars rating={r.rating} />
        </div>
      </div>
    </div>
    <p className="mt-5 flex-1 overflow-hidden text-[15px] leading-relaxed text-ink/85">“{r.text}”</p>
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
      <span className="rounded-full bg-sandy px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-ink">{r.group}</span>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand-ink" aria-hidden>
        <FaQuoteRight className="text-[11px]" />
      </span>
    </div>
  </article>
);

/* slightly smaller cards on very narrow phones */
const cardSize = () => (typeof window !== "undefined" && window.innerWidth < 400 ? { w: 250, h: 450 } : { w: 300, h: 410 });
const useCardSize = () => {
  const [size, setSize] = useState(cardSize);
  useEffect(() => {
    const on = () => setSize(cardSize());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return size;
};

const Review = () => {
  const size = useCardSize();
  return (
    <section className="relative overflow-hidden bg-sandy py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-brand-ink">Traveler Stories</p>
            <h2 className="text-4xl font-black leading-tight text-ink md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Trusted by guests who value thoughtful planning.
            </h2>
            <div className="mt-7 inline-flex items-center gap-4 rounded-full border border-line bg-surface px-5 py-3 shadow-card">
              <span className="text-3xl font-black text-ink" style={{ fontFamily: "var(--font-display)" }}>
                {averageRating.toFixed(1)}
              </span>
              <Stars rating={averageRating} />
              <span className="h-6 w-px bg-line" />
              <span className="text-sm font-semibold text-muted">{reviews.length} traveler reviews</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10">
            <TiltCarousel
              items={reviews}
              cardWidth={size.w}
              cardHeight={size.h}
              tilt={24}
              perspective={980}
              label="Traveler reviews"
              renderItem={(r, i, { active }) => <ReviewCard r={r} active={active} />}
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted">Drag, tap a side card or use the ← → keys</p>
        </Reveal>

        <div className="mt-8 text-center">
          <Link to="/meet-us#talk" className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
            Plan your own trip <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Review;
