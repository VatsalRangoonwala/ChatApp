import mongoose from "mongoose";
import AppError from "../utils/appError.js";
import { logger } from "../utils/logger.js";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new AppError("MONGO_URI is not configured", 500);
  }

  try {
    await mongoose.connect(`${process.env.MONGO_URI}/ChatApp`);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection failed", {
      message: error.message,
    });
    process.exit(1);
  }
};

export default connectDB;
