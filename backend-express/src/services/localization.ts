import type { Session } from "./session-store.js";

type Lang = Session["preferredLanguage"];

export function extractGiftMessage(text: string): string | null {
  const patterns = [
    /(?:gift\s*)?message[:\s]+["']?(.+?)["']?$/i,
    /(?:wish|note|paanipiya|පණිපි|සුබ\s*පැතුම)[:\s]+["']?(.+?)["']?$/i,
    /write[:\s]+["'](.+?)["']$/i,
    /card\s*(?:should\s*)?say[:\s]+["']?(.+?)["']?$/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

export function cartAddMessage(
  lang: Lang,
  name: string,
  stats: { lineCount: number; totalQty: number; total: string },
): string {
  const multi = stats.lineCount > 1 || stats.totalQty > 1;
  if (lang === "si") {
    return multi
      ? `${name} cart එකට add කළා. දැන් items ${stats.totalQty} (${stats.lineCount} products) · ${stats.total}. තව gifts add කරන්න හෝ checkout!`
      : `${name} cart එකට add කළා · ${stats.total}.`;
  }
  if (lang === "singlish") {
    return multi
      ? `${name} cart ekata add una machan! ${stats.totalQty} items (${stats.lineCount} products) · ${stats.total}. Tava gifts add karanna puluwan!`
      : `${name} cart ekata add una · ${stats.total}.`;
  }
  return multi
    ? `Added ${name}. Your cart now has ${stats.totalQty} items across ${stats.lineCount} products · ${stats.total}. Keep adding or checkout!`
    : `Added ${name} · ${stats.total}. Open your cart to add more gifts or checkout.`;
}

export function resolveLanguage(
  message: string,
  hint?: Lang,
  sessionLang?: Lang,
): Lang {
  if (/[\u0D80-\u0DFF]/.test(message)) return "si";
  const lower = message.toLowerCase();
  const tanglish = ["mokak", "hari", "ekak", "kohomada", "machan", "dan", "nane", "aiyoo", "deyak", "ganna", "yanna", "kattiya"];
  if (tanglish.some((m) => lower.includes(m))) return "singlish";
  return hint ?? sessionLang ?? "en";
}
