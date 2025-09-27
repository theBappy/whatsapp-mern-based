import { uploadFileToCloudinary } from "../configs/cloudinary.js";
import { response } from "../utils/response-handler.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    const participants = [senderId, receiverId].sort();

    // check if conversation already exists
    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = new Conversation({ participants, unreadCount: 0 });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // handle file uploads
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      imageOrVideoUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus,
    });

    await message.save();

    if (message.content) {
      conversation.lastMessage = message._id;
    }

    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "userName profilePicture")
      .populate("receiver", "userName profilePicture");

    return response(res, 201, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const getAllConversations = async (req, res) => {
  const userId = req.user.userId;
  try {
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "userName profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "userName profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    return response(
      res,
      200,
      "Conversations fetched successfully",
      conversations
    );
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    if (
      !conversation.participants.some((p) => p.toString() === userId.toString())
    ) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "userName profilePicture")
      .populate("receiver", "userName profilePicture")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["send", "delivered"] },
      },
      { $set: { messageStatus: "read" } }
    );

    conversation.unreadCount = 0;
    await conversation.save();

    return response(res, 200, "Messages retrieved", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return response(res, 400, "No message IDs provided");
  }

  try {
    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: "read" } }
    );

    const updatedMessages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    return response(res, 200, "Messages marked as read", updatedMessages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }
    if(message.sender.toString() !== userId){
        return response(res, 401, "Not authorized to delete this message")
    }
    await message.deleteOne()

    return response(res, 200, "Message deleted successfully")
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
