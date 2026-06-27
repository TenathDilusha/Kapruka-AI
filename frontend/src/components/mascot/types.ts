export type TharuState =
  | "idle"
  | "thinking"
  | "typing"
  | "happy"
  | "excited"
  | "celebrating"
  | "success"
  | "surprised"
  | "error"
  | "loading";

export interface TharuAvatarProps {
  /** Pixel size (width & height). Default 48 — ignored when variant is hero */
  size?: number;
  /** circle = small logo, hero = large welcome logo */
  variant?: "circle" | "hero";
  state?: TharuState;
  showParticles?: boolean;
  /** 0–1 glow strength. Default 0.6 */
  glowIntensity?: number;
  /** Eyes follow the cursor and Tharu reacts happily when tapped. Default false */
  interactive?: boolean;
  className?: string;
  "aria-label"?: string;
}
