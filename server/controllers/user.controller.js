import User from "../models/user.model.js";

export const getUsers = async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
  }).select("-password");

  res.json(users);
};

export const updateProfile = async (req, res) => {
  const { name, bio, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = name || user.name;
  user.bio = bio || user.bio;
  user.avatar = avatar || user.avatar;

  const updatedUser = await user.save();

  res.json(updatedUser);
};
