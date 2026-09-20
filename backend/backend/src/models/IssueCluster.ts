import { Schema, model, Document, Types } from "mongoose";
import { CATEGORIES, CLUSTER_STATUSES, Category, ClusterStatus } from "../config/constants";

export interface IIssueCluster extends Document {
  _id: Types.ObjectId;
  title: string;
  category: Category;
  location: string;
  reportIds: Types.ObjectId[];
  reportCount: number;
  priorityScore: number;
  status: ClusterStatus;
  createdAt: Date;
  updatedAt: Date;
}

const IssueClusterSchema = new Schema<IIssueCluster>(
  {
    title: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, default: "Other" },
    location: { type: String, default: "" },
    reportIds: [{ type: Schema.Types.ObjectId, ref: "Issue" }],
    reportCount: { type: Number, default: 0 },
    priorityScore: { type: Number, default: 0 },
    status: { type: String, enum: CLUSTER_STATUSES, default: "OPEN" },
  },
  { timestamps: true }
);

export default model<IIssueCluster>("IssueCluster", IssueClusterSchema);
