// src/Components/NotFound/NotFound.js
import Logo from "../ui/Logo";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const NotFound = () => (
  <main className="min-h-screen bg-panel2 flex items-center justify-center px-6 pt-[76px] text-on text-center">
    <div className="max-w-lg">
      <Logo variant="full" className="mx-auto mb-8 h-40 w-auto" />

      <p className="text-accent-lt uppercase tracking-[0.3em] text-sm font-bold mb-4">
        404 — Off Route
      </p>

      <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
        This route is off the itinerary.
      </h1>

      <p className="text-on/70 text-lg mb-10">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-3 bg-btn text-white hover:bg-surface hover:text-ink px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all"
      >
        <FiArrowLeft /> Back to Home
      </Link>
    </div>
  </main>
);

export default NotFound;
