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

/** Fix broken entity encoding from Kapruka catalog (e.g. N#8220; → "). */
export function sanitizeText(text: string): string {
  const decodeEntity = (code: string) => {
    const n = Number(code);
    try {
      return String.fromCodePoint(n);
    } catch {
      return "";
    }
  };

  return text
    .replace(/â?n#(\d+);/gi, (_, code) => decodeEntity(code))
    .replace(/N#(\d+);/g, (_, code) => decodeEntity(code))
    .replace(/&#(\d+);/g, (_, code) => decodeEntity(code))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .trim();
}

export function productKaprukaUrl(product: { id: string; name: string; url?: string | null }): string {
  if (product.url) return product.url;
  return `https://www.kapruka.com/servlet/cs?search=${encodeURIComponent(product.name)}`;
}
