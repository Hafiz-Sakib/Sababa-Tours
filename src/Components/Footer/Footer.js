// src/Components/Footer/Footer.js
import Logo from "../ui/Logo";
import { Link } from "react-router-dom";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";

const socials = [
  { icon: <FaFacebookF />, label: "Facebook", link: "https://www.facebook.com/Sakib1056" },
  { icon: <FaInstagram />, label: "Instagram", link: "https://www.instagram.com/___sakib.404/" },
  { icon: <FaLinkedinIn />, label: "LinkedIn", link: "https://www.linkedin.com/in/hafiz-sakib-96b8b3229/" },
  { icon: <FaTwitter />, label: "Twitter", link: "https://x.com/hafiz_sakib1" },
];

const explore = [
  { label: "Packages", to: "/services" },
  { label: "Destinations", to: "/destinations" },
  { label: "Travel Guide", to: "/guide" },
  { label: "Travel Blog", to: "/blogs" },
  { label: "Meet Us", to: "/meet-us" },
];

const contact = [
  { icon: <FiMapPin />, text: "Chittagong, Bangladesh" },
  { icon: <FiPhone />, text: "+880 1XXX-XXXXXX" },
  { icon: <FiMail />, text: "hello@sababatours.com" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-panel text-on relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(38,165,158,0.12)_0%,transparent_55%)]" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* ── Brand ── */}
          <div className="lg:col-span-5">
            {/* same lockup as the navbar, so the logo reads identically in both places */}
            <Link to="/" aria-label="Sababa Tours home" className="mb-4 block w-fit">
              <Logo variant="lockup" className="h-11 w-auto" textClass="text-[26px]" />
            </Link>

            <p className="max-w-xs text-on/55 leading-relaxed text-sm mb-5">
              Refined, responsible journeys across Bangladesh.
            </p>

            {/* Social: on hover a brand-colour fill rises from the bottom (Motion Brew style) */}
            <div className="flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="
                    group relative isolate w-10 h-10 flex items-center justify-center overflow-hidden
                    rounded-[13px] border border-on/12 text-on/55 text-sm
                    hover:text-white hover:border-transparent hover:-translate-y-1
                    hover:shadow-lg hover:shadow-brand/30
                    transition-all duration-300
                  "
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 translate-y-full bg-gradient-to-br from-brand to-btn transition-transform duration-300 ease-out group-hover:translate-y-0"
                  />
                  <span className="transition-transform duration-300 group-hover:scale-110">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* ── Explore ── */}
          <div className="lg:col-span-3">
            <h3 className="text-accent uppercase tracking-[0.22em] text-[10px] font-bold mb-4">
              Explore
            </h3>
            <ul className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2.5">
              {explore.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="group text-on/55 hover:text-on transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-accent transition-all duration-300" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact + newsletter ── */}
          <div className="sm:col-span-2 lg:col-span-4">
            <h3 className="text-accent uppercase tracking-[0.22em] text-[10px] font-bold mb-4">
              Concierge Desk
            </h3>
            <div className="space-y-2.5 text-sm mb-5">
              {contact.map((item, i) => (
                <div key={i} className="flex gap-3 text-on/55 hover:text-on/80 transition-colors">
                  <span className="text-accent mt-0.5 shrink-0">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Get weekly travel stories"
                aria-label="Email address"
                className="
                  min-w-0 flex-1 bg-on/6 border border-on/12 rounded-xl
                  px-4 py-2.5 text-on text-sm placeholder:text-on/35
                  focus:outline-none focus:border-accent/50 transition-all
                "
              />
              <button
                type="submit"
                className="
                  px-5 bg-gradient-to-r from-cta to-accent-lt
                  text-ink font-black uppercase tracking-widest text-xs
                  rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-accent/20
                  transition-all duration-300 whitespace-nowrap btn-glow
                "
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative border-t border-on/6 py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center md:text-left text-xs text-on/35">
          <p>© {year} Sababa Tours. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
