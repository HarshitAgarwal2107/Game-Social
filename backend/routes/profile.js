import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import User from "../models/User.js";

const router = express.Router();

router.patch("/", requireAuth, async (req, res) => {
  const { displayName, username } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (displayName !== undefined) user.displayName = displayName;
  if (username !== undefined) user.username = username;

  await user.save();

  res.json({
    id: user._id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    linkedAccounts: user.linkedAccounts
  });
});

export default router;
