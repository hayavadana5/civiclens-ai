import { Router } from "express";
import issueRoutes from "./issue.routes";
import clusterRoutes from "./cluster.routes";
import dashboardRoutes from "./dashboard.routes";
import authRoutes from "./auth.routes";
import { isGeminiConfigured } from "../services/ai.service";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    aiMode: isGeminiConfigured() ? "gemini" : "fallback",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/issues", issueRoutes);
router.use("/clusters", clusterRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
