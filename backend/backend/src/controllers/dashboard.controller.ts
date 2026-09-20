import { Request, Response } from "express";
import Issue from "../models/Issue";
import { asyncHandler } from "../middleware/asyncHandler";

/**
 * GET /api/dashboard/stats
 */
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalIssues,
    openIssues,
    inProgress,
    resolvedIssues,
    criticalIssues,
    affectedAgg,
  ] = await Promise.all([
    Issue.countDocuments({}),
    Issue.countDocuments({ status: { $in: ["REPORTED", "VERIFIED", "ASSIGNED"] } }),
    Issue.countDocuments({ status: "IN_PROGRESS" }),
    Issue.countDocuments({ status: "RESOLVED" }),
    Issue.countDocuments({ priorityLevel: "CRITICAL" }),
    Issue.aggregate([
      { $match: { status: "RESOLVED" } },
      { $group: { _id: null, total: { $sum: "$affectedPeopleEstimate" } } },
    ]),
  ]);

  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 1000) / 10 : 0;
  const citizensImpacted = affectedAgg[0]?.total || 0;

  res.json({
    success: true,
    data: {
      totalIssues,
      openIssues,
      inProgress,
      resolvedIssues,
      criticalIssues,
      resolutionRate,
      citizensImpacted,
    },
  });
});

/**
 * GET /api/dashboard/analytics
 */
export const getDashboardAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const [issuesByCategoryRaw, issuesByStatusRaw, priorityDistributionRaw, resolutionTrendRaw] =
    await Promise.all([
      Issue.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Issue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: "$priorityLevel", count: { $sum: 1 } } }]),
      Issue.aggregate([
        { $match: { status: "RESOLVED" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

  const issuesByCategory = Object.fromEntries(issuesByCategoryRaw.map((c) => [c._id, c.count]));
  const issuesByStatus = Object.fromEntries(issuesByStatusRaw.map((s) => [s._id, s.count]));
  const priorityDistribution = Object.fromEntries(
    priorityDistributionRaw.map((p) => [p._id, p.count])
  );
  const resolutionTrend = resolutionTrendRaw.map((r) => ({ date: r._id, resolved: r.count }));

  res.json({
    success: true,
    data: {
      issuesByCategory,
      issuesByStatus,
      priorityDistribution,
      resolutionTrend,
    },
  });
});
