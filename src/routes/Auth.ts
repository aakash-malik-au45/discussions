import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username/password required" });

  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: "username exists" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash: hash, role: "registered" });

  const userId = (user._id as unknown as string);
  const token = jwt.sign({ id: userId, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ user: { id: userId, username: user.username }, token });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username/password required" });

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "invalid credentials" });

  const userId = (user._id as unknown as string);
  const token = jwt.sign({ id: userId, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ user: { id: userId, username: user.username }, token });
});

export default router;
