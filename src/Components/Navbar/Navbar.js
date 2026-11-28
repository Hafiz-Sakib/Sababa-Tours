// src/Components/Navbar/Navbar.js
// Desktop (xl and up): a floating logo and action pill at the screen edges, with a floating pill of icon tabs in the middle.
// Phones & tablets: a slim top bar plus a docked bottom TabBar (Motion Brew TabBar idea). The last tab, "Profile",
// opens a sheet with everything account related (bookings, admin, sign in / out) and the extra pages.
import Logo from "../ui/Logo";
import InstallButton from "../ui/InstallButton";
import TabBar from "../ui/TabBar";
import { ICONS } from "../ui/TabIcons";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { FiChevronDown, FiChevronRight, FiLogOut } from "react-icons/fi";
import { auth } from "../../Firebase.init";
import { AnimatePresence, LayoutGroup, Magnetic, motion } from "../ui/Motion";
import ThemeToggle from "../ui/ThemeToggle";
import toast from "react-hot-toast";

const links = [
  { id: "home", name: "Home", path: "/", icon: "home" },
  { id: "places", name: "Destinations", path: "/destinations", icon: "places" },
  { id: "packages", name: "Packages", path: "/services", icon: "packages" },
  { id: "guide", name: "Guide", path: "/guide", icon: "guide" },
  { id: "journal", name: "Travel Blog", path: "/blogs", icon: "journal" },
  { id: "about", name: "About", path: "/about", icon: "about" },
  { id: "contact", name: "Contact", path: "/contact", icon: "contact" },
];

/* bottom tab bar: every main page + Profile (the Profile sheet now only holds account things) */
const tabs = [
  { id: "home", label: "Home", icon: "home" },
  { id: "places", label: "Places", icon: "places" },
  { id: "packages", label: "Tours", icon: "packages" },
  { id: "guide", label: "Guide", icon: "guide" },
  { id: "journal", label: "Blog", icon: "journal" },
  { id: "about", label: "About", icon: "about" },
  { id: "contact", label: "Contact", icon: "contact" },
  { id: "profile", label: "Profile", icon: "profile" },
];

/* the booking form has its own sticky bottom bar */
const NO_TABBAR = ["/booking"];

const ADMIN_EMAIL = "hafizsakib5@gmail.com";

const idForPath = (pathname, extra) => {
  const all = [...links, ...extra];
  const hit = all.find((l) => (l.path === "/" ? pathname === "/" : pathname === l.path || pathname.startsWith(l.path + "/")));
  return hit ? hit.id : "";
};

