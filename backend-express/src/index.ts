import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { chatRouter } from "./routes/chat.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend-express" });
});

app.use("/api/chat", chatRouter);

app.listen(port, () => {
  console.log(`Express backend listening on http://localhost:${port}`);
});
