import dotenv from "dotenv";
dotenv.config();

import createApp from "./app";
import connectDB from "./config/db";
import { isGeminiConfigured } from "./services/ai.service";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const app = createApp();

  app.listen(PORT, () => {
    console.log("=================================================");
    console.log("  CivicLens AI backend");
    console.log("  See a problem. Report it. Get it resolved.");
    console.log("=================================================");
    console.log(`  Server running on: http://localhost:${PORT}`);
    console.log(`  AI mode: ${isGeminiConfigured() ? "Gemini (GEMINI_API_KEY detected)" : "Fallback (keyword-based)"}`);
    console.log(`  CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
    console.log("=================================================");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] Unhandled promise rejection:", reason);
  });
}

start();
