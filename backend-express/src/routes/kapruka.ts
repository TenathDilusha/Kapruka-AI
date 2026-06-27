import { Router } from "express";

import { validateCartDelivery } from "../services/delivery-validation.js";
import {
  checkDelivery,
  getMcpHealth,
  getMcpStats,
  getProduct,
  listCategories,
  listDeliveryCities,
  searchProducts,
  trackOrder,
} from "../services/kapruka-mcp.js";

export const kaprukaRouter = Router();

kaprukaRouter.get("/health", async (_req, res) => {
  try {
    const [local, mcp] = await Promise.all([
      Promise.resolve({ status: "ok", service: "tharu-ai" }),
      getMcpHealth().catch(() => ({ status: "unreachable" })),
    ]);
    res.json({ local, mcp, endpoint: process.env.KAPRUKA_MCP_URL ?? "https://mcp.kapruka.com/mcp" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Health check failed" });
  }
});

kaprukaRouter.get("/stats", async (_req, res) => {
  try {
    const stats = await getMcpStats();
    res.json(stats);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "MCP stats unavailable" });
  }
});

kaprukaRouter.get("/categories", async (req, res) => {
  try {
    const depth = Number(req.query.depth ?? 1);
    const categories = await listCategories(depth);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list categories" });
  }
});

kaprukaRouter.get("/cities", async (req, res) => {
  try {
    const query = String(req.query.q ?? req.query.query ?? "");
    if (!query.trim()) {
      res.status(400).json({ error: "q query parameter required" });
      return;
    }
    const limit = Number(req.query.limit ?? 20);
    const cities = await listDeliveryCities(query, limit);
    res.json({ cities });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list cities" });
  }
});

kaprukaRouter.get("/products/:productId", async (req, res) => {
  try {
    const product = await getProduct(req.params.productId, String(req.query.currency ?? "LKR"));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to get product" });
  }
});

kaprukaRouter.get("/products", async (req, res) => {
  try {
    const q = String(req.query.q ?? "");
    if (!q.trim()) {
      res.status(400).json({ error: "q query parameter required" });
      return;
    }
    const result = await searchProducts({
      q,
      category: req.query.category ? String(req.query.category) : undefined,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      sort: req.query.sort ? String(req.query.sort) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 12,
      cursor: req.query.cursor ? String(req.query.cursor) : undefined,
      currency: req.query.currency ? String(req.query.currency) : undefined,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Search failed" });
  }
});

kaprukaRouter.post("/delivery/validate-cart", async (req, res) => {
  try {
    const { city, delivery_date, cart } = req.body as {
      city?: string;
      delivery_date?: string;
      cart?: Array<{ product_id: string; quantity: number; price: number; currency: string; name: string }>;
    };
    if (!city || !delivery_date || !cart?.length) {
      res.status(400).json({ error: "city, delivery_date, and cart required" });
      return;
    }
    const result = await validateCartDelivery(cart, city, delivery_date);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Validation failed" });
  }
});

kaprukaRouter.post("/delivery/check", async (req, res) => {
  try {
    const { city, delivery_date, product_id } = req.body as {
      city?: string;
      delivery_date?: string;
      product_id?: string;
    };
    if (!city || !delivery_date) {
      res.status(400).json({ error: "city and delivery_date required" });
      return;
    }
    const result = await checkDelivery({ city, delivery_date, product_id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Delivery check failed" });
  }
});

kaprukaRouter.post("/orders/track", async (req, res) => {
  try {
    const { order_number } = req.body as { order_number?: string };
    if (!order_number?.trim()) {
      res.status(400).json({ error: "order_number required" });
      return;
    }
    const result = await trackOrder(order_number.trim());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Track order failed" });
  }
});
