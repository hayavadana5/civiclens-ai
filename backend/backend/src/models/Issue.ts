import { Schema, model, Document, Types } from "mongoose";
import {
  CATEGORIES,
  STATUSES,
  SEVERITIES,
  SAFETY_RISKS,
  Category,
  Status,
  Severity,
  SafetyRisk,
} from "../config/constants";

export interface IIssueLocation {
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface IIssue extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: Category;
  image?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  severity: Severity;
  urgencyScore: number;
  priorityScore: number;
  priorityLevel: string;
  safetyRisk: SafetyRisk;
  affectedPeopleEstimate: number;
  department: string;
  recommendedAction: string;
  keywords: string[];
  reasoning?: string;
  confidence?: number;
  status: Status;
  reporterId?: Types.ObjectId;
  clusterId?: Types.ObjectId | null;
  assignedTo?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, default: "Other" },
    image: { type: String, default: null },
    location: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    severity: { type: String, enum: SEVERITIES, default: "MEDIUM" },
    urgencyScore: { type: Number, default: 0 },
    priorityScore: { type: Number, default: 0 },
    priorityLevel: { type: String, default: "LOW" },
    safetyRisk: { type: String, enum: SAFETY_RISKS, default: "LOW" },
    affectedPeopleEstimate: { type: Number, default: 1 },
    department: { type: String, default: "General Administration" },
    recommendedAction: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    reasoning: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    status: { type: String, enum: STATUSES, default: "REPORTED" },
    reporterId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    clusterId: { type: Schema.Types.ObjectId, ref: "IssueCluster", default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

IssueSchema.index({ category: 1, status: 1 });
IssueSchema.index({ priorityScore: -1 });

export default model<IIssue>("Issue", IssueSchema);
