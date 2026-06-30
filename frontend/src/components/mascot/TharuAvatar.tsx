import { motion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

import type { TharuAvatarProps, TharuState } from "./types";

const KAPRUKA_LOGO = "/kapruka-logo.jpeg";
const KAPRUKA_BG = "#3f2870";

const floatTransition: Transition = {
  duration: 3.2,
  repeat: Infinity,
  repeatType: "reverse",
  ease: "easeInOut",
};

const heroFloatTransition: Transition = {
  ...floatTransition,
  delay: 1,
};

const introTransition: Transition = {
  duration: 0.9,
  ease: [0.22, 1, 0.36, 1],
};

const spinTransition: Transition = {
  duration: 1.4,
  repeat: Infinity,
  ease: "linear",
};

function bodyMotion(state: TharuState) {
  switch (state) {
    case "excited":
    case "celebrating":
      return { y: [0, -8, 0], scale: [1, 1.02, 1] };
    case "happy":
    case "success":
      return { y: [0, -6, 0], scale: [1, 1.03, 1] };
    case "thinking":
    case "loading":
      return { y: 0, opacity: 1 };
    case "surprised":
      return { scale: [1, 1.06, 1] };
    default:
      return { y: [0, -5, 0] };
  }
}

/** Yellow eyes overlaid on the Kapruka cart face JPEG — blink in sync. */
function MascotEyes({ compact = false }: { compact?: boolean }) {
  const eyeSize = compact ? "14%" : "13.5%";
  const positions = compact
    ? [
        { left: "27%", top: "33%" },
        { left: "59%", top: "33%" },
      ]
    : [
        { left: "26.5%", top: "34%" },
        { left: "58.5%", top: "34%" },
      ];

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {positions.map((pos, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-brand-gold"
          style={{
            left: pos.left,
            top: pos.top,
            width: eyeSize,
            height: eyeSize,
          }}
        />
      ))}
    </div>
  );
}

function KaprukaCartFace({
  className,
  state = "idle",
  compact = false,
  blend = false,
  animate = false,
  floatDelay = false,
}: {
  className?: string;
  state?: TharuState;
  compact?: boolean;
  blend?: boolean;
  animate?: boolean;
  floatDelay?: boolean;
}) {
  const face = (
    <div
      className={cn(
        "relative aspect-square",
        blend ? "overflow-visible rounded-none" : "overflow-hidden rounded-2xl",
        className,
      )}
      style={{ backgroundColor: KAPRUKA_BG }}
    >
      <img src={KAPRUKA_LOGO} alt="" className="h-full w-full object-contain" aria-hidden />
      <MascotEyes compact={compact} />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={bodyMotion(state)}
        transition={floatDelay ? heroFloatTransition : floatTransition}
      >
        {face}
      </motion.div>
    );
  }

  return face;
}

/** Yellow semi-circle arc spinner — matches the Kapruka smile curve. */
export function KaprukaLogoSpinner({
  size = 44,
  className,
  onPurple = false,
}: {
  size?: number;
  className?: string;
  /** Show Kapruka purple behind the arc (hero / dark surfaces). */
  onPurple?: boolean;
}) {
  const stroke = Math.max(3, Math.round(size * 0.13));
  const radius = (size - stroke) / 2 - 1;
  const center = size / 2;
  const arcLength = Math.PI * radius;

  return (
    <motion.div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        onPurple && "bg-kapruka",
        className,
      )}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={spinTransition}
      aria-hidden
      role="status"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#fed639"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${arcLength * 2}`}
          transform={`rotate(135 ${center} ${center})`}
        />
      </svg>
    </motion.div>
  );
}

export function TharuAvatar({
  size = 120,
  variant = "circle",
  state = "idle",
  interactive = false,
  className,
  "aria-label": ariaLabel = "Kapruka cart mascot",
}: TharuAvatarProps) {
  const isLoading = state === "thinking" || state === "loading";

  if (variant === "hero") {
    return (
      <motion.div
        role="img"
        aria-label={ariaLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={introTransition}
        className={cn("relative flex h-full w-full items-center justify-center", className)}
        style={{ backgroundColor: KAPRUKA_BG }}
      >
        {isLoading ? (
          <KaprukaLogoSpinner size={80} onPurple />
        ) : (
          <KaprukaCartFace
            state={state}
            blend
            animate
            floatDelay
            className="max-h-[min(52vh,20rem)] max-w-[min(72vw,20rem)]"
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      animate={isLoading ? undefined : bodyMotion(state)}
      transition={floatTransition}
      whileHover={interactive && !isLoading ? { scale: 1.04 } : undefined}
      whileTap={interactive && !isLoading ? { scale: 0.96 } : undefined}
    >
      {isLoading ? (
        <KaprukaLogoSpinner size={size * 0.55} onPurple />
      ) : (
        <KaprukaCartFace state={state} compact className="h-full w-full rounded-2xl" />
      )}
    </motion.div>
  );
}
