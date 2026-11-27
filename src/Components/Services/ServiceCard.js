// src/Components/Services/ServiceCard.js
import { Link } from "react-router-dom";
import { TiltCard } from "../ui/Motion";
import { FiArrowRight, FiClock, FiMapPin, FiStar } from "react-icons/fi";

const ServiceCard = ({ service, dark = false }) => {
  const { name, balance, picture, about, id } = service;

  return (
    <TiltCard max={5}
      className={`
      group relative rounded-[28px] overflow-hidden
      border transition-all duration-500 card-premium
      ${
        dark
          ? "bg-white/6 border-white/10 hover:border-[#c9a84c]/30 hover:bg-white/9"
          : "bg-surface border-line hover:border-[#c9a84c]/30 hover:shadow-2xl"
      }
    `}
    >
      {/* Image */}
      <Link to={`/booking/${id}`} className="block relative">
        <div className="relative aspect-[4/3] img-zoom overflow-hidden">
          <img
            src={picture}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Badges */}
          <span className="absolute top-5 left-5 glass text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
            Curated Tour
          </span>

          {/* Rating */}
          <div className="absolute bottom-5 right-5 flex items-center gap-1 bg-surface/95 backdrop-blur px-3 py-1.5 rounded-full">
            <FiStar className="text-[#c9a84c] h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-black text-ink">4.9</span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-7">
        <div className="flex items-start justify-between gap-3 mb-5">
          <h3
            className={`
            text-xl font-black leading-tight line-clamp-2 flex-1
            ${dark ? "text-white" : "text-ink"}
          `}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {name}
          </h3>
          <p
            className="text-2xl font-black text-coral shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {balance}
          </p>
        </div>

        <p
          className={`text-sm leading-relaxed line-clamp-2 mb-6 ${dark ? "text-white/55" : "text-muted"}`}
        >
          {about}
        </p>

        <div
          className={`flex items-center gap-5 text-xs mb-7 ${dark ? "text-white/40" : "text-muted"}`}
        >
          <span className="flex items-center gap-1.5">
            <FiClock className="text-lagoon-ink" /> Flexible
          </span>
          <span className="flex items-center gap-1.5">
            <FiMapPin className="text-lagoon-ink" /> Guided
          </span>
        </div>

        <Link
          to={`/booking/${id}`}
          className={`
            group/btn block w-full text-center py-4 font-black uppercase tracking-widest text-xs
            rounded-2xl transition-all duration-300 active:scale-95 btn-glow
            ${
              dark
                ? "bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] text-navy hover:shadow-lg hover:shadow-[#c9a84c]/20"
                : "bg-btn text-white hover:bg-lagoon"
            }
          `}
        >
          View Details
          <FiArrowRight className="inline ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Hover corner accent */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#c9a84c]/6 to-transparent rounded-tl-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </TiltCard>
  );
};

export default ServiceCard;
