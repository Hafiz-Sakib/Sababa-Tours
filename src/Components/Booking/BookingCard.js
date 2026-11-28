// src/Components/Booking/BookingCard.js
import { Link } from "react-router-dom";
import { FiStar, FiArrowRight, FiMapPin } from "react-icons/fi";

const BookingCard = ({ service }) => {
  const { name, balance, picture, id } = service;

  return (
    <div className="group bg-surface rounded-[28px] overflow-hidden border border-line hover:border-accent/30 hover:shadow-2xl hover:shadow-deep/8 transition-all duration-500 hover:-translate-y-2 card-premium">
      {/* Image */}
      <div className="relative aspect-[16/10] img-zoom overflow-hidden">
        <img src={picture} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/65 via-scrim/15 to-transparent" />

        {/* Rating badge */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-on/95 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          <FiStar className="text-accent h-3.5 w-3.5 fill-current" />
          <span className="text-xs font-black text-deep">4.9</span>
        </div>

        {/* Location tag */}
        <div className="absolute bottom-5 left-5 flex items-center gap-2 glass text-on text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
          <FiMapPin size={11} className="text-accent" /> Bangladesh
        </div>
      </div>

      {/* Content */}
      <div className="p-7">
        <h3
          className="text-xl font-black leading-tight text-deep mb-3 line-clamp-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {name}
        </h3>

        <div className="flex items-center justify-between mt-5 pt-5 border-t border-line">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted font-bold">
              From
            </p>
            <p
              className="text-3xl font-black text-accent"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {balance}
            </p>
          </div>
          <Link
            to={`/booking/${id}`}
            className="
              group/btn inline-flex items-center gap-2 px-6 py-3
              bg-btn text-white text-[11px] font-black uppercase tracking-widest
              rounded-2xl hover:bg-brand transition-all duration-300
              hover:shadow-lg hover:shadow-brand/20 active:scale-95
            "
          >
            View Details
            <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