/* Desktop pill: icon + label tabs, one teal indicator glides to the active tab */
const NavPill = ({ items, active }) => {
  const [hover, setHover] = useState(null);
  return (
    <LayoutGroup id="nav-pill">
      <nav aria-label="Main" className="pointer-events-auto rounded-full bg-surface/85 p-1 shadow-[0_8px_30px_-8px_rgba(16,24,40,0.18)] ring-1 ring-ink/[.08] backdrop-blur-xl">
        <ul className="flex gap-0.5" onMouseLeave={() => setHover(null)}>
          {items.map((l) => {
            const Icon = ICONS[l.icon];
            const on = active === l.id;
            return (
              <li key={l.id} onMouseEnter={() => setHover(l.id)}>
                <Link to={l.path} aria-current={on ? "page" : undefined} className="relative block whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  {on && <motion.span layoutId="nav-active" transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute inset-0 rounded-full bg-btn shadow-[0_6px_16px_-6px_rgb(var(--btn)/0.6)]" />}
                  {!on && hover === l.id && <motion.span layoutId="nav-hover" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-ink/[0.06]" />}
                  <span className={`relative flex items-center gap-1.5 transition-colors ${on ? "text-white" : "text-ink/60 hover:text-ink"}`}>
                    <Icon className="h-[15px] w-[15px]" strokeWidth={2.1} active={on} />
                    {l.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </LayoutGroup>
  );
};

const Avatar = ({ user, size = "h-8 w-8", text = "text-sm" }) =>
  user.photoURL ? (
    <img src={user.photoURL} alt={user.displayName || "User"} className={`${size} rounded-full object-cover ring-2 ring-accent/30`} referrerPolicy="no-referrer" data-keep />
  ) : (
    <div className={`${size} ${text} flex items-center justify-center rounded-full bg-gradient-to-br from-brand to-btn font-bold text-white`}>
      {(user.displayName || user.email || "U")[0].toUpperCase()}
    </div>
  );

/* one row of the profile sheet */
const SheetRow = ({ to, icon, label, hint, onClick }) => {
  const Icon = ICONS[icon];
  return (
    <Link to={to} onClick={onClick} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-sandy">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-ink">
        <Icon className="h-5 w-5" strokeWidth={2} active={false} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{label}</span>
        {hint && <span className="block truncate text-xs text-muted">{hint}</span>}
      </span>
      <FiChevronRight className="text-muted transition group-hover:translate-x-0.5" />
    </Link>
  );
};

const NavBar = () => {
  const [user, setUser] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.email === ADMIN_EMAIL;

  /* extra desktop tab for signed-in people: their bookings (or the admin dashboard) */
  const account = user ? [{ id: isAdmin ? "admin" : "bookings", name: isAdmin ? "Admin" : "Bookings", path: isAdmin ? "/admin" : "/my-bookings", icon: isAdmin ? "admin" : "bookings" }] : [];
  const active = idForPath(location.pathname, account);
  const showTabBar = !NO_TABBAR.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  /* the Profile tab lights up while its sheet is open and on the account pages */
  const tabValue = sheet ? "profile" : active === "bookings" || active === "admin" ? "profile" : active;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return unsub;
  }, []);

  /* close menus on route change */
  useEffect(() => {
    setSheet(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  /* click outside the desktop user menu */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Escape closes the sheet */
  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (e) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  /* room under the page for the docked tab bar (see App.css) */
  useEffect(() => {
    document.documentElement.classList.toggle("has-tabbar", showTabBar);
    return () => document.documentElement.classList.remove("has-tabbar");
  }, [showTabBar]);

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/");
      toast.success("Signed out successfully");
    } catch (err) {
      console.error(err);
    }
    setUserMenuOpen(false);
    setSheet(false);
  };

  const goTab = (id) => {
    if (id === "profile") {
      setSheet(true);
      return;
    }
    const t = links.find((l) => l.id === id);
    if (t) navigate(t.path);
  };

  const pill = "pointer-events-auto rounded-full bg-surface/85 shadow-[0_8px_30px_-8px_rgba(16,24,40,0.18)] ring-1 ring-ink/[.08] backdrop-blur-xl";
  const closeSheet = () => setSheet(false);

  return (
    <>
      {/* ═══════════ Desktop: logo + actions pushed to the edges, tabs in the middle ═══════════ */}
      <div className="pointer-events-none fixed inset-x-0 top-2.5 z-50 hidden xl:block">
        <div className="flex items-center justify-between gap-3 px-3">
          <Link to="/" aria-label="Sababa Tours home" className={`${pill} flex items-center py-1 pl-2 pr-2 transition-transform duration-300 hover:scale-[1.03] 2xl:pr-4`}>
            <Logo variant="lockup" className="h-8 w-auto" textClass="text-[17px]" textWrap="hidden 2xl:block" />
          </Link>

          <NavPill items={[...links, ...account]} active={active} />

          <div className={`${pill} flex items-center gap-1 p-1`}>
            <ThemeToggle solid small />
            <InstallButton compact small />
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface py-0.5 pl-0.5 pr-2.5 transition-all duration-300 hover:border-accent/40"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <Avatar user={user} size="h-7 w-7" text="text-xs" />
                  <span className="max-w-[100px] truncate text-[13px] font-semibold">{user.displayName || user.email?.split("@")[0]}</span>
                  <FiChevronDown size={14} className={`transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                      style={{ transformOrigin: "top right" }}
                      className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-line bg-surface py-2 shadow-[0_16px_48px_rgba(16,24,40,0.14)]"
                    >
                      <div className="border-b border-line px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Signed in as</p>
                        <p className="mt-1 break-all text-sm font-semibold text-ink">{user.email}</p>
                      </div>
                      <button onClick={logout} className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium text-red-500 transition hover:bg-red-50">
                        <FiLogOut size={16} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <Link to="/login" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink transition hover:bg-ink/[0.06]">
                  Sign In
                </Link>
                <Magnetic strength={0.2}>
                  <Link to="/register" className="btn-glow block rounded-full bg-gradient-to-r from-cta to-accent-lt px-4 py-1.5 text-[13px] font-black text-deep transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/30">
                    Start Trip
                  </Link>
                </Magnetic>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ Phones & tablets: slim top bar (no menu button, the Profile tab replaces it) ═══════════ */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-xl xl:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex h-[60px] max-w-3xl items-center justify-between gap-3 px-4">
          <Link to="/" aria-label="Sababa Tours home" className="flex items-center">
            <Logo variant="lockup" className="h-9 w-auto" textClass="text-[19px]" textWrap="hidden min-[400px]:block" />
          </Link>
          <div className="flex items-center gap-2">
            <InstallButton compact small />
            <ThemeToggle solid />
          </div>
        </div>
      </header>

      {/* ═══════════ Phones & tablets: docked tab bar + Profile sheet ═══════════ */}
      {showTabBar && (
        <>
          <AnimatePresence>
            {sheet && (
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={closeSheet}
                  className="fixed inset-0 z-[44] bg-scrim/55 backdrop-blur-sm xl:hidden"
                />
            )}
            {sheet && (
                <div key="sheet-wrap" className="pointer-events-none fixed inset-x-0 bottom-[calc(max(0.6rem,env(safe-area-inset-bottom))+74px)] z-[44] flex justify-center px-2 xl:hidden">
                  <motion.div
                    role="dialog"
                    aria-label="Profile"
                    initial={{ opacity: 0, y: 28, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    style={{ transformOrigin: "bottom center", maxHeight: "calc(100svh - 170px)" }}
                    className="pointer-events-auto w-[460px] max-w-full overflow-y-auto rounded-[28px] bg-surface p-3 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05),0_24px_60px_-16px_rgba(0,0,0,0.35)] ring-1 ring-ink/[.08]"
                  >
                    {user ? (
                      <div className="flex items-center gap-3 rounded-2xl bg-sandy p-3">
                        <Avatar user={user} size="h-14 w-14" text="text-2xl" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-black">{user.displayName || user.email?.split("@")[0]}</p>
                          <p className="truncate text-xs text-muted">{user.email}</p>
                          {isAdmin && <span className="mt-1 inline-block rounded-full bg-btn px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Admin</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-sandy p-4">
                        <p className="text-base font-black">Welcome to Sababa Tours</p>
                        <p className="mt-1 text-xs text-muted">Sign in to book trips and follow your bookings.</p>
                        <div className="mt-4 flex gap-2.5">
                          <Link to="/login" onClick={closeSheet} className="flex-1 rounded-2xl border border-line bg-surface py-3 text-center text-sm font-bold text-ink transition hover:bg-page">
                            Sign In
                          </Link>
                          <Link to="/register" onClick={closeSheet} className="flex-1 rounded-2xl bg-gradient-to-r from-cta to-accent-lt py-3 text-center text-sm font-black text-deep">
                            Start Trip
                          </Link>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 space-y-0.5">
                      {user && isAdmin && <SheetRow to="/admin" icon="admin" label="Admin Dashboard" hint="Manage packages, bookings and users" onClick={closeSheet} />}
                      {user && <SheetRow to="/my-bookings" icon="bookings" label="My Bookings" hint="Your trips and their status" onClick={closeSheet} />}
                    </div>

                    <div className="mt-2 space-y-2">
                      <InstallButton />
                      {user && (
                        <button onClick={logout} className="flex w-full items-center justify-center gap-3 rounded-3xl border border-line bg-surface py-3.5 text-sm font-semibold text-red-500 transition hover:bg-red-50">
                          <FiLogOut size={17} /> Sign Out
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
            )}
          </AnimatePresence>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-center px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] xl:hidden">
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-[max(0.6rem,env(safe-area-inset-bottom))] bg-page" />
            <TabBar
              tabs={tabs}
              value={tabValue}
              onChange={goTab}
              onReselect={(id) => (id === "profile" ? setSheet((s) => !s) : window.scrollTo({ top: 0, behavior: "smooth" }))}
              className="pointer-events-auto"
            />
          </div>
        </>
      )}
    </>
  );
};

export default NavBar;
