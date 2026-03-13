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

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/google", googleLogin);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.put("/resetPassword/:token", resetPassword);
authRouter.post("/verifyEmail", verifyEmailOTP);
authRouter.post("/resendOtp", resendOTP);
authRouter.get("/me", protect, getCurrentUser);
authRouter.post("/logout", logoutUser);

export default authRouter;
