import type { CorsOptions } from "cors";

/** Comma-separated FRONTEND_URL values; optional Vercel preview URLs when ALLOW_VERCEL_PREVIEWS=true */
export function createCorsOptions(): CorsOptions {
  const raw = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const allowed = raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, "");
      if (allowed.includes(normalized)) {
        callback(null, true);
        return;
      }
      if (allowVercelPreviews && /^https:\/\/[\w-]+\.vercel\.app$/.test(normalized)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  };
}
