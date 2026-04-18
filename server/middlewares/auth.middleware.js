import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";

const extractTokenFromCookie = (cookieHeader = "") => {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="))
    ?.slice("token=".length);
};

const protect = async (req, res, next) => {
  const token =
    req.headers.authorization?.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : extractTokenFromCookie(req.headers.cookie);

  if (!token) {
    return next(new AppError("Not authorized", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select(
      "_id name email bio avatar isVerified isOnline updatedAt",
    );

    if (!req.user) {
      return next(new AppError("Not authorized", 401));
    }

    return next();
  } catch (error) {
    return next(new AppError("Not authorized", 401));
  }
};

export default protect;
