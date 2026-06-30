const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

import type { Product } from "../types";

export interface KaprukaCategory {
  name: string;
  url?: string;
}

export interface DeliveryCity {
  name: string;
  aliases?: string[];
}

export interface DeliveryCheckResult {
  city: string;
  checked_date: string;
  available: boolean;
  rate?: number;
  currency?: string;
  perishable_warning?: string;
  reason?: string;
}

export interface TrackOrderResult {
  order_number?: string;
  status?: string;
  recipient?: { name?: string; phone?: string };
  items?: Array<{ name: string; quantity?: number }>;
  timeline?: Array<{ status: string; at?: string }>;
  raw?: string;
}

export interface McpHealthResponse {
  local: { status: string; service: string };
  mcp: { status: string };
  endpoint: string;
}

export async function fetchMcpHealth(): Promise<McpHealthResponse> {
  const res = await fetch(`${API_URL}/api/kapruka/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchCategories(): Promise<KaprukaCategory[]> {
  const res = await fetch(`${API_URL}/api/kapruka/categories`);
  if (!res.ok) return [];
  const data = (await res.json()) as { categories: KaprukaCategory[] };
  return data.categories ?? [];
}

export async function fetchDeliveryCities(query: string): Promise<DeliveryCity[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_URL}/api/kapruka/cities?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { cities: DeliveryCity[] };
  return data.cities ?? [];
}

export async function fetchProductDetails(productId: string): Promise<Product | null> {
  const res = await fetch(`${API_URL}/api/kapruka/products/${encodeURIComponent(productId)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { product: Product & { description?: string } };
  const p = data.product;
  return {
    id: p.id,
    name: p.name,
    summary: p.summary ?? p.description?.slice(0, 160),
    description: p.description,
    price: p.price,
    image_url: p.image_url,
    url: p.url,
    in_stock: p.in_stock,
    category: p.category,
    variants: p.variants,
    stock_level: p.stock_level,
  };
}

export async function validateCartDelivery(args: {
  city: string;
  delivery_date: string;
  cart: Array<{ product_id: string; quantity: number; price: number; currency: string; name: string }>;
}): Promise<{
  ok: boolean;
  available: boolean;
  message: string;
  rate?: number;
  currency?: string;
  perishable_warning?: string;
}> {
  const res = await fetch(`${API_URL}/api/kapruka/delivery/validate-cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error("Delivery validation failed");
  return res.json();
}

export async function checkDeliveryAvailability(args: {
  city: string;
  delivery_date: string;
  product_id?: string;
}): Promise<DeliveryCheckResult> {
  const res = await fetch(`${API_URL}/api/kapruka/delivery/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error("Delivery check failed");
  return res.json();
}

export async function trackKaprukaOrder(orderNumber: string): Promise<TrackOrderResult> {
  const res = await fetch(`${API_URL}/api/kapruka/orders/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_number: orderNumber }),
  });
  if (!res.ok) throw new Error("Track order failed");
  return res.json();
}

export async function searchKaprukaProducts(q: string, limit = 12): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/kapruka/products?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results: Product[] };
  return data.results ?? [];
}
