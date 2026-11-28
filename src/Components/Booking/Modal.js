// src/Components/Booking/Modal.js
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiUsers,
  FiX,
} from "react-icons/fi";

const Modal = ({ closeModal, service, travelers, date, bookingId, total }) => {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "To be confirmed";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-scrim/85 backdrop-blur-xl p-4">
      <div
        className="relative w-full max-w-lg bg-surface rounded-[32px] shadow-[0_32px_80px_rgba(16,24,40,0.35)] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cta via-accent-lt to-brand" />

        {/* Close */}
        <button
          onClick={closeModal}
          className="absolute right-5 top-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-sandy text-muted hover:text-ink hover:bg-line transition-all duration-200"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        <div className="p-10 text-center">
          {/* Success icon */}
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-brand/10 border-2 border-brand/20 text-5xl text-brand-ink mb-8 animate-float">
            <FiCheckCircle />
          </div>

          <h2
            className="text-3xl font-black tracking-tight text-ink mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Booking Request Received
          </h2>
          <p className="text-muted leading-relaxed max-w-xs mx-auto text-sm">
            Thank you! Our travel desk will review availability and get back to
            you within 24 hours.
          </p>

          {/* Summary card */}
          <div className="mt-8 bg-sandy border border-line rounded-[20px] p-6 text-left">
            <p
              className="font-black text-ink mb-4 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {service?.name}
            </p>
            <div className="space-y-3">
              {[
                {
                  icon: <FiCalendar />,
                  label: "Preferred Date",
                  value: formattedDate,
                },
                {
                  icon: <FiUsers />,
                  label: "Travelers",
                  value: `${travelers} Traveler${travelers > 1 ? "s" : ""}`,
                },
                ...(total
                  ? [
                      {
                        icon: <FiCheckCircle />,
                        label: "Estimated Total",
                        value: `BDT ${Number(total).toLocaleString()}`,
                      },
                    ]
                  : []),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand-ink">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-muted text-[10px] uppercase tracking-widest font-bold">
                      {item.label}
                    </p>
                    <p className="font-semibold text-ink text-sm mt-0.5">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {bookingId && (
            <p className="mt-4 text-[11px] text-muted">
              Booking ID:{" "}
              <span className="font-mono text-ink">{bookingId}</span>
            </p>
          )}

          {/* Actions */}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              onClick={closeModal}
              className="py-4 border border-line rounded-2xl font-bold text-xs uppercase tracking-widest text-muted hover:bg-sandy hover:text-ink transition-all duration-200"
            >
              Close
            </button>
            <Link
              to="/my-bookings"
              className="py-4 bg-gradient-to-r from-cta to-accent-lt text-deep rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] transition-all duration-300 btn-glow"
            >
              My Bookings <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
