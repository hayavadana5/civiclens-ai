import { Request, Response } from "express";
import mongoose from "mongoose";
import Issue from "../models/Issue";
import IssueCluster from "../models/IssueCluster";
import Resolution from "../models/Resolution";
import ActivityLog from "../models/ActivityLog";
import { asyncHandler } from "../middleware/asyncHandler";
import { badRequest, notFound } from "../utils/apiError";
import { analyzeIssue, verifyResolution } from "../services/ai.service";
import { calculatePriority } from "../utils/priorityEngine";
import { findSimilarIssues, associateWithCluster } from "../services/similarity.service";
import { CATEGORIES } from "../config/constants";
import { extractKeywords } from "../utils/textUtils";

function fileUrl(req: Request, filename?: string | null): string | null {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

/**
 * POST /api/issues
 * Full pipeline: validate -> save -> AI analyze -> priority -> similarity
 * -> cluster -> activity log -> return complete issue.
 */
export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const { description, location, latitude, longitude, reporterId, title: providedTitle } = req.body;

  if (!description || typeof description !== "string" || description.trim().length < 5) {
    throw badRequest("A meaningful 'description' (min 5 characters) is required.");
  }

  const uploadedFile = (req as any).file as Express.Multer.File | undefined;
  const imageFilename = uploadedFile ? uploadedFile.filename : null;

  // 1. Create the base issue record first
  const issue = await Issue.create({
    title: providedTitle || "Untitled issue (pending analysis)",
    description: description.trim(),
    location: location || "",
    latitude: latitude !== undefined ? Number(latitude) : null,
    longitude: longitude !== undefined ? Number(longitude) : null,
    image: imageFilename,
    reporterId: reporterId && mongoose.isValidObjectId(reporterId) ? reporterId : null,
    status: "REPORTED",
  });

  // 2. Analyze with AI (Gemini or fallback, always succeeds)
  const analysis = await analyzeIssue(description, location, imageFilename);

  issue.title = analysis.title;
  issue.category = analysis.category;
  issue.severity = analysis.severity;
  issue.urgencyScore = analysis.urgencyScore;
  issue.safetyRisk = analysis.safetyRisk;
  issue.affectedPeopleEstimate = analysis.affectedPeopleEstimate;
  issue.department = analysis.department;
  issue.recommendedAction = analysis.recommendedAction;
  issue.keywords = analysis.keywords;
  issue.reasoning = analysis.reasoning;
  issue.confidence = analysis.confidence;

  // 3. Find similar issues (before final priority calc, so we know cluster size)
  const similarMatches = await findSimilarIssues(
    {
      category: issue.category,
      keywords: issue.keywords,
      description: issue.description,
      latitude: issue.latitude,
      longitude: issue.longitude,
    },
    issue._id
  );

  // 4. Calculate priority (factoring in similar report count)
  const priority = calculatePriority({
    severity: issue.severity,
    urgencyScore: issue.urgencyScore,
    safetyRisk: issue.safetyRisk,
    affectedPeopleEstimate: issue.affectedPeopleEstimate,
    similarReportsCount: similarMatches.length,
    createdAt: issue.createdAt,
  });
  issue.priorityScore = priority.priorityScore;
  issue.priorityLevel = priority.priorityLevel;

  // 5. Create/associate with a cluster if similar issues were found
  const clusterId = await associateWithCluster(issue, similarMatches);
  if (clusterId) {
    issue.clusterId = clusterId;
  }

  await issue.save();

  // 6. Activity log
  await ActivityLog.create({
    issueId: issue._id,
    action: "ISSUE_CREATED",
    description: `Issue reported and analyzed via ${analysis.source === "gemini" ? "Gemini AI" : "fallback AI"}. Priority: ${issue.priorityLevel} (${issue.priorityScore}).`,
  });

  const responseIssue = issue.toObject();
  res.status(201).json({
    success: true,
    data: {
      ...responseIssue,
      imageUrl: fileUrl(req, issue.image),
      aiSource: analysis.source,
      similarIssuesFound: similarMatches.length,
    },
  });
});

/**
 * GET /api/issues
 * Supports optional filtering by status, category, priorityLevel, clusterId,
 * and simple pagination via page/limit query params.
 */
