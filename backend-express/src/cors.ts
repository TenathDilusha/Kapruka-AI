import type { CorsOptions } from "cors";

function normalizeOrigin(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Comma-separated FRONTEND_URL values; optional Vercel preview URLs when ALLOW_VERCEL_PREVIEWS=true */
export function createCorsOptions(): CorsOptions {
  const raw = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const allowed = raw
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
  const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = normalizeOrigin(origin);
      if (allowed.includes(normalized)) {
        callback(null, true);
        return;
      }
      if (allowVercelPreviews && /^https:\/\/[\w-]+\.vercel\.app$/.test(normalized)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin} (allowed: ${allowed.join(", ")})`));
    },
    credentials: true,
  };
}
