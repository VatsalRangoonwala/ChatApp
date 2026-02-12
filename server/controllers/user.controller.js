import User from "../models/user.model.js";

export const getUsers = async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
  }).select("-password");

  res.json(users);
};
