// server/src/models/Post.ts
import mongoose from "mongoose";

export type Op = "add" | "sub" | "mul" | "div";

export interface INode {
  _id: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  op: Op | null;
  rightOperand: number | null;
  result: number;
  authorId: string;
  authorName?: string;
  createdAt: Date;
}

const NodeSchema = new mongoose.Schema<INode>({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Node", default: null },
  op: { type: String, enum: ["add", "sub", "mul", "div", null], default: null },
  rightOperand: { type: Number, default: null },
  result: { type: Number, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: false },
  createdAt: { type: Date, default: () => new Date() }
});

export interface IComment {
  _id: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  text: string;
  authorId: string;
  authorName?: string;
  createdAt: Date;
}

const CommentSchema = new mongoose.Schema<IComment>({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  text: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: false },
  createdAt: { type: Date, default: () => new Date() }
});

export interface IPost extends mongoose.Document {
  authorId: string;
  authorName?: string;
  text?: string;
  startNumber?: number;
  nodes?: INode[];
  comments?: IComment[];
  createdAt: Date;
}

const PostSchema = new mongoose.Schema<IPost>({
  authorId: { type: String, required: true },
  authorName: { type: String, required: false },
  text: { type: String, required: false },
  startNumber: { type: Number, required: false },
  nodes: { type: [NodeSchema], default: [] },
  comments: { type: [CommentSchema], default: [] },
  createdAt: { type: Date, default: () => new Date() }
});

export default mongoose.model<IPost>("Post", PostSchema);
