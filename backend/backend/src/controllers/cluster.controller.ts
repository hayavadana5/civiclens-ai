import { Request, Response } from "express";
import IssueCluster from "../models/IssueCluster";
import { asyncHandler } from "../middleware/asyncHandler";

/**
 * GET /api/clusters
 * Returns all issue clusters with their associated reports populated.
 */
export const getClusters = asyncHandler(async (req: Request, res: Response) => {
  const { status, category } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  const clusters = await IssueCluster.find(filter)
    .populate("reportIds")
    .sort({ priorityScore: -1, reportCount: -1 });

  res.json({ success: true, data: clusters });
});
