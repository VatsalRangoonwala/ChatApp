import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/google", googleLogin);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.put("/resetPassword/:token", resetPassword);

export default authRouter;
