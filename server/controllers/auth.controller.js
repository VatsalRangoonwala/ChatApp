import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import otpGenerator from "otp-generator";

import User from "../models/user.model.js";
import sendEmail from "../utils/sendEmail.js";
import generateToken from "../utils/generateToken.js";
import AppError from "../utils/appError.js";
import { isValidEmail, normalizeEmail, trimString } from "../utils/validators.js";

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  bio: user.bio,
  avatar: user.avatar,
  isVerified: user.isVerified,
});

const sendAuthResponse = (res, user, statusCode = 200, message) => {
  res.cookie("token", generateToken(user._id), getCookieOptions());

  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...serializeUser(user),
  });
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const generateOtpPayload = () => {
  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  return {
    otp,
    otpHash: hashOtp(otp),
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };
};

const sendVerificationEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">Verify your email</h2>
        <p style="color: #666;">Use the code below to complete your verification. This code expires in <b>5 minutes</b>.</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e1e1e1; border-radius: 8px;">
        <h2 style="color: #1a1a1a; margin-bottom: 24px;">Reset your password</h2>
        <p style="color: #4a4a4a; line-height: 1.5;">We received a request to reset your password. Click the button below to choose a new one. This link will expire shortly.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #888; font-size: 14px; line-height: 1.5;">
          If you didn't mean to reset your password, you can safely ignore this email. Your password will not change until you access the link above and create a new one.
        </p>
      </div>
    `,
  });
};

export const registerUser = async (req, res) => {
  const name = trimString(req.body.name);
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    throw new AppError("All fields are required", 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError("Please enter a valid email address", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser?.isVerified) {
    throw new AppError("User already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { otp, otpHash, otpExpiresAt } = generateOtpPayload();

  let user = existingUser;

  if (user) {
    user.name = name;
    user.password = passwordHash;
    user.emailOTP = otpHash;
    user.emailOTPExpire = otpExpiresAt;
    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      password: passwordHash,
      emailOTP: otpHash,
      emailOTPExpire: otpExpiresAt,
    });
  }

  await sendVerificationEmail(email, otp);

  return res.status(existingUser ? 200 : 201).json({
    success: true,
    message: "OTP sent to email",
    ...serializeUser(user),
  });
};

export const loginUser = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email first", 403);
  }

  return sendAuthResponse(res, user, 200, "Logged in successfully");
};

export const googleLogin = async (req, res) => {
  if (!googleClient) {
    throw new AppError("Google login is not configured", 500);
  }

  const token = trimString(req.body.token || "");
  if (!token) {
    throw new AppError("Google token is required", 400);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const email = normalizeEmail(payload?.email);
  const name = trimString(payload?.name || "Google User");

  if (!payload?.email_verified || !email) {
    throw new AppError("Google account email could not be verified", 400);
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: payload.picture || "",
      password: await bcrypt.hash(crypto.randomUUID(), 10),
      isVerified: true,
    });
  } else if (!user.isVerified) {
    user.isVerified = true;
    if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
    }
    await user.save();
  }

  return sendAuthResponse(res, user, 200, "Logged in successfully");
};

export const forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email || !isValidEmail(email)) {
    throw new AppError("Please enter a valid email address", 400);
  }

  const user = await User.findOne({ email });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return res.json({
    success: true,
    message: "If that email exists, a reset link has been sent",
  });
};

export const resetPassword = async (req, res) => {
  const password = String(req.body.password || "");

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Token invalid or expired", 400);
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return res.json({
    success: true,
    message: "Password updated successfully",
  });
};

export const verifyEmailOTP = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = trimString(req.body.otp || "");

  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }

  if (!user.emailOTP || !user.emailOTPExpire || user.emailOTPExpire < new Date()) {
    throw new AppError("OTP expired", 400);
  }

  if (user.emailOTP !== hashOtp(otp)) {
    throw new AppError("Invalid OTP", 400);
  }

  user.isVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpire = undefined;

  await user.save();

  return sendAuthResponse(res, user, 200, "Email verified successfully");
};

export const resendOTP = async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email || !isValidEmail(email)) {
    throw new AppError("Please enter a valid email address", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }

  const { otp, otpHash, otpExpiresAt } = generateOtpPayload();

  user.emailOTP = otpHash;
  user.emailOTPExpire = otpExpiresAt;
  await user.save();

  await sendVerificationEmail(email, otp);

  return res.json({
    success: true,
    message: "OTP sent again",
  });
};

export const getCurrentUser = async (req, res) => {
  return res.json({
    success: true,
    ...serializeUser(req.user),
  });
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token", getCookieOptions());

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
};
