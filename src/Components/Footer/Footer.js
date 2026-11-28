// src/Components/Footer/Footer.js
import Logo from "../ui/Logo";
import { DESK_EMAIL, DESK_PHONE, DESK_WHATSAPP } from "../../config";
import { Link } from "react-router-dom";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// WhatsApp opens a chat with a ready-made first message
const WHATSAPP_NUMBER = DESK_WHATSAPP;
const WHATSAPP_TEXT = "Hello Sababa Tours! I would like to know more about your tour packages.";

// `bg` is the brand fill that rises on hover
const socials = [
  { icon: <FaFacebookF />, label: "Facebook", link: "https://www.facebook.com/Sakib1056", bg: "#1877F2" },
  { icon: <FaInstagram />, label: "Instagram", link: "https://www.instagram.com/___sakib.404/", bg: "linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)" },
  { icon: <FaLinkedinIn />, label: "LinkedIn", link: "https://www.linkedin.com/in/hafiz-sakib-96b8b3229/", bg: "#0A66C2" },
  { icon: <FaXTwitter />, label: "X", link: "https://x.com/hafiz_sakib1", bg: "#000000", ring: true },
  {
    icon: <FaWhatsapp />,
    label: "WhatsApp",
    link: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`,
    bg: "#25D366",
  },
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
  { icon: <FiPhone />, text: DESK_PHONE, href: `tel:${DESK_PHONE}` },
  { icon: <FiMail />, text: DESK_EMAIL, href: `mailto:${DESK_EMAIL}` },
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

            {/* Social: on hover the network's own colour rises from the bottom (Motion Brew style) */}
            <div className="flex flex-wrap gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`
                    group relative isolate w-10 h-10 flex items-center justify-center overflow-hidden
                    rounded-[13px] border border-on/12 text-on/55 text-sm
                    hover:text-white hover:-translate-y-1 hover:shadow-lg
                    transition-all duration-300
                    ${s.ring ? "hover:border-white/40" : "hover:border-transparent"}
                  `}
                >
                  <span
                    aria-hidden
                    style={{ background: s.bg }}
                    className="absolute inset-0 -z-10 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
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
                  {item.href ? <a href={item.href} className="break-all">{item.text}</a> : item.text}
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
