import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyEmailOTP,
  resendOTP,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/google", googleLogin);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.put("/resetPassword/:token", resetPassword);
authRouter.post("/verifyEmail", verifyEmailOTP)
authRouter.post("/resendOtp",resendOTP)

export default authRouter;
