import express from "express";
import { authMiddleware } from "../middlewares/authorize-middleware.js";

import {
  deleteMessage,
  getAllConversations,
  getMessages,
  markAsRead,
  sendMessage,
} from "../controllers/chat-controller.js";
import { multerMiddleware } from "../middlewares/multer.js";

const router = express.Router();

//protected routes
router.post("/send-message", authMiddleware, multerMiddleware, sendMessage);


router.get("/conversations", authMiddleware, getAllConversations);
router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  getMessages
);


router.put("/messages/read", authMiddleware, markAsRead);


router.delete("/messages/:messageId", authMiddleware, deleteMessage);

export default router;
