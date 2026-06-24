import { motion, type Transition } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { TharuAvatarProps, TharuState } from "./types";

const FACE = "#FFC107";
const INK = "#141414";

const floatTransition: Transition = {
  duration: 3.2,
  repeat: Infinity,
  repeatType: "reverse",
  ease: "easeInOut",
};

function bodyMotion(state: TharuState) {
  switch (state) {
    case "excited":
    case "celebrating":
      return { y: [0, -8, 0], rotate: [-3, 3, -3] };
    case "happy":
    case "success":
      return { y: [0, -6, 0] };
    case "surprised":
      return { scale: [1, 1.06, 1] };
    case "loading":
      return { y: [0, -4, 0], scale: [1, 1.03, 1] };
    default:
      return { y: [0, -5, 0] };
  }
}

function Eyes({ state, blink }: { state: TharuState; blink: boolean }) {
  const happy = state === "happy" || state === "excited" || state === "celebrating" || state === "success";

  if (blink) {
    return (
      <>
        <rect x="32" y="43.2" width="12" height="2.6" rx="1.3" fill={INK} />
        <rect x="56" y="43.2" width="12" height="2.6" rx="1.3" fill={INK} />
      </>
    );
  }

  if (happy) {
    return (
      <>
        <path d="M 32 46 Q 38 38 44 46" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 56 46 Q 62 38 68 46" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      </>
    );
  }

  if (state === "surprised") {
    return (
      <>
        <circle cx="38" cy="44" r="6" fill={INK} />
        <circle cx="62" cy="44" r="6" fill={INK} />
      </>
    );
  }

  if (state === "thinking") {
    return (
      <>
        <ellipse cx="38" cy="44" rx="4.5" ry="2.4" fill={INK} />
        <ellipse cx="62" cy="44" rx="4.5" ry="2.4" fill={INK} />
      </>
    );
  }

  const blinkAnim =
    state === "typing" ? { scaleY: [1, 0.12, 1, 1, 0.12, 1] } : undefined;
  const blinkTrans: Transition =
    state === "typing"
      ? { duration: 2.8, repeat: Infinity, times: [0, 0.08, 0.16, 0.6, 0.68, 0.76] }
      : { duration: 0 };

  return (
    <>
      {([38, 62] as const).map((cx) => (
        <motion.ellipse
          key={cx}
          cx={cx}
          cy={44}
          rx={5}
          ry={6}
          fill={INK}
          animate={blinkAnim}
          transition={blinkTrans}
          style={{ transformOrigin: `${cx}px 44px` }}
        />
      ))}
    </>
  );
}

function Mouth({ state }: { state: TharuState }) {
  if (state === "surprised") {
    return <circle cx="50" cy="66" r="5" fill={INK} />;
  }
  if (state === "error") {
    return (
      <path d="M 40 68 Q 50 61 60 68" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    );
  }
  if (state === "excited" || state === "celebrating") {
    // open happy mouth
    return <path d="M 38 62 Q 50 78 62 62 Q 50 70 38 62 Z" fill={INK} />;
  }
  if (state === "happy" || state === "success") {
    return (
      <path d="M 38 62 Q 50 75 62 62" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    );
  }
  // calm gentle smile (idle / typing / thinking / loading)
  return (
    <path d="M 41 63 Q 50 71 59 63" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
  );
}

export function TharuAvatar({
  size = 48,
  state = "idle",
  interactive = false,
  className,
  "aria-label": ariaLabel = "Tharu, your gift concierge",
}: TharuAvatarProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [reaction, setReaction] = useState<TharuState | null>(null);

  // Eyes follow the cursor
  useEffect(() => {
    if (!interactive) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width || 1);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height || 1);
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        setLook({ x: clamp(dx) * 4, y: clamp(dy) * 3 });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [interactive]);

  // Natural blinking during calm states
  useEffect(() => {
    if (state !== "idle" && state !== "happy") return;
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(
        () => {
          setBlink(true);
          setTimeout(() => setBlink(false), 120);
          schedule();
        },
        2500 + Math.random() * 3500,
      );
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [state]);

  const effectiveState = reaction ?? state;

  const handlePoke = () => {
    if (!interactive) return;
    setReaction("excited");
    setTimeout(() => setReaction(null), 1300);
  };

  return (
    <motion.div
      ref={wrapRef}
      role="img"
      aria-label={ariaLabel}
      onPointerDown={handlePoke}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        interactive && "cursor-pointer",
        className,
      )}
      style={{ width: size, height: size }}
      animate={bodyMotion(effectiveState)}
      transition={floatTransition}
      whileTap={interactive ? { scale: 0.94 } : undefined}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="46" fill={FACE} />
        <motion.g
          animate={{ x: look.x, y: look.y }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <Eyes state={effectiveState} blink={blink} />
          <Mouth state={effectiveState} />
        </motion.g>
      </svg>
    </motion.div>
  );
}
