export type UserLanguage = "en" | "si" | "singlish";

const SAMPLE_PROMPTS = [
  {
    label: "Birthday gift ideas",
    prompt: "Birthday gift ideas for my mom under LKR 5000",
  },
  {
    label: "Roses and chocolates",
    prompt: "Anniversary gift with roses and chocolates",
  },
  {
    label: "Gifts under LKR 5,000",
    prompt: "Gift ideas under LKR 5000 for delivery in Colombo",
  },
] as const;

/** Pick `count` random sample prompts from the pool (default 3 of 4). */
export function getSamplePrompts(count = 3): Array<{ label: string; prompt: string }> {
  const pool = [...SAMPLE_PROMPTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export const UI: Record<
  UserLanguage,
  {
    welcome: string;
    welcomeSubtitle: string;
    placeholder: string;
    cart: string;
    cartEmpty: string;
    cartItems: (qty: number, lines: number) => string;
    cartSubtotal: string;
    proceedCheckout: string;
    giftMessageLabel: string;
    giftMessagePlaceholder: string;
    giftMessageHint: string;
    deliveryDateHint: string;
    deliveryUnavailable: string;
    addToCartSuccess: (name: string, qty: number, total: string) => string;
    trust: [string, string, string];
    suggestions: Array<{ short: string; prompt: string }>;
    samplePrompts: Array<{ label: string; prompt: string }>;
  }
> = {
  en: {
    welcome: "Ayubowan! I'm Tharu — your Kapruka gift concierge.",
    welcomeSubtitle:
      "Tell me the occasion, who it's for, and your budget. I'll curate gifts from Sri Lanka's largest catalog.",
    placeholder: "Describe the perfect gift…",
    cart: "Cart",
    cartEmpty: "Your cart is empty. Add a few gifts — multi-item orders ship together!",
    cartItems: (qty, lines) => `${qty} item${qty === 1 ? "" : "s"} · ${lines} product${lines === 1 ? "" : "s"}`,
    cartSubtotal: "Subtotal",
    proceedCheckout: "Proceed to checkout",
    giftMessageLabel: "Gift message",
    giftMessagePlaceholder: "Write a personal note — printed on the Kapruka gift card",
    giftMessageHint: "This message goes to your recipient with the order.",
    deliveryDateHint: "Perishable gifts (flowers, cakes) deliver best within 1–3 days.",
    deliveryUnavailable: "Delivery not available for this city/date — try another date.",
    addToCartSuccess: (name, qty, total) =>
      `Added ${name}. Cart: ${qty} item(s) · ${total}. Add more gifts or checkout when ready!`,
    trust: ["Live Kapruka catalog", "Island-wide delivery", "Guest checkout"],
    suggestions: [
      { short: "Chocolates", prompt: "Show me bestselling chocolate gift boxes" },
      { short: "Flowers", prompt: "Best flower bouquets for delivery today" },
      { short: "Cakes", prompt: "Popular celebration cakes on Kapruka" },
      { short: "Gift boxes", prompt: "Top gift boxes and hampers" },
    ],
    samplePrompts: [...SAMPLE_PROMPTS],
  },
  si: {
    welcome: "ආයුබෝවන්! මම තාරු — ඔබේ Kapruka gift concierge.",
    welcomeSubtitle:
      "Occasion එක, gift එක කාටද, budget එක කියන්න. ශ්‍රී ලanka's විශalතම catalog එකෙන් මම තෝරා දෙනවා.",
    placeholder: "හොඳ gift එකක් describe කරන්න… (සිංහල / English)",
    cart: "Cart",
    cartEmpty: "Cart එක හිස්. Gift කිහිපයක් add කරන්න — එක order එකකින් යවනවා!",
    cartItems: (qty, lines) => `${qty} items · products ${lines}`,
    cartSubtotal: "මුළු ගණන",
    proceedCheckout: "Checkout එකට යන්න",
    giftMessageLabel: "Gift message / සුබ පැතුම",
    giftMessagePlaceholder: "ලබන්නාට පණිපි — Kapruka gift card එකේ මුද්‍රණය වෙනවා",
    giftMessageHint: "මේ message එka order එaka සමඟ recipient ට යනවා.",
    deliveryDateHint: "Mal (flowers, cakes) 1–3 දින ඇතුළත deliver කරන්න හොඳයි.",
    deliveryUnavailable: "මේ city/date එකට delivery නැහැ — වෙන දිනයක් try කරන්න.",
    addToCartSuccess: (name, qty, total) =>
      `${name} cart එකට add කළා. ${qty} items · ${total}. තව gifts add කරන්න හෝ checkout!`,
    trust: ["Live Kapruka catalog", "දිවයින පුරා delivery", "Guest checkout"],
    suggestions: [
      { short: "Chocolates", prompt: "Kapruka bestselling chocolate boxes" },
      { short: "Flowers", prompt: "Popular flower bouquets delivery" },
      { short: "Cakes", prompt: "Celebration cakes bestsellers" },
      { short: "Gift boxes", prompt: "Top gift boxes and hampers" },
    ],
    samplePrompts: [...SAMPLE_PROMPTS],
  },
  singlish: {
    welcome: "Ayubowan machan! Tharu here — your Kapruka gift concierge.",
    welcomeSubtitle:
      "Occasion eka, kattiya kiyala gift eka denna oneda, budget eka kiyapan. Kapruka catalog eken hari picks gannawa.",
    placeholder: "Perfect gift eka describe karanna… (Tanglish / Sinhala / English)",
    cart: "Cart",
    cartEmpty: "Cart eka empty. Gift kochcharak add karanna — ek order ekakata yawanawa!",
    cartItems: (qty, lines) => `${qty} items · ${lines} products`,
    cartSubtotal: "Total",
    proceedCheckout: "Checkout ekata yanna",
    giftMessageLabel: "Gift message / paanipiya",
    giftMessagePlaceholder: "Recipient ta message ekak — Kapruka gift card eke print wenawa",
    giftMessageHint: "Meka order eka gana recipient ta yana message eka.",
    deliveryDateHint: "Flowers/cakes neme 1–3 days athara deliver karanna hondai.",
    deliveryUnavailable: "Me city/date ekata delivery na — verdi date ekak try karanna.",
    addToCartSuccess: (name, qty, total) =>
      `${name} cart ekata add una. ${qty} items · ${total}. Tava gifts add karanna puluwan!`,
    trust: ["Live Kapruka catalog", "Island-wide delivery", "Guest checkout"],
    suggestions: [
      { short: "Chocolates", prompt: "Bestselling chocolate gift boxes show karanna" },
      { short: "Flowers", prompt: "Popular flower bouquets delivery ekata" },
      { short: "Cakes", prompt: "Celebration cakes bestsellers mokakda" },
      { short: "Gift boxes", prompt: "Top gift boxes and hampers" },
    ],
    samplePrompts: [...SAMPLE_PROMPTS],
  },
};

export function detectLanguage(text: string): UserLanguage {
  if (/[\u0D80-\u0DFF]/.test(text)) return "si";
  const lower = text.toLowerCase();
  const markers = [
    "mokak",
    "hari",
    "ekak",
    "kohomada",
    "machan",
    "bro",
    "dan",
    "nane",
    "aiyoo",
    "deyak",
    "ganna",
    "dannam",
    "yanna",
    "kattiya",
    "amma",
    "thaththa",
  ];
  if (markers.some((m) => lower.includes(m))) return "singlish";
  return "en";
}
