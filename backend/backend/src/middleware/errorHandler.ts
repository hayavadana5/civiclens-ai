import { Request, Response, NextFunction } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === "production";

  // Known application errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Multer (file upload) errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }
  if (err?.message === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.",
    });
  }

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: Object.values(err.errors).map((e: any) => e.message),
    });
  }

  // Mongoose cast errors (e.g. malformed ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: `Invalid value for field "${err.path}"`,
    });
  }

  // MongoDB duplicate key error
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate value violates a unique constraint",
      details: err.keyValue,
    });
  }

  // MongoDB connection / server errors
  if (err?.name === "MongoServerError" || err?.name === "MongooseServerSelectionError") {
    return res.status(503).json({
      success: false,
      error: "Database is currently unavailable. Please try again shortly.",
    });
  }

  // Fallback: unknown/unexpected error
  console.error("[ERROR]", err);
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(isProduction ? {} : { message: err?.message, stack: err?.stack }),
  });
}
