import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { getUsers, updateProfile } from "../controllers/user.controller.js";
import upload from "../middlewares/upload.middleware.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUsers);
userRouter.put("/profile", protect, upload.single("avatar"), updateProfile);

export default userRouter;
