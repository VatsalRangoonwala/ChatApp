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
  if (!url || typeof url !== "string") return null;

  // Cloudinary URLs typically look like:
  // https://res.cloudinary.com/cloud_name/image/upload/v12345678/folder/public_id.jpg
  // This regex extracts 'folder/public_id' by looking for everything after the version (v[0-9]+)
  // and before the last file extension.
  const regex = /\/v\d+\/([^.]+)/;
  const match = url.match(regex);

  return match ? match[1] : null;
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
