import { searchProducts, type KaprukaProduct } from "./kapruka-mcp.js";

export interface GiftOption {
  id: string;
  label: string;
  short: string;
  prompt: string;
  query: string;
  image_url: string | null;
  sample_product: string | null;
  price: { amount: number | null; currency: string } | null;
}

const OPTION_QUERIES: Array<{
  id: string;
  label: string;
  short: string;
  prompt: string;
  query: string;
  category?: string;
}> = [
  {
    id: "birthday",
    label: "Birthday gifts",
    short: "Birthday",
    prompt: "Birthday gift for mom under 5000",
    query: "birthday",
  },
  {
    id: "anniversary",
    label: "Anniversary roses",
    short: "Anniversary",
    prompt: "Anniversary roses and chocolates",
    query: "roses",
  },
  {
    id: "valentine",
    label: "Valentine specials",
    short: "Valentine",
    prompt: "Valentine gift mokakda hari?",
    query: "valentine",
  },
  {
    id: "chocolates",
    label: "Chocolate boxes",
    short: "Chocolates",
    prompt: "Show me premium chocolate gift boxes",
    query: "chocolate",
    category: "chocolates",
  },
  {
    id: "flowers",
    label: "Fresh flowers",
    short: "Flowers",
    prompt: "Beautiful flower bouquets for delivery",
    query: "bouquet",
  },
  {
    id: "wedding",
    label: "Wedding gifts",
    short: "Wedding",
    prompt: "Wedding gift ideas",
    query: "gift box",
  },
];

function pickProduct(products: KaprukaProduct[]): KaprukaProduct | null {
  return products.find((p) => p.image_url) ?? products[0] ?? null;
}

let optionsCache: { at: number; data: GiftOption[] } | null = null;
const OPTIONS_CACHE_MS = 10 * 60 * 1000;

async function buildOption(opt: (typeof OPTION_QUERIES)[number]): Promise<GiftOption> {
  const fallback: GiftOption = {
    id: opt.id,
    label: opt.label,
    short: opt.short,
    prompt: opt.prompt,
    query: opt.query,
    image_url: null,
    sample_product: null,
    price: null,
  };

  try {
    const products = await searchProducts({
      q: opt.query,
      category: opt.category,
      limit: 3,
    });
    const product = pickProduct(products);
    return {
      ...fallback,
      image_url: product?.image_url ?? null,
      sample_product: product?.name ?? null,
      price: product?.price ?? null,
    };
  } catch {
    return fallback;
  }
}

export async function getGiftOptions(): Promise<GiftOption[]> {
  if (optionsCache && Date.now() - optionsCache.at < OPTIONS_CACHE_MS) {
    return optionsCache.data;
  }

  const results: GiftOption[] = [];
  for (const opt of OPTION_QUERIES) {
    results.push(await buildOption(opt));
  }

  optionsCache = { at: Date.now(), data: results };
  return results;
}
