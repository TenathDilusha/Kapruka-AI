import { TharuAvatar } from "./TharuAvatar";
import type { TharuState } from "./types";

const STATES: TharuState[] = [
  "idle",
  "thinking",
  "typing",
  "happy",
  "excited",
  "celebrating",
  "success",
  "surprised",
  "error",
  "loading",
];

/**
 * Showcase of TharuAvatar usage patterns across the app.
 * Import individual patterns from here or use TharuAvatar directly.
 */
export function TharuAvatarExamples() {
  return (
    <div className="min-h-screen bg-[#0E0F17] p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="text-center">
          <TharuAvatar size={120} state="idle" glowIntensity={0.8} className="mx-auto" />
          <h1 className="mt-4 text-3xl font-bold">Tharu</h1>
          <p className="mt-1 text-[#FFD84D]/80">Your star for finding the perfect gift.</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#FFD84D]">All states</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {STATES.map((state) => (
              <div
                key={state}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#161826] p-4"
              >
                <TharuAvatar size={64} state={state} glowIntensity={0.7} />
                <span className="text-xs capitalize text-white/60">{state}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#FFD84D]">Usage patterns</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <ChatMessageExample />
            <LandingExample />
            <LoadingExample />
            <CheckoutSuccessExample />
          </div>
        </section>
      </div>
    </div>
  );
}

/** Chat avatar — small, beside assistant messages */
export function ChatMessageExample() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161826] p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Chat message</p>
      <div className="flex gap-3">
        <TharuAvatar size={36} state="happy" glowIntensity={0.5} showParticles={false} />
        <div className="rounded-2xl rounded-tl-md bg-white/5 px-4 py-3 text-sm text-white/90">
          I found 6 birthday gifts your mom will love!
        </div>
      </div>
    </div>
  );
}

/** Landing / welcome screen — large hero mascot */
export function LandingExample() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161826] p-5 text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Landing screen</p>
      <TharuAvatar size={96} state="idle" glowIntensity={0.85} className="mx-auto" />
      <p className="mt-3 text-sm text-white/70">Ask me anything about gifts in Sri Lanka</p>
    </div>
  );
}

/** Loading state — thinking while fetching */
export function LoadingExample() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161826] p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Loading</p>
      <div className="flex flex-col items-center gap-3 py-4">
        <TharuAvatar size={72} state="thinking" glowIntensity={0.7} />
        <p className="text-sm text-[#FFD84D]/70">Searching Kapruka catalog...</p>
      </div>
    </div>
  );
}

/** Checkout success — celebrating with golden glow */
export function CheckoutSuccessExample() {
  return (
    <div className="rounded-2xl border border-[#FFD84D]/20 bg-gradient-to-b from-[#161826] to-[#0E0F17] p-5 text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Checkout success</p>
      <TharuAvatar size={88} state="success" glowIntensity={1} />
      <p className="mt-3 font-semibold text-[#FFD84D]">Order ready!</p>
      <p className="text-xs text-white/50">Tap to pay on Kapruka</p>
    </div>
  );
}

/** Floating assistant button */
export function FloatingAssistantButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#161826] shadow-lg shadow-black/40 ring-2 ring-[#FFD84D]/30 transition hover:ring-[#FFD84D]/60"
      aria-label="Open Tharu assistant"
    >
      <TharuAvatar size={40} state="idle" glowIntensity={0.75} showParticles={false} />
    </button>
  );
}

/** Empty state illustration */
export function EmptyStateExample() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <TharuAvatar size={80} state="surprised" glowIntensity={0.6} />
      <p className="text-lg font-medium text-white/90">No gifts here yet</p>
      <p className="text-sm text-white/50">Start a conversation and I&apos;ll find something perfect.</p>
    </div>
  );
}
