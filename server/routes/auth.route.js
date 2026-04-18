import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyEmailOTP,
  resendOTP,
  getCurrentUser,
  logoutUser,
} from "../controllers/auth.controller.js";
import protect from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";

const authRouter = express.Router();
const authLimiter = createRateLimiter({
  key: "auth",
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication requests. Please try again shortly.",
});

const otpLimiter = createRateLimiter({
  key: "otp",
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many OTP requests. Please wait before requesting another code.",
});

authRouter.post("/register", authLimiter, registerUser);
authRouter.post("/login", authLimiter, loginUser);
authRouter.post("/google", authLimiter, googleLogin);
authRouter.post("/forgotPassword", authLimiter, forgotPassword);
authRouter.put("/resetPassword/:token", resetPassword);
authRouter.post("/verifyEmail", otpLimiter, verifyEmailOTP);
authRouter.post("/resendOtp", otpLimiter, resendOTP);
authRouter.get("/me", protect, getCurrentUser);
authRouter.post("/logout", logoutUser);

export default authRouter;
