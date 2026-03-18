import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import otpGenerator from "otp-generator";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
});

const sendAuthResponse = (res, user, statusCode = 200, message) => {
  res.cookie("token", generateToken(user._id), getCookieOptions());

  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...serializeUser(user),
  });
};

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

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

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailOTP: otp,
      emailOTPExpire: Date.now() + 5 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "OTP sent to email",
      ...serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not registered" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    return sendAuthResponse(res, user, 200, "Logged in successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        password: "google-auth",
        isVerified: true,
      });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    res.status(500).json({ message: "Google login failed" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`;

  await sendEmail({
    to: user.email,
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
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #bbb; font-size: 12px;">
        If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
        <span style="color: #007bff;">${resetUrl}</span>
      </p>
    </div>
  `,
  });

  res.json({ message: "Reset email sent" });
};

export const resetPassword = async (req, res) => {
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Token invalid or expired" });
  }

  const password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  user.password = hashedPassword;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ message: "Password updated successfully" });
};

export const verifyEmailOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (user.emailOTP !== otp) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  if (user.emailOTPExpire < Date.now()) {
    return res.status(400).json({
      message: "OTP expired",
    });
  }

  user.isVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpire = undefined;

  await user.save();

  return sendAuthResponse(res, user, 200, "Email verified successfully");
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  user.emailOTP = otp;
  user.emailOTPExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  await sendEmail({
    to: email,
    subject: "Your New Verification Code",
    html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 450px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
        <span style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 1px;">VERIFICATION CODE</span>
      </div>
      <div style="padding: 40px 30px; text-align: center;">
        <p style="color: #444; font-size: 16px; margin-bottom: 25px;">You requested a new code. Enter the following to continue:</p>
        
        <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; display: inline-block;">
          <span style="font-family: monospace; font-size: 38px; font-weight: bold; color: #007bff; letter-spacing: 8px;">${otp}</span>
        </div>

        <p style="color: #888; font-size: 13px; margin-top: 25px;">
          Valid for <b>5 minutes</b>. <br />
          If you didn't request this, please secure your account.
        </p>
      </div>
    </div>
  `,
  });

  res.json({ message: "OTP sent again" });
};

export const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    ...serializeUser(req.user),
  });
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token", getCookieOptions());

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};
