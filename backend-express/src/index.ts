import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { createCorsOptions } from "./cors.js";
import { chatRouter } from "./routes/chat.js";
import { kaprukaRouter } from "./routes/kapruka.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors(createCorsOptions()));
app.use(express.json());

app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    service: "backend-express",
    python_agent_url: process.env.PYTHON_AGENT_URL ?? null,
    frontend_url: process.env.FRONTEND_URL ?? null,
  });
});

app.use("/api/kapruka", kaprukaRouter);
app.use("/api/chat", chatRouter);

app.listen(port, () => {
  console.log(`Express backend listening on http://localhost:${port}`);
});
