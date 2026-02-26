import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";
import { getPublicIdFromUrl } from "../utils/cloudinary.js";

export const getUsers = async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
  }).select("-password");

  res.json(users);
};

export const updateProfile = async (req, res) => {
  const { name, bio } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let avatarUrl = user.avatar;

  if (req.file) {

  // ✅ delete old avatar if exists
  if (user.avatar) {
    const publicId = getPublicIdFromUrl(user.avatar);

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  }

  // ✅ upload new avatar
  const result = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "avatars",
    }
  );

  avatarUrl = result.secure_url;
}


  user.name = name || user.name;
  user.bio = bio || user.bio;
  user.avatar = avatarUrl;

  const updatedUser = await user.save();

  res.json(updatedUser);
};
