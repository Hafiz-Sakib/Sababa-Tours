// src/Components/Services/RequestFlow.js
// "What happens after you send a request": Motion Brew "Verify flow" steps, written from the real booking rules
// (30% advance, 72 hour hold, changes until LOCK_DAYS before the trip).
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import VerifyFlow from "../ui/brew/VerifyFlow";
import { Reveal } from "../ui/Motion";
import { ADVANCE_PERCENT } from "../Utilities/payment";
import { LOCK_DAYS } from "../Utilities/bookingRules";

const steps = [
  { title: "You send a request", text: "Pick a package, a date and the number of travelers. Nothing is charged yet." },
  { title: "Our desk reviews it", text: "A real person checks your date and confirms the final total with you." },
  { title: `You pay the ${ADVANCE_PERCENT}% advance`, text: "When your date needs an advance, you have 72 hours to pay it. Pay any amount, any time after." },
  { title: "Your trip is confirmed", text: `Change or cancel from My Bookings up to ${LOCK_DAYS} days before the trip.` },
];

const RequestFlow = () => (
  <section className="bg-surface py-24">
    <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
      <Reveal>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-brand-ink">After you book</p>
        <h2 className="text-3xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          From request to confirmed, in four steps
        </h2>
        <p className="mt-5 max-w-md text-muted">You can follow every step from My Bookings, and our travel desk is a message away if a date needs to move.</p>
        <Link to="/meet-us#talk" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-ink transition-all hover:gap-4">
          Talk to the desk first <FiArrowRight />
        </Link>
      </Reveal>
      <Reveal delay={0.1} className="flex justify-center lg:justify-end">
        <VerifyFlow steps={steps} doneLabel="Trip confirmed" />
      </Reveal>
    </div>
  </section>
);

export default RequestFlow;
