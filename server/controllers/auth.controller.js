import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import otpGenerator from "otp-generator";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailOTP: otp,
      emailOTPExpire: Date.now() + 5 * 60 * 1000,
    });

    await sendEmail({
      to: email,
      subject: "Verify your email",
      text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
    });

    res.status(201).json({
      success: true,
      message: "OTP sent to email",
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      token: generateToken(user._id),
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

    res.json({
      success: true,
      message: "Logged in successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
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

    const jwt = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: jwt,
      bio: user.bio,
    });
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
    subject: "Password Reset",
    text: `Reset your password: ${resetUrl}`,
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

  user.password = req.body.password;

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

  res.json({
    success: true,
    message: "Email verified successfully",
    _id: user._id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
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
    subject: "Resend OTP",
    text: `Your OTP is: ${otp}, It expires in 5 minutes.`,
  });

  res.json({ message: "OTP sent again" });
};
