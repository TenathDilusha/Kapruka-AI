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
}> = [
  { id: "chocolates", typeLabel: "Chocolates", query: "chocolate" },
  { id: "flowers", typeLabel: "Flowers", query: "roses bouquet" },
  { id: "cakes", typeLabel: "Cakes", query: "cake" },
  { id: "gift-boxes", typeLabel: "Gift boxes", query: "gift box" },
  { id: "hampers", typeLabel: "Hampers", query: "hamper" },
  { id: "greeting-cards", typeLabel: "Greeting cards", query: "greeting card" },
];

function pickProduct(products: KaprukaProduct[]): KaprukaProduct | null {
  return products.find((p) => p.image_url && p.in_stock) ?? products.find((p) => p.image_url) ?? products[0] ?? null;
}

function truncateName(name: string, max = 42): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

let optionsCache: { at: number; data: GiftOption[] } | null = null;
const OPTIONS_CACHE_MS = 10 * 60 * 1000;

async function buildBestsellerOption(
  type: (typeof BESTSELLER_TYPES)[number],
): Promise<GiftOption | null> {
  const fallback: GiftOption = {
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

  try {
    const { results: products } = await searchProducts({
      q: type.query,
      limit: 5,
      sort: "bestseller",
      in_stock_only: true,
    });
    const product = pickProduct(products);
    if (!product) return fallback;

    const name = product.name.trim();
    return {
      id: product.id,
      label: type.typeLabel,
      short: truncateName(name),
      prompt: `Tell me about ${name} and add similar ${type.typeLabel.toLowerCase()} to my cart`,
      query: type.query,
      product_id: product.id,
      image_url: product.image_url ?? null,
      sample_product: name,
      price: product.price ?? null,
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
  for (const type of BESTSELLER_TYPES) {
    results.push((await buildBestsellerOption(type)) ?? {
      id: type.id,
      label: type.typeLabel,
      short: type.typeLabel,
      prompt: `Show me bestselling ${type.typeLabel.toLowerCase()} on Kapruka`,
      query: type.query,
      product_id: null,
      image_url: null,
      sample_product: null,
      price: null,
    });
  }

  optionsCache = { at: Date.now(), data: results };
  return results;
}
