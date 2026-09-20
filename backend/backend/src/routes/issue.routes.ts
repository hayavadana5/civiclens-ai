import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  analyzeExistingIssue,
  getSimilarIssues,
  verifyIssueResolution,
  resolveIssue,
} from "../controllers/issue.controller";

const router = Router();

// NOTE: /similar must be declared before /:id so Express doesn't treat
// "similar" as an :id path parameter.
router.get("/similar", getSimilarIssues);

router.post("/", upload.single("image"), createIssue);
router.get("/", getIssues);
router.get("/:id", getIssueById);
router.put("/:id", updateIssue);
router.post("/:id/analyze", analyzeExistingIssue);
router.post("/:id/verify", upload.single("afterImage"), verifyIssueResolution);
router.post("/:id/resolve", upload.single("afterImage"), resolveIssue);

export default router;
