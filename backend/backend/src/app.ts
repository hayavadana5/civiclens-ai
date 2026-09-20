import express, { Application } from "express";
import cors from "cors";
import path from "path";
import apiRoutes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp(): Application {
  const app: Application = express();

  const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigin === "*" ||
          origin === allowedOrigin ||
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
          /\.vercel\.app$/.test(origin) ||
          /\.onrender\.com$/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded images statically
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      message: "CivicLens AI backend is running.",
      tagline: "See a problem. Report it. Get it resolved.",
    });
  });

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