export const getIssues = asyncHandler(async (req: Request, res: Response) => {
  const { status, category, priorityLevel, clusterId, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priorityLevel) filter.priorityLevel = priorityLevel;
  if (clusterId && mongoose.isValidObjectId(clusterId as string)) filter.clusterId = clusterId;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));
  const skip = (page - 1) * limit;

  const [issues, total] = await Promise.all([
    Issue.find(filter).sort({ priorityScore: -1, createdAt: -1 }).skip(skip).limit(limit),
    Issue.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: issues.map((i) => ({ ...i.toObject(), imageUrl: fileUrl(req, i.image) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/issues/similar
 * Finds issues similar to a given description/category/location provided
 * via query params, WITHOUT creating a new issue. Useful for a "check before
 * you submit" UX flow on the frontend.
 */
export const getSimilarIssues = asyncHandler(async (req: Request, res: Response) => {
  const { description, category, latitude, longitude } = req.query;

  if (!description || typeof description !== "string") {
    throw badRequest("Query param 'description' is required to search for similar issues.");
  }

  const keywords = extractKeywords(description);
  const resolvedCategory =
    typeof category === "string" && (CATEGORIES as readonly string[]).includes(category)
      ? category
      : "Other";

  const matches = await findSimilarIssues({
    category: resolvedCategory,
    keywords,
    description,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
  });

  res.json({
    success: true,
    data: matches.map((m) => ({
      issue: { ...m.issue.toObject(), imageUrl: fileUrl(req, m.issue.image) },
      similarityScore: Math.round(m.score * 100) / 100,
    })),
  });
});

/**
 * GET /api/issues/:id
 */
export const getIssueById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw badRequest("Invalid issue id.");

  const issue = await Issue.findById(id);
  if (!issue) throw notFound("Issue not found.");

  const [logs, resolution] = await Promise.all([
    ActivityLog.find({ issueId: issue._id }).sort({ createdAt: -1 }),
    Resolution.findOne({ issueId: issue._id }).sort({ createdAt: -1 }),
  ]);

  res.json({
    success: true,
    data: {
      ...issue.toObject(),
      imageUrl: fileUrl(req, issue.image),
      activityLog: logs,
      resolution: resolution
        ? {
            ...resolution.toObject(),
            beforeImageUrl: fileUrl(req, resolution.beforeImage),
            afterImageUrl: fileUrl(req, resolution.afterImage),
          }
        : null,
    },
  });
});

/**
 * PUT /api/issues/:id
 * General-purpose update (status changes, assignment, manual corrections).
 */
export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw badRequest("Invalid issue id.");

  const issue = await Issue.findById(id);
  if (!issue) throw notFound("Issue not found.");

  const allowedFields = [
    "title",
    "description",
    "category",
    "location",
    "latitude",
    "longitude",
    "severity",
    "status",
    "department",
    "assignedTo",
    "recommendedAction",
  ] as const;

  const changes: string[] = [];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if ((issue as any)[field] !== req.body[field]) {
        changes.push(field);
      }
      (issue as any)[field] = req.body[field];
    }
  }

  await issue.save();

  if (changes.length > 0) {
    await ActivityLog.create({
      issueId: issue._id,
      action: "ISSUE_UPDATED",
      description: `Updated fields: ${changes.join(", ")}`,
      performedBy: req.body.performedBy && mongoose.isValidObjectId(req.body.performedBy)
        ? req.body.performedBy
        : null,
    });
  }

  res.json({ success: true, data: { ...issue.toObject(), imageUrl: fileUrl(req, issue.image) } });
});

/**
 * POST /api/issues/:id/analyze
 * Re-runs AI analysis on an existing issue (e.g. after a description edit).
 */
export const analyzeExistingIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw badRequest("Invalid issue id.");

  const issue = await Issue.findById(id);
  if (!issue) throw notFound("Issue not found.");

  const analysis = await analyzeIssue(issue.description, issue.location, issue.image);

  issue.title = analysis.title;
  issue.category = analysis.category;
  issue.severity = analysis.severity;
  issue.urgencyScore = analysis.urgencyScore;
  issue.safetyRisk = analysis.safetyRisk;
  issue.affectedPeopleEstimate = analysis.affectedPeopleEstimate;
  issue.department = analysis.department;
  issue.recommendedAction = analysis.recommendedAction;
  issue.keywords = analysis.keywords;
  issue.reasoning = analysis.reasoning;
  issue.confidence = analysis.confidence;

  const similarMatches = await findSimilarIssues(
    {
      category: issue.category,
      keywords: issue.keywords,
      description: issue.description,
      latitude: issue.latitude,
      longitude: issue.longitude,
    },
    issue._id
  );

  const priority = calculatePriority({
    severity: issue.severity,
    urgencyScore: issue.urgencyScore,
    safetyRisk: issue.safetyRisk,
    affectedPeopleEstimate: issue.affectedPeopleEstimate,
    similarReportsCount: similarMatches.length,
    createdAt: issue.createdAt,
  });
  issue.priorityScore = priority.priorityScore;
  issue.priorityLevel = priority.priorityLevel;

  await issue.save();

  await ActivityLog.create({
    issueId: issue._id,
    action: "ISSUE_REANALYZED",
    description: `Re-analyzed via ${analysis.source === "gemini" ? "Gemini AI" : "fallback AI"}. New priority: ${issue.priorityLevel} (${issue.priorityScore}).`,
  });

  res.json({
    success: true,
    data: { ...issue.toObject(), imageUrl: fileUrl(req, issue.image), aiSource: analysis.source },
  });
});

