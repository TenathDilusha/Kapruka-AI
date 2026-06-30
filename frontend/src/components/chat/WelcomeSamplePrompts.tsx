import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface SamplePrompt {
  label: string;
  prompt: string;
}

interface WelcomeSamplePromptsProps {
  prompts: SamplePrompt[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

export function WelcomeSamplePrompts({
  prompts,
  onSelect,
  disabled,
  className,
}: WelcomeSamplePromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-brand-gold/80">
        Try asking
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {prompts.map((item, i) => (
          <motion.button
            key={item.prompt}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSelect(item.prompt)}
            className="inline-flex w-fit max-w-full shrink-0 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-center text-[10px] font-medium leading-snug text-white/85 transition hover:border-brand-gold/50 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-[11px]"
          >
            {item.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
