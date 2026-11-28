import logoDay from "../../assets/logo/logo-day.png";
import logoNight from "../../assets/logo/logo-night.png";
import logoMark from "../../assets/logo/logo-mark.png";

/* Sababa Tours logo, used everywhere.
   variant="full"   – the complete logo (mark + wordmark + underline). Day / night versions swap with the theme.
   variant="lockup" – compact: pin mark + live "Sababa Tours" text (navbar, small spaces).
   variant="mark"   – only the pin mark. */
export default function Logo({ variant = "full", className = "h-24 w-auto", textClass = "text-[22px]", textWrap = "", sub = null }) {
  if (variant === "mark") {
    return <img src={logoMark} alt="Sababa Tours" data-keep draggable="false" className={className} />;
  }
  if (variant === "lockup") {
    return (
      <span className="flex items-center gap-2.5">
        <img src={logoMark} alt="" aria-hidden data-keep draggable="false" className={className} />
        <span className={`leading-none ${textWrap}`}>
          <span className={`block font-black tracking-tight ${textClass}`} style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-ink">Sababa</span> <span className="text-brand-ink">Tours</span>
          </span>
          {sub && <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.28em] text-muted">{sub}</span>}
        </span>
      </span>
    );
  }
  return (
    <>
      <img src={logoDay} alt="Sababa Tours" data-keep draggable="false" className={`${className} dark:hidden`} />
      <img src={logoNight} alt="Sababa Tours" data-keep draggable="false" className={`${className} hidden dark:block`} />
    </>
  );
}
