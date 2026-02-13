import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { getUsers, updateProfile } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUsers);
userRouter.put("/profile", protect, updateProfile);

export default userRouter;
