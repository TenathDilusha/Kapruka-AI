import type { CartItem } from "../types/index.js";
import { checkDelivery } from "./kapruka-mcp.js";

export interface CartDeliveryValidation {
  ok: boolean;
  available: boolean;
  message: string;
  rate?: number;
  currency?: string;
  perishable_warning?: string;
  checked_products: string[];
}

export async function validateCartDelivery(
  cart: CartItem[],
  city: string,
  deliveryDate: string,
): Promise<CartDeliveryValidation> {
  if (cart.length === 0) {
    return { ok: false, available: false, message: "Cart is empty", checked_products: [] };
  }

  const productIds = [...new Set(cart.map((c) => c.product_id))];
  let combinedRate = 0;
  let currency = cart[0]?.currency ?? "LKR";
  const warnings: string[] = [];

  for (const productId of productIds) {
    const result = (await checkDelivery({
      city,
      delivery_date: deliveryDate,
      product_id: productId,
    })) as {
      available?: boolean;
      reason?: string;
      rate?: number;
      currency?: string;
      perishable_warning?: string;
    };

    if (result.available === false) {
      return {
        ok: false,
        available: false,
        message: result.reason ?? `Delivery unavailable for one of your items on ${deliveryDate}.`,
        checked_products: productIds,
      };
    }

    if (result.rate != null) combinedRate = Math.max(combinedRate, result.rate);
    if (result.currency) currency = result.currency;
    if (result.perishable_warning) warnings.push(result.perishable_warning);
  }

  const uniqueWarnings = [...new Set(warnings)];
  return {
    ok: true,
    available: true,
    message: `Delivery available to ${city} on ${deliveryDate}.`,
    rate: combinedRate || undefined,
    currency,
    perishable_warning: uniqueWarnings[0],
    checked_products: productIds,
  };
}

export function isDeliveryDateAllowed(dateStr: string): { ok: boolean; reason?: string } {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { ok: false, reason: "Invalid date" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const max = new Date(today);
  max.setDate(max.getDate() + 30);

  if (date < tomorrow) {
    return { ok: false, reason: "Delivery date must be tomorrow or later." };
  }
  if (date > max) {
    return { ok: false, reason: "Delivery date must be within the next 30 days." };
  }
  return { ok: true };
}
