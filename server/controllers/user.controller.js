import User from "../models/user.model.js";
import cloudinary, {
  assertCloudinaryConfigured,
  getPublicIdFromUrl,
} from "../utils/cloudinary.js";
import AppError from "../utils/appError.js";
import { trimString } from "../utils/validators.js";

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  bio: user.bio,
  avatar: user.avatar,
  isOnline: user.isOnline,
  updatedAt: user.updatedAt,
});

const bufferToDataUri = (file) => {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

export const getUsers = async (req, res) => {
  const search = trimString(req.query.search || "");
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const query = {
    _id: { $ne: req.user._id },
  };

  if (search) {
    query.name = {
      $regex: search,
      $options: "i",
    };
  }

  const users = await User.find(query)
    .select("_id name email bio avatar isOnline updatedAt")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return res.json(users);
};

export const updateProfile = async (req, res) => {
  const name = trimString(req.body.name || "");
  const bio = trimString(req.body.bio || "");

  if (name && name.length > 50) {
    throw new AppError("Name cannot exceed 50 characters", 400);
  }

  if (bio.length > 160) {
    throw new AppError("Bio cannot exceed 160 characters", 400);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  let avatarUrl = user.avatar;

  if (req.file) {
    assertCloudinaryConfigured();

    if (user.avatar) {
      const publicId = getPublicIdFromUrl(user.avatar);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    const result = await cloudinary.uploader.upload(bufferToDataUri(req.file), {
      folder: "avatars",
    });

    avatarUrl = result.secure_url;
  }

  user.name = name || user.name;
  user.bio = req.body.bio !== undefined ? bio : user.bio;
  user.avatar = avatarUrl;

  const updatedUser = await user.save();

  return res.json({
    success: true,
    user: serializeUser(updatedUser),
  });
};

export const savePushSubscription = async (req, res) => {
  const subscription = req.body.subscription;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh) {
    throw new AppError("Invalid push subscription payload", 400);
  }

  await User.findByIdAndUpdate(req.user._id, {
    pushSubscription: subscription,
  });

  return res.json({ success: true });
};
