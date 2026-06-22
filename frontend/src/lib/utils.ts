import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | null | undefined, currency = "LKR") {
  if (amount == null) return "Price on request";
  if (currency === "LKR") return `LKR ${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}
