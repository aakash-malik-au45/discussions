import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "unregistered" | "registered";
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["unregistered", "registered"], default: "registered" },
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
