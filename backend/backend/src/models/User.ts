import { Schema, model, Document, Types } from "mongoose";
import { ROLES, Role } from "../config/constants";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: Role;
  locality?: string;
  verified?: boolean;
  otp?: string;
  otpExpires?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: "password123" },
  role: { type: String, enum: ROLES, default: "CITIZEN" },
  locality: { type: String, default: "Indiranagar, Bengaluru" },
  verified: { type: Boolean, default: true },
  otp: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default model<IUser>("User", UserSchema);
