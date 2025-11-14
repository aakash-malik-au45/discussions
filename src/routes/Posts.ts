// server/src/routes/posts.ts
import express from "express";
import Post from "../models/Post";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// simple auth middleware (sets req.user)
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
  const m = auth.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: "Invalid token format" });
  try {
    const payload: any = jwt.verify(m[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// GET all posts
router.get("/", async (_, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  // normalize so every post has comments array
  const normalized = posts.map((p: any) => ({
    ...p,
    comments: p.comments ?? [],
  }));
  res.json(normalized);
});

// Create post (text or startNumber) - auth required
router.post("/", authMiddleware, async (req: any, res) => {
  const { text, startNumber } = req.body;
  if (!text && typeof startNumber !== "number") {
    return res.status(400).json({ error: "Either text or startNumber is required" });
  }

  const payload: any = {
    authorId: req.user.id,
    authorName: req.user.username,
    createdAt: new Date()
  } as any;

  if (typeof text === "string") payload.text = text;
  if (typeof startNumber === "number") {
    payload.startNumber = startNumber;
    payload.nodes = [
      {
        parentId: null,
        op: null,
        rightOperand: null,
        result: startNumber,
        authorId: req.user.id,
        authorName: req.user.username,
        createdAt: new Date()
      }
    ];
  } else {
    payload.comments = [];
  }

  const post = await Post.create(payload);
  res.json(post);
});

// Add comment or reply to a post (auth)
router.post("/:postId/comments", authMiddleware, async (req: any, res) => {
  const { postId } = req.params;
  const { parentId = null, text } = req.body;
  if (typeof text !== "string" || !text.trim()) return res.status(400).json({ error: "text required" });

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "post not found" });

  const comment = {
    parentId: parentId ? parentId : null,
    text: text.trim(),
    authorId: req.user.id,
    authorName: req.user.username,
    createdAt: new Date()
  };

  // push comment
  (post.comments as any).push(comment);
  await post.save();

  res.json(post);
});

/* 
  Optional: keep the numeric node endpoint (if you still support numeric operations).
  This example uses post.nodes array and requires `parentIndex` as before.
*/
router.post("/:postId/nodes", authMiddleware, async (req: any, res) => {
  const { postId } = req.params;
  const { parentIndex, op, rightOperand } = req.body;
  if (!["add", "sub", "mul", "div"].includes(op)) return res.status(400).json({ error: "invalid op" });
  if (typeof rightOperand !== "number") return res.status(400).json({ error: "rightOperand must be number" });

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "post not found" });

  const parentNode = post.nodes![parentIndex];
  if (!parentNode) return res.status(400).json({ error: "parent node not found" });

  const a = parentNode.result;
  const b = rightOperand;
  let result: number;
  if (op === "add") result = a + b;
  else if (op === "sub") result = a - b;
  else if (op === "mul") result = a * b;
  else {
    if (b === 0) return res.status(400).json({ error: "division by zero" });
    result = a / b;
  }

  post.nodes!.push({
    parentId: parentNode._id,
    op,
    rightOperand: b,
    result,
    authorId: req.user.id,
    authorName: req.user.username,
    createdAt: new Date()
  } as any);

  await post.save();
  res.json(post);
});

export default router;
