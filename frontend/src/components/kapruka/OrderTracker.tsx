import { AnimatePresence, motion } from "framer-motion";
import { Package, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchMcpHealth, trackKaprukaOrder, type TrackOrderResult } from "@/lib/kapruka";
import { sanitizeText } from "@/lib/utils";

interface OrderTrackerModalProps {
  open: boolean;
  onClose: () => void;
}

export function OrderTrackerModal({ open, onClose }: OrderTrackerModalProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setError(undefined);
    setResult(null);
  }, [open]);

  const handleTrack = async () => {
    const num = orderNumber.trim();
    if (!num) return;
    setLoading(true);
    setError(undefined);
    setResult(null);
    try {
      const data = await trackKaprukaOrder(num);
      if (data.raw && !data.status) {
        setError(sanitizeText(data.raw));
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not track order. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close order tracker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-kapruka/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="fixed inset-x-4 top-[12%] z-50 mx-auto max-w-md rounded-2xl border border-brand-purple/15 bg-white p-5 shadow-2xl shadow-brand-purple/20"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple text-white">
                  <Package className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-bold text-brand-purple">Track Kapruka order</h2>
                  <p className="text-xs text-text-muted">Use the order number from your email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-brand-purple hover:bg-brand-purple-light"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                placeholder="Order number from email"
                className="h-10 flex-1 rounded-xl border border-brand-purple/15 bg-white px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={loading || !orderNumber.trim()}
                onClick={handleTrack}
                className="h-10 shrink-0 whitespace-nowrap px-4"
              >
                <Search className="h-3.5 w-3.5" />
                Track
              </Button>
            </div>

            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-brand-purple/10 bg-brand-purple-light/40 p-3 text-sm text-brand-purple"
              >
                <p className="font-semibold">{result.status ?? "Order found"}</p>
                {result.recipient?.name && (
                  <p className="mt-1 text-xs text-text-muted">To: {result.recipient.name}</p>
                )}
                {result.items && result.items.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-text-muted">
                    {result.items.map((item, i) => (
                      <li key={i}>
                        • {item.name}
                        {item.quantity ? ` × ${item.quantity}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
                {result.timeline && result.timeline.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-brand-purple/10 pt-2 text-xs">
                    {result.timeline.slice(0, 4).map((step, i) => (
                      <li key={i} className="text-text-muted">
                        {step.status}
                        {step.at ? ` · ${step.at}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function McpStatusBadge() {
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    fetchMcpHealth()
      .then((h) => setLive(h.mcp?.status === "ok"))
      .catch(() => setLive(false));
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live === null ? "bg-white/40" : live ? "bg-emerald-400" : "bg-red-400"}`}
      />
      Kapruka MCP {live === null ? "…" : live ? "Live" : "Offline"}
      <span className="text-white/30">· 60 req/min · guest checkout</span>
    </span>
  );
}
