import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import AppError from "./appError.js";

dotenv.config();

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}


export const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  const parts = url.split("/");
  const fileName = parts[parts.length - 1];

  const publicId =
    "avatars/" + fileName.split(".")[0];

  return publicId;
};

export const assertCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      "Cloudinary is not configured. Set CLOUDINARY_* environment variables.",
      500,
    );
  }
};

export default cloudinary;
