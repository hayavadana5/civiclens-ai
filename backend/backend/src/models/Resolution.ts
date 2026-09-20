import { Schema, model, Document, Types } from "mongoose";

export interface IResolution extends Document {
  _id: Types.ObjectId;
  issueId: Types.ObjectId;
  notes: string;
  beforeImage?: string;
  afterImage?: string;
  verified: boolean;
  confidence: number;
  verificationReason: string;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
}

const ResolutionSchema = new Schema<IResolution>({
  issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
  notes: { type: String, default: "" },
  beforeImage: { type: String, default: null },
  afterImage: { type: String, default: null },
  verified: { type: Boolean, default: false },
  confidence: { type: Number, default: 0 },
  verificationReason: { type: String, default: "" },
  resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

export default model<IResolution>("Resolution", ResolutionSchema);
