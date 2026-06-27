import { Router } from "express";

import { getGiftOptions } from "../services/gift-options.js";
import { handleChatMessage, handleCheckout } from "../services/orchestrator.js";
import { getCart } from "../services/session-store.js";

export const chatRouter = Router();

chatRouter.get("/options", async (_req, res) => {
  try {
    const options = await getGiftOptions();
    res.json({ options });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load options" });
  }
});

chatRouter.post("/", async (req, res) => {
  try {
    const { sessionId, message, action } = req.body as {
      sessionId?: string;
      message?: string;
      action?: {
        type: "add_to_cart" | "remove_from_cart" | "update_cart";
        productId: string;
        name?: string;
        price?: number;
        currency?: string;
        image_url?: string;
        quantity?: number;
      };
    };

    if (!message && !action) {
      res.status(400).json({ error: "message or action required" });
      return;
    }

    const result = await handleChatMessage(sessionId, message ?? "", action, {
      languageHint: (req.body as { languageHint?: "en" | "si" | "singlish" }).languageHint,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Chat failed" });
  }
});

chatRouter.post("/checkout", async (req, res) => {
  try {
    const { sessionId, recipient, delivery, sender, gift_message } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }
    const result = await handleCheckout(sessionId, { recipient, delivery, sender, gift_message });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Checkout failed" });
  }
});

chatRouter.get("/cart/:sessionId", (req, res) => {
  res.json({ cart: getCart(req.params.sessionId) });
});

// SSE streaming for status updates during chat
chatRouter.post("/stream", async (req, res) => {
  const { sessionId, message, languageHint } = req.body as {
    sessionId?: string;
    message: string;
    languageHint?: "en" | "si" | "singlish";
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send("status", { text: "Connecting to Tharu..." });

    const session = sessionId;
    send("status", { text: "Thinking..." });

    const result = await handleChatMessage(session, message, undefined, { languageHint });
    for (const update of result.statusUpdates) {
      send("status", { text: update });
    }
    send("message", result);
    send("done", {});
  } catch (err) {
    send("error", { message: err instanceof Error ? err.message : "Failed" });
  } finally {
    res.end();
  }
});
