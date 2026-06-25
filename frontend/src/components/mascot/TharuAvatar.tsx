import { motion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

import type { TharuAvatarProps, TharuState } from "./types";

const MASCOT_VIDEO = "/mascot.mp4";

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
      return { y: [0, -8, 0], rotate: [-2, 2, -2] };
    case "happy":
    case "success":
      return { y: [0, -6, 0], scale: [1, 1.03, 1] };
    case "thinking":
    case "loading":
      return { y: [0, -4, 0] };
    case "surprised":
      return { scale: [1, 1.06, 1] };
    default:
      return { y: [0, -5, 0] };
  }
}

export function TharuAvatar({
  size = 120,
  variant = "circle",
  state = "idle",
  interactive = false,
  className,
  "aria-label": ariaLabel = "Tharu, your Kapruka gift mascot",
}: TharuAvatarProps) {
  if (variant === "hero") {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        className={cn("relative h-full w-full overflow-hidden bg-white", className)}
      >
        <video
          src={MASCOT_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-contain object-center"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div className="absolute inset-y-0 left-0 w-[min(22%,10rem)] bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-[min(22%,10rem)] bg-gradient-to-l from-white via-white/85 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[min(16%,5rem)] bg-gradient-to-b from-white via-white/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[min(20%,6rem)] bg-gradient-to-t from-white via-white/70 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      animate={bodyMotion(state)}
      transition={floatTransition}
      whileHover={interactive ? { scale: 1.04 } : undefined}
      whileTap={interactive ? { scale: 0.96 } : undefined}
    >
      <video
        src={MASCOT_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full rounded-full object-cover bg-white shadow-md ring-2 ring-brand-gold/30"
        aria-hidden
      />
    </motion.div>
  );
}