/**
 * POST /api/issues/:id/verify
 * Verifies a proposed resolution using AI (Gemini or fallback).
 */
export const verifyIssueResolution = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw badRequest("Invalid issue id.");

  const issue = await Issue.findById(id);
  if (!issue) throw notFound("Issue not found.");

  const { notes } = req.body;
  const uploadedFile = (req as any).file as Express.Multer.File | undefined;
  const afterImageFilename = uploadedFile ? uploadedFile.filename : null;

  const verification = await verifyResolution(notes || "", Boolean(afterImageFilename));

  issue.status = verification.verified ? "VERIFIED" : issue.status;
  await issue.save();

  await ActivityLog.create({
    issueId: issue._id,
    action: "RESOLUTION_VERIFICATION_ATTEMPTED",
    description: `Verification result: ${verification.verified ? "VERIFIED" : "NOT VERIFIED"} (confidence ${verification.confidence}%). ${verification.verificationReason}`,
  });

  res.json({
    success: true,
    data: {
      issueId: issue._id,
      verified: verification.verified,
      confidence: verification.confidence,
      verificationReason: verification.verificationReason,
      afterImageUrl: fileUrl(req, afterImageFilename),
    },
  });
});

/**
 * POST /api/issues/:id/resolve
 * Marks the issue resolved, creates a Resolution record, and logs activity.
 */
export const resolveIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw badRequest("Invalid issue id.");

  const issue = await Issue.findById(id);
  if (!issue) throw notFound("Issue not found.");

  const { notes, beforeImage, resolvedBy } = req.body;
  const uploadedFile = (req as any).file as Express.Multer.File | undefined;
  const afterImageFilename = uploadedFile ? uploadedFile.filename : null;

  // Run a quick verification pass so the Resolution record has meaningful data
  const verification = await verifyResolution(notes || "", Boolean(afterImageFilename));

  const resolution = await Resolution.create({
    issueId: issue._id,
    notes: notes || "",
    beforeImage: beforeImage || issue.image || null,
    afterImage: afterImageFilename,
    verified: verification.verified,
    confidence: verification.confidence,
    verificationReason: verification.verificationReason,
    resolvedBy: resolvedBy && mongoose.isValidObjectId(resolvedBy) ? resolvedBy : null,
  });

  issue.status = "RESOLVED";
  await issue.save();

  // Update cluster status if all issues in the cluster are now resolved
  if (issue.clusterId) {
    const cluster = await IssueCluster.findById(issue.clusterId).populate("reportIds");
    if (cluster) {
      const allResolved = await Issue.countDocuments({
        _id: { $in: cluster.reportIds },
        status: { $ne: "RESOLVED" },
      });
      cluster.status = allResolved === 0 ? "RESOLVED" : "IN_PROGRESS";
      await cluster.save();
    }
  }

  await ActivityLog.create({
    issueId: issue._id,
    action: "ISSUE_RESOLVED",
    description: `Issue marked resolved. Verification: ${verification.verified ? "PASSED" : "PENDING REVIEW"} (${verification.confidence}% confidence).`,
    performedBy: resolvedBy && mongoose.isValidObjectId(resolvedBy) ? resolvedBy : null,
  });

  res.json({
    success: true,
    data: {
      issue: { ...issue.toObject(), imageUrl: fileUrl(req, issue.image) },
      resolution: {
        ...resolution.toObject(),
        beforeImageUrl: fileUrl(req, resolution.beforeImage),
        afterImageUrl: fileUrl(req, resolution.afterImage),
      },
    },
  });
});
