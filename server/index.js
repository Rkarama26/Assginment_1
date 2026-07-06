import app from "./app.js";
import { initDb } from "./db/init.js";
import { env } from "./config/env.js";
import { initializeOptionalServices } from "./service/startup.service.js";
import { startWorker } from "./worker.js";

async function start() {
  await initDb();
  console.log("[startup] Database schema initialized");

  app.listen(env.port, () => {
    console.log(`[startup] Server running on http://localhost:${env.port}`);
  });

  // initializeOptionalServices().then((status) => {
  //   if (status.redis && status.qdrant) {
  //     console.log("[startup] All services ready — uploads and chat enabled");
  //   }
  // });

  await startWorker();
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
