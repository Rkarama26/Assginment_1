import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
import workspaceRoutes from "./routes/workspace.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env, assertRequiredEnv } from "./config/env.js";
import { getServiceHealth } from "./service/startup.service.js";

dotenv.config();
assertRequiredEnv();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health", async (_req, res) => {
  const services = await getServiceHealth();
  res.json({
    status: "ok",
    services,
    ingestionReady: services.redis && services.qdrant,
  });
});

app.use("/api/workspaces", workspaceRoutes);

app.use(errorHandler);

export default app;
