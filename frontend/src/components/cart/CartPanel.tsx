import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
  Smartphone,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { checkDeliveryAvailability, fetchDeliveryCities, validateCartDelivery, type DeliveryCity } from "@/lib/kapruka";
import { UI } from "@/lib/i18n";
import { cn, formatPrice, sanitizeText } from "@/lib/utils";
import type { CartItem } from "@/types";

const PAYMENT_METHODS = [
  { icon: CreditCard, label: "Visa & Mastercard" },
  { icon: CreditCard, label: "Amex" },
  { icon: Smartphone, label: "Mobile banking" },
  { icon: Truck, label: "Cash on delivery" },
];

interface CartPanelProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  giftMessage?: string;
  onGiftMessageChange?: (message: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export function CartPanel({
  open,
  onClose,
  cart,
  giftMessage = "",
  onGiftMessageChange,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: CartPanelProps) {
  const t = UI.en;
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
  const currency = cart[0]?.currency ?? "LKR";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-brand-purple/20 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-brand-purple/15 bg-white shadow-2xl shadow-brand-purple/20"
          >
            <div className="flex items-center justify-between border-b border-brand-purple/10 bg-gradient-to-r from-brand-purple-light to-white px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple text-white">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-bold text-brand-purple">{t.cart}</h2>
                  <p className="text-xs text-text-muted">
                    {cart.length === 0 ? t.cartEmpty : t.cartItems(totalQty, cart.length)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-brand-purple hover:bg-brand-purple-light"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingCart className="h-12 w-12 text-brand-purple/30" />
                  <p className="text-sm text-text-muted">{t.cartEmpty}</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li
                      key={item.product_id}
                      className="flex gap-3 rounded-2xl border border-brand-purple/10 bg-brand-purple-light/20 p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-brand-purple/30">
                            <ShoppingCart className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-brand-purple">
                          {sanitizeText(item.name)}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-brand-purple">
                          {formatPrice(item.price * item.quantity, item.currency)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center rounded-lg border border-brand-purple/20 bg-white">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                              className="p-1.5 text-brand-purple hover:bg-brand-purple-light"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[1.5rem] text-center text-xs font-semibold text-brand-purple">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                              className="p-1.5 text-brand-purple hover:bg-brand-purple-light"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(item.product_id)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-brand-purple/10 bg-white p-4">
              {cart.length > 0 && onGiftMessageChange && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-purple">
                    {t.giftMessageLabel}
                  </label>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => onGiftMessageChange(e.target.value)}
                    rows={2}
                    placeholder={t.giftMessagePlaceholder}
                    className="w-full rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                  />
                  <p className="mt-1 text-[10px] text-text-muted">{t.giftMessageHint}</p>
                </div>
              )}

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-text-muted">{t.cartSubtotal}</span>
                <span className="text-lg font-bold text-brand-purple">{formatPrice(total, currency)}</span>
              </div>

              <div className="mb-4 rounded-xl border border-brand-purple/10 bg-brand-purple-light/30 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-purple">
                  Payment on Kapruka
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 text-[10px] font-medium text-brand-purple/80"
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                disabled={cart.length === 0}
                onClick={onCheckout}
              >
                {t.proceedCheckout}
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

interface CheckoutFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: CheckoutDetails) => void;
  loading?: boolean;
  cartTotal: number;
  currency?: string;
  cart?: CartItem[];
  defaultGiftMessage?: string;
}

export interface CheckoutDetails {
  recipient: { name: string; phone: string };
  delivery: { address: string; city: string; date: string; instructions?: string };
  sender: { name: string };
  gift_message?: string;
}

export function CheckoutForm({
  open,
  onClose,
  onSubmit,
  loading,
  cartTotal,
  currency = "LKR",
  cart = [],
  defaultGiftMessage = "",
}: CheckoutFormProps) {
  const t = UI.en;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const defaultDate = tomorrow.toISOString().slice(0, 10);
  const minDate = defaultDate;
  const maxDateStr = maxDate.toISOString().slice(0, 10);

  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(defaultDate);
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [deliveryNote, setDeliveryNote] = useState<string>();
  const [deliveryOk, setDeliveryOk] = useState(false);
  const [giftMessage, setGiftMessage] = useState(defaultGiftMessage);

  useEffect(() => {
    if (open) setGiftMessage(defaultGiftMessage);
  }, [open, defaultGiftMessage]);

  useEffect(() => {
    if (!open) return;
    const q = cityQuery.trim();
    if (q.length < 2) {
      setCities([]);
      return;
    }
    const t = setTimeout(() => {
      fetchDeliveryCities(q).then(setCities).catch(() => setCities([]));
    }, 300);
    return () => clearTimeout(t);
  }, [cityQuery, open]);

  useEffect(() => {
    if (!open || !city.trim() || !deliveryDate || cart.length === 0) {
      setDeliveryOk(false);
      return;
    }
    const timer = setTimeout(() => {
      validateCartDelivery({ city, delivery_date: deliveryDate, cart })
        .then((r) => {
          setDeliveryOk(r.ok && r.available);
          if (r.ok && r.available) {
            const rate = r.rate != null ? ` Delivery fee: ${formatPrice(r.rate, r.currency ?? currency)}.` : "";
            setDeliveryNote(`✓ ${r.message}${rate}${r.perishable_warning ? ` ${r.perishable_warning}` : ""}`);
          } else {
            setDeliveryNote(r.message || UI.en.deliveryUnavailable);
          }
        })
        .catch(async () => {
          const r = await checkDeliveryAvailability({
            city,
            delivery_date: deliveryDate,
            product_id: cart[0]?.product_id,
          }).catch(() => null);
          if (r?.available) {
            setDeliveryOk(true);
            setDeliveryNote(`✓ Delivery available.${r.perishable_warning ? ` ${r.perishable_warning}` : ""}`);
          } else {
            setDeliveryOk(false);
            setDeliveryNote(UI.en.deliveryUnavailable);
          }
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [city, deliveryDate, open, cart, currency]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-brand-purple/25 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed inset-x-4 top-[8%] z-50 mx-auto max-h-[84vh] max-w-lg overflow-y-auto rounded-2xl border border-brand-purple/15 bg-white shadow-2xl shadow-brand-purple/20 sm:inset-x-auto"
          >
            <form
              className="p-5"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                onSubmit({
                  recipient: {
                    name: String(fd.get("recipientName") ?? ""),
                    phone: String(fd.get("recipientPhone") ?? ""),
                  },
                  delivery: {
                    address: String(fd.get("address") ?? ""),
                    city: city || String(fd.get("city") ?? ""),
                    date: deliveryDate || String(fd.get("date") ?? defaultDate),
                    instructions: String(fd.get("instructions") ?? "") || undefined,
                  },
                  sender: { name: String(fd.get("senderName") ?? "") },
                  gift_message: giftMessage.trim() || undefined,
                });
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-brand-purple">Checkout</h2>
                  <p className="text-sm text-text-muted">
                    {cart.length} product{cart.length === 1 ? "" : "s"} · {formatPrice(cartTotal, currency)}
                  </p>
                </div>
                <button type="button" onClick={onClose} className="rounded-lg p-1 text-brand-purple hover:bg-brand-purple-light">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-purple">
                  Recipient
                </legend>
                <input
                  name="recipientName"
                  required
                  placeholder="Recipient name"
                  className="w-full rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                />
                <input
                  name="recipientPhone"
                  required
                  placeholder="Phone (+94…)"
                  className="w-full rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                />
              </fieldset>

              <fieldset className="mt-4 space-y-3">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-purple">
                  Delivery
                </legend>
                <input
                  name="address"
                  required
                  placeholder="Delivery address"
                  className="w-full rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative col-span-2 sm:col-span-1">
                    <input
                      name="city"
                      required
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setCityQuery(e.target.value);
                      }}
                      placeholder="City (e.g. Colombo 03)"
                      list="kapruka-cities"
                      autoComplete="off"
                      className="w-full rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                    />
                    <datalist id="kapruka-cities">
                      {cities.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                  <input
                    name="date"
                    type="date"
                    required
                    min={minDate}
                    max={maxDateStr}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                  />
                </div>
                <p className="text-[10px] text-text-muted">{t.deliveryDateHint}</p>
                {deliveryNote && (
                  <p
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs leading-relaxed",
                      deliveryOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700",
                    )}
                  >
                    {sanitizeText(deliveryNote)}
                  </p>
                )}
                <input
                  name="instructions"
                  placeholder="Delivery instructions (optional)"
                  className="w-full rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                />
              </fieldset>

              <fieldset className="mt-4 space-y-3">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-purple">
                  From you
                </legend>
                <input
                  name="senderName"
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-brand-purple/20 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15"
                />
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-purple">
                  {t.giftMessageLabel}
                </label>
                <textarea
                  name="giftMessage"
                  rows={3}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder={t.giftMessagePlaceholder}
                  className="w-full rounded-xl border border-brand-gold/40 bg-brand-gold/5 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                />
                <p className="text-[10px] text-text-muted">{t.giftMessageHint}</p>
              </fieldset>

              <div className={cn("mt-4 rounded-xl border border-brand-purple/10 bg-brand-purple-light/40 p-3")}>
                <p className="text-xs font-semibold text-brand-purple">Accepted payment methods</p>
                <p className="mt-1 text-[11px] text-text-muted">
                  You&apos;ll complete payment securely on Kapruka — Visa, Mastercard, Amex, mobile banking, and cash on delivery where available.
                </p>
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="mt-4 w-full"
                disabled={loading || !deliveryOk}
              >
                {loading ? "Creating order…" : "Place order & pay on Kapruka"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
