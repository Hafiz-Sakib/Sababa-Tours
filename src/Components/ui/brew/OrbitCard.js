import * as React from "react";
import { FiArrowRight, FiCamera, FiHeart, FiMapPin } from "react-icons/fi";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn, GLIDE, PALETTE, initials } from "./util";

/* Orbit card: people and small chips circle a centre mark on three rings. Every few seconds someone joins: a spark
   leaves the centre, lands on a member, a ripple spreads and the count rolls up. Hover slows the rings, drag spins
   them. (Port of Motion Brew's "Orbit card".) */

const ROLL = { type: "spring", stiffness: 260, damping: 26 };
const CARD_H = 568;
const CENTER_Y = 448;
const RADII = [100, 156, 216];
const RING_SPEED = [11, -7, 5];

function layout(members) {
  const slots = [
    [0, 205],
    [1, 160],
    [1, 300],
    [2, 192],
    [2, 252],
    [2, 338],
  ];
  const items = slots.slice(0, members).map(([ring, angle], i) => ({ id: `m${i}`, kind: "member", ring, angle, member: i }));
  items.push(
    { id: "c0", kind: "chip", ring: 0, angle: 330, icon: FiMapPin, color: PALETTE[0], label: "Explored" },
    { id: "c1", kind: "chip", ring: 1, angle: 20, icon: FiCamera, color: PALETTE[3], label: "Photos" },
    { id: "c2", kind: "chip", ring: 2, angle: 120, icon: FiHeart, color: PALETTE[4], label: "Loved it" },
    { id: "d0", kind: "dot", ring: 0, angle: 80, color: PALETTE[2] },
    { id: "d1", kind: "dot", ring: 1, angle: 232, color: PALETTE[0] },
    { id: "d2", kind: "dot", ring: 2, angle: 296, color: PALETTE[3] },
  );
  return items;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Digit({ digit, still }) {
  return (
    <span className="relative inline-block h-[1.2em] w-[0.6em] overflow-hidden">
      <motion.span className="absolute inset-x-0 top-0 flex flex-col" initial={false} animate={{ y: `${-digit * 10}%` }} transition={still ? { duration: 0 } : ROLL}>
        {DIGITS.map((d) => (
          <span key={d} className="flex h-[1.2em] items-center justify-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function Count({ value, still }) {
  const text = Math.max(0, Math.round(value)).toLocaleString("en-US");
  const digits = [...text].filter((c) => c !== ",").length;
  let seen = 0;
  return (
    <span aria-hidden className="inline-flex tabular-nums">
      {[...text].map((c, i) => {
        if (c === ",") return <span key={`s${i}`}>,</span>;
        const key = digits - seen++;
        return <Digit key={key} digit={Number(c)} still={still} />;
      })}
    </span>
  );
}

function Reveal({ text, show, delay = 0, still, className }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <React.Fragment key={i}>
          <motion.span
            aria-hidden
            className="inline-block"
            initial={still ? false : { opacity: 0, y: "0.35em", filter: "blur(6px)" }}
            animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            transition={{ duration: 0.55, ease: GLIDE, delay: delay + i * 0.05 }}
          >
            {w}
          </motion.span>{" "}
        </React.Fragment>
      ))}
    </span>
  );
}

function GhostButton({ label, href, onClick, still, as: Link }) {
  const arrow = "absolute inset-0 h-4 w-4 transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
  const cls = cn(
    "group pointer-events-auto inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-btn px-5 text-sm font-semibold text-white outline-none transition-[background-color,transform] duration-200 hover:bg-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
    !still && "active:scale-[0.97]",
  );
  const inner = (
    <>
      {label}
      <span aria-hidden className="relative h-4 w-4 overflow-hidden">
        <FiArrowRight className={cn(arrow, !still && "group-hover:translate-x-[140%]")} strokeWidth={2.25} />
        <FiArrowRight className={cn(arrow, "-translate-x-[140%]", !still && "group-hover:translate-x-0 group-hover:delay-75")} strokeWidth={2.25} />
      </span>
    </>
  );
  if (href && Link) return <Link to={href} className={cls}>{inner}</Link>;
  if (href) return <a href={href} className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function Avatar({ member, index }) {
  const [broken, setBroken] = React.useState(false);
  return (
    <span className="relative block h-11 w-11 overflow-hidden rounded-full bg-surface p-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_6px_16px_-6px_rgba(0,0,0,0.25)]">
      {member.avatar && !broken ? (
        <img src={member.avatar} alt={member.name} draggable={false} data-keep onError={() => setBroken(true)} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center rounded-full text-xs font-semibold text-white" style={{ background: PALETTE[index % PALETTE.length] }}>
          {initials(member.name)}
        </span>
      )}
    </span>
  );
}

export default function OrbitCard({
  count = null,
  label = "travelers",
  subtitle = "Families, friends and solo explorers plan their Bangladesh trips with us. Someone new joins every few seconds.",
  cta = "Start planning",
  href,
  linkAs,
  members,
  logo,
  speed = 1,
  joinEvery = 2.6,
  onCta,
  className,
}) {
  const still = !!useReducedMotion();
  const card = React.useRef(null);
  const field = React.useRef(null);
  const spark = React.useRef(null);
  const nodes = React.useRef(new Map());
  const inView = useInView(card, { once: true, amount: 0.4 });
  const visible = useInView(card, { amount: 0 });
  const show = still || inView;

  const people = members.slice(0, 6);
  const items = React.useMemo(() => layout(people.length), [people.length]);
  const [joined, setJoined] = React.useState(0);
  const [hovered, setHovered] = React.useState(null);

  React.useEffect(() => setJoined(0), [count]);

  const settings = React.useRef({ speed, joinEvery, still, hovered });
  settings.current = { speed, joinEvery, still, hovered };
  const motionState = React.useRef({
    turn: [0, 0, 0],
    spin: 0,
    spinVel: 0,
    calm: 1,
    pointer: { x: 0, y: 0, inside: false },
    drag: null,
    pull: new Map(),
    pops: new Map(),
    sinceJoin: 0,
    flight: null,
  });

  React.useEffect(() => {
    const host = field.current;
    if (!host) return;
    const s = motionState.current;
    let raf = 0;
    let last = performance.now();
    const FLY = 0.6;

    const frame = () => {
      if (visible) raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const set = settings.current;
      const cx = host.clientWidth / 2;
      const moving = !set.still && visible;

      if (moving) {
        const target = set.hovered ? 0 : s.pointer.inside ? 0.35 : 1;
        s.calm += (target - s.calm) * Math.min(1, dt * 5);
        for (let r = 0; r < 3; r++) s.turn[r] += RING_SPEED[r] * set.speed * s.calm * dt;
        if (!s.drag) {
          s.spin += s.spinVel * dt;
          s.spinVel *= Math.exp(-dt * 1.6);
        }
        if (set.joinEvery > 0 && !s.flight) {
          s.sinceJoin += dt;
          if (s.sinceJoin >= set.joinEvery) {
            s.sinceJoin = 0;
            const ms = items.filter((i) => i.kind === "member");
            const pick = ms[Math.floor(Math.random() * ms.length)];
            if (pick) s.flight = { id: pick.id, t: 0 };
          }
        }
      }

      const where = (it) => {
        const a = ((it.angle + s.turn[it.ring] + s.spin) * Math.PI) / 180;
        return { x: cx + Math.cos(a) * RADII[it.ring], y: CENTER_Y + Math.sin(a) * RADII[it.ring] };
      };

      for (const it of items) {
        const el = nodes.current.get(it.id);
        if (!el) continue;
        const p = where(it);
        let pull = s.pull.get(it.id);
        if (!pull) s.pull.set(it.id, (pull = { x: 0, y: 0 }));
        let tx = 0;
        let ty = 0;
        if (moving && s.pointer.inside && !s.drag && it.kind !== "dot") {
          const dx = s.pointer.x - p.x;
          const dy = s.pointer.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 110) {
            const k = (1 - d / 110) * 0.22;
            tx = Math.max(-12, Math.min(12, dx * k));
            ty = Math.max(-12, Math.min(12, dy * k));
          }
        }
        pull.x += (tx - pull.x) * Math.min(1, dt * 10);
        pull.y += (ty - pull.y) * Math.min(1, dt * 10);
        const popAt = s.pops.get(it.id);
        let scale = 1;
        if (popAt !== undefined) {
          const k = (now - popAt) / 520;
          if (k >= 1) s.pops.delete(it.id);
          else scale = 1 + Math.sin(k * Math.PI) * 0.22 * (1 - k * 0.5);
        }
        el.style.transform = `translate3d(${p.x + pull.x}px, ${p.y + pull.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }

      const dot = spark.current;
      if (dot) {
        const f = s.flight;
        if (!f || !moving) dot.style.opacity = "0";
        else {
          f.t += dt / FLY;
          const it = items.find((i) => i.id === f.id);
          const p = where(it);
          const k = Math.min(1, f.t);
          const e = 1 - Math.pow(1 - k, 3);
          const x = cx + (p.x - cx) * e;
          const y = CENTER_Y + (p.y - CENTER_Y) * e;
          dot.style.opacity = String(Math.min(1, k * 4) * (1 - k * 0.3));
          dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          if (f.t >= 1) {
            s.pops.set(f.id, now);
            s.flight = null;
            setJoined((j) => j + 1);
          }
        }
      }
    };
    frame();

    const local = (e) => {
      const r = host.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const angleOf = (p) => (Math.atan2(p.y - CENTER_Y, p.x - host.clientWidth / 2) * 180) / Math.PI;
    const onMove = (e) => {
      const p = local(e);
      Object.assign(s.pointer, p, { inside: true });
      if (!s.drag) return;
      const a = angleOf(p);
      let da = a - s.drag.angle;
      if (da > 180) da -= 360;
      if (da < -180) da += 360;
      const t = performance.now();
      const dts = Math.max(1, t - s.drag.t) / 1000;
      s.spin += da;
      s.spinVel = s.spinVel * 0.5 + (da / dts) * 0.5;
      s.drag = { angle: a, t };
    };
    const onDown = (e) => {
      if (settings.current.still) return;
      s.drag = { angle: angleOf(local(e)), t: performance.now() };
      s.spinVel = 0;
      host.setPointerCapture(e.pointerId);
    };
    const onUp = () => {
      s.drag = null;
      s.spinVel = Math.max(-540, Math.min(540, s.spinVel));
    };
    const onLeave = () => {
      if (!s.drag) s.pointer.inside = false;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [items, visible]);

  const total = (count ?? 0) + joined;

  return (
    <div
      ref={card}
      className={cn("relative w-full max-w-[440px] overflow-hidden rounded-3xl border border-line bg-surface text-ink shadow-card", className)}
      style={{ height: CARD_H }}
    >
      <div
        ref={field}
        aria-hidden
        className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
        style={{
          touchAction: "pan-y",
          maskImage: "linear-gradient(to bottom, transparent 176px, #000 248px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 176px, #000 248px)",
        }}
      >
        <motion.div
          className="absolute inset-0"
          initial={still ? false : { opacity: 0, scale: 0.92 }}
          animate={show ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.9, ease: GLIDE, delay: 0.2 }}
          style={{ transformOrigin: `50% ${CENTER_Y}px` }}
        >
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <circle cx="50%" cy={CENTER_Y} r={64} className="fill-sandy" />
            {RADII.map((r) => (
              <circle key={r} cx="50%" cy={CENTER_Y} r={r} fill="none" strokeWidth={1} className="stroke-line" />
            ))}
          </svg>

          {!still &&
            joined > 0 &&
            [0, 0.18].map((d) => (
              <motion.span
                key={`${joined}-${d}`}
                className="absolute left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/40"
                style={{ top: CENTER_Y }}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 3.2, opacity: 0 }}
                transition={{ duration: 1.4, ease: GLIDE, delay: d }}
              />
            ))}

          <motion.div
            key={joined}
            className="absolute left-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06),0_10px_28px_-10px_rgba(0,0,0,0.28)]"
            style={{ top: CENTER_Y }}
            initial={still || joined === 0 ? false : { scale: 1 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.5, ease: GLIDE }}
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-sandy">{logo}</span>
          </motion.div>

          <span ref={spark} className="absolute left-0 top-0 h-2 w-2 rounded-full bg-brand opacity-0 shadow-[0_0_0_4px_rgba(38,165,158,0.18)]" />

          {items.map((it) => {
            const isHovered = hovered === it.id;
            const name = it.kind === "member" ? people[it.member].name : it.kind === "chip" ? it.label : null;
            const role = it.kind === "member" ? people[it.member].role : null;
            return (
              <div
                key={it.id}
                ref={(el) => {
                  if (el) nodes.current.set(it.id, el);
                  else nodes.current.delete(it.id);
                }}
                className={cn("absolute left-0 top-0 will-change-transform", isHovered ? "z-20" : "z-10")}
                onPointerEnter={() => it.kind !== "dot" && setHovered(it.id)}
                onPointerLeave={() => setHovered((h) => (h === it.id ? null : h))}
              >
                <div className={cn("relative transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", isHovered && "scale-[1.14]")}>
                  {it.kind === "member" && <Avatar member={people[it.member]} index={it.member} />}
                  {it.kind === "chip" && (
                    <span className="grid h-10 w-10 place-items-center rounded-full text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.3)]" style={{ background: it.color }}>
                      <it.icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                    </span>
                  )}
                  {it.kind === "dot" && <span className="block h-2 w-2 rounded-full" style={{ background: it.color }} />}
                </div>
                {name && (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-3 py-1 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_20px_-8px_rgba(0,0,0,0.25)] transition-[opacity,transform] duration-200",
                      isHovered ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                    )}
                  >
                    <span className="font-medium">{name}</span>
                    {role && <span className="text-muted"> {role}</span>}
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="pointer-events-none relative px-6 pt-6">
        <motion.h3
          aria-label={count != null ? `${total.toLocaleString("en-US")} ${label}` : label}
          initial={still ? false : { opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.55, ease: GLIDE }}
          className="flex flex-wrap items-center gap-[0.3em] text-2xl font-semibold leading-[1.2] tracking-tight"
        >
          {count != null && <Count value={total} still={still} />}
          <span aria-hidden>{label}</span>
        </motion.h3>
        <Reveal text={subtitle} show={show} delay={0.12} still={still} className="mt-2 block text-[15px] leading-relaxed text-muted" />
        <motion.div
          initial={still ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.5, ease: GLIDE, delay: 0.3 }}
          className="mt-5"
        >
          <GhostButton label={cta} href={href} as={linkAs} onClick={onCta} still={still} />
        </motion.div>
      </div>
    </div>
  );
}
