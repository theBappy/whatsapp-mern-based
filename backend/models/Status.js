import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ["image", "video", "text"],
      default: "text",
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true } 
);

export const Status = mongoose.model("Status", statusSchema);
