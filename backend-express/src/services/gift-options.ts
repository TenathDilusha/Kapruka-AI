import { searchProducts, type KaprukaProduct } from "./kapruka-mcp.js";

export interface GiftOption {
  id: string;
  label: string;
  short: string;
  prompt: string;
  query: string;
  product_id: string | null;
  image_url: string | null;
  sample_product: string | null;
  price: { amount: number | null; currency: string } | null;
}

/** One bestseller per Kapruka product type (not occasion). */
const BESTSELLER_TYPES: Array<{
  id: string;
  typeLabel: string;
  query: string;
  category?: string;
}> = [
  { id: "chocolates", typeLabel: "Chocolates", query: "chocolate gift box", category: "Chocolates" },
  { id: "flowers", typeLabel: "Flowers", query: "flower bouquet", category: "Flowers" },
  { id: "cakes", typeLabel: "Cakes", query: "birthday cake", category: "Cakes" },
  { id: "gift-boxes", typeLabel: "Gift boxes", query: "gift box", category: "Gift boxes" },
  { id: "hampers", typeLabel: "Hampers", query: "gift hamper" },
  { id: "greeting-cards", typeLabel: "Greeting cards", query: "greeting card" },
];

function pickProduct(products: KaprukaProduct[]): KaprukaProduct | null {
  return (
    products.find((p) => p.image_url && p.in_stock)
    ?? products.find((p) => p.image_url)
    ?? products.find((p) => p.in_stock)
    ?? products[0]
    ?? null
  );
}

function truncateName(name: string, max = 42): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function fallbackOption(type: (typeof BESTSELLER_TYPES)[number]): GiftOption {
  return {
    id: type.id,
    label: type.typeLabel,
    short: type.typeLabel,
    prompt: `Show me bestselling ${type.typeLabel.toLowerCase()} on Kapruka`,
    query: type.query,
    product_id: null,
    image_url: null,
    sample_product: null,
    price: null,
  };
}

let optionsCache: { at: number; data: GiftOption[] } | null = null;
const OPTIONS_CACHE_MS = 10 * 60 * 1000;

async function searchTypeProduct(
  type: (typeof BESTSELLER_TYPES)[number],
): Promise<KaprukaProduct | null> {
  const attempts: Array<Parameters<typeof searchProducts>[0]> = [
    { q: type.query, category: type.category, limit: 8, sort: "bestseller", in_stock_only: true },
    { q: type.query, category: type.category, limit: 8, in_stock_only: true },
    { q: type.query, limit: 8, in_stock_only: true },
    { q: type.typeLabel, category: type.category, limit: 8, in_stock_only: true },
  ];

  for (const params of attempts) {
    try {
      const { results } = await searchProducts(params);
      const product = pickProduct(results);
      if (product?.image_url) return product;
    } catch {
      /* try next query */
    }
  }
  return null;
}

function sanitizeName(name: string): string {
  return name
    .replace(/â?n#(\d+);/gi, (_, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return "";
      }
    })
    .replace(/N#(\d+);/g, (_, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return "";
      }
    })
    .trim();
}

async function buildBestsellerOption(
  type: (typeof BESTSELLER_TYPES)[number],
): Promise<GiftOption | null> {
  const fallback = fallbackOption(type);

  try {
    const product = await searchTypeProduct(type);
    if (!product?.image_url) return null;

    const name = sanitizeName(product.name);
    return {
      id: product.id,
      label: type.typeLabel,
      short: truncateName(name),
      prompt: `Tell me about ${name} and add similar ${type.typeLabel.toLowerCase()} to my cart`,
      query: type.query,
      product_id: product.id,
      image_url: product.image_url,
      sample_product: name,
      price: product.price ?? null,
    };
  } catch {
    return null;
  }
}

export async function getGiftOptions(): Promise<GiftOption[]> {
  if (optionsCache && Date.now() - optionsCache.at < OPTIONS_CACHE_MS) {
    const hasImages = optionsCache.data.some((o) => o.image_url);
    if (hasImages) return optionsCache.data;
    optionsCache = null;
  }

  const settled = await Promise.all(BESTSELLER_TYPES.map((type) => buildBestsellerOption(type)));
  const withImages = settled.filter((o): o is GiftOption => Boolean(o?.image_url));
  const results =
    withImages.length > 0
      ? withImages
      : BESTSELLER_TYPES.map((type) => fallbackOption(type));

  if (results.some((o) => o.image_url)) {
    optionsCache = { at: Date.now(), data: results };
  }

  return results;
}
