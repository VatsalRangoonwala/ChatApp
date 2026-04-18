import jwt from "jsonwebtoken";
import AppError from "./appError.js";

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT secret is not configured", 500);
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateToken;
