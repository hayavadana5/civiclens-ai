import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/apiError";

// In-memory store for OTPs: email -> { otp, expiresAt, name, role }
const otpStore = new Map<string, { otp: string; expiresAt: number; name?: string }>();

// Strict email regex validation (RFC 5322 standard compatible)
export const isValidEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email);
};

/**
 * POST /api/auth/send-otp
 * Validates email and generates a 6-digit verification code.
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email || typeof email !== "string") {
    throw new ApiError(400, "Please provide an email address");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError(400, "Please enter a valid email address (e.g. yourname@example.com)");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.verified) {
    // If they already exist, we can still allow them to verify or advise login
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(normalizedEmail, { otp, expiresAt, name });

  console.log(`[AUTH] Generated OTP for ${normalizedEmail}: ${otp}`);

  res.json({
    success: true,
    message: `Verification OTP has been generated for ${normalizedEmail}`,
    data: {
      email: normalizedEmail,
      otp, // included for seamless demo/testing experience
      expiresIn: "10 minutes",
    },
  });
});

/**
 * POST /api/auth/register-with-otp
 * Verifies the 6-digit OTP and registers the user in MongoDB.
 */
export const registerWithOtp = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, locality, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP code are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError(400, "Invalid email address");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  // Verify OTP
  const storedRecord = otpStore.get(normalizedEmail);
  const isMasterDemoOtp = otp === "123456"; // demo fallback

  if (!isMasterDemoOtp) {
    if (!storedRecord) {
      throw new ApiError(400, "No OTP request found for this email. Please request a new code.");
    }
    if (Date.now() > storedRecord.expiresAt) {
      otpStore.delete(normalizedEmail);
      throw new ApiError(400, "The verification code has expired. Please request a new one.");
    }
    if (storedRecord.otp !== otp.trim()) {
      throw new ApiError(400, "Invalid OTP code. Please check your code and try again.");
    }
  }

  // Clean up OTP
  otpStore.delete(normalizedEmail);

  // Check if user already exists
  let user = await User.findOne({ email: normalizedEmail });

  const assignedRole = (role && role.toUpperCase() === "AUTHORITY" ? "AUTHORITY" : "CITIZEN");
  const displayName = name?.trim() || storedRecord?.name || normalizedEmail.split("@")[0];

  if (user) {
    // Update existing user
    user.name = displayName;
    user.password = password;
    user.role = assignedRole;
    user.locality = locality || "Indiranagar, Bengaluru";
    user.verified = true;
    await user.save();
  } else {
    // Create new in MongoDB
    user = await User.create({
      name: displayName,
      email: normalizedEmail,
      password,
      role: assignedRole,
      locality: locality || "Indiranagar, Bengaluru",
      verified: true,
    });
  }

  console.log(`[AUTH] User registered & saved in MongoDB: ${user.email} (${user.role})`);

  res.json({
    success: true,
    message: "Account verified and registered successfully!",
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        locality: user.locality,
      },
    },
  });
});

/**
 * POST /api/auth/login
 * Authenticates against MongoDB with email and password.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string") {
    throw new ApiError(400, "Please enter your email address");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  if (!password) {
    throw new ApiError(400, "Please enter your password");
  }

  // Search in MongoDB
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(404, "No account registered with this email. Please click 'Create New Account' to register.");
  }

  // Verify password (supports stored password or default demo password)
  if (user.password && user.password !== password && password !== "password123" && password !== "bengaluru2026") {
    throw new ApiError(401, "Incorrect password. Please verify your credentials and try again.");
  }

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        locality: user.locality || "Bengaluru",
      },
    },
  });
});

/**
 * GET /api/auth/users
 * Returns registered users from MongoDB
 */
export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({}).select("name email role locality createdAt").limit(10);
  res.json({
    success: true,
    data: {
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role.toLowerCase(),
        locality: u.locality,
      })),
    },
  });
});
