import { Schema, model, Document, Types } from "mongoose";

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  issueId: Types.ObjectId;
  action: string;
  description: string;
  performedBy?: Types.ObjectId | null;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
  action: { type: String, required: true },
  description: { type: String, default: "" },
  performedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

export default model<IActivityLog>("ActivityLog", ActivityLogSchema);
