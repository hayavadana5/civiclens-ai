import { Router } from "express";
import { getDashboardStats, getDashboardAnalytics } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", getDashboardStats);
router.get("/analytics", getDashboardAnalytics);

export default router;
