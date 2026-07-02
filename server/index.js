import app from "./app.js";
import { initDb } from "./db/init.js";
import { env } from "./config/env.js";
import { ensureCollection } from "./service/qdrant.service.js";
import { geminiEmbeddings } from "./ai/embedding.js";

async function start() {
  await initDb();

  const probe = await geminiEmbeddings.embedQuery("init");
  await ensureCollection(probe.length);

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
