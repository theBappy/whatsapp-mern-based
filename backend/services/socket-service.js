import { Server } from "socket.io";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";

// Track all online users => userId: socketId
const onlineUsers = new Map();

// Track typing status => userId: { conversationId: boolean }
const typingUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    },
    pingTimeout: 60 * 1000, // auto-disconnect inactive sockets
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    let userId = null;

    /**
     * Handle new user connection
     */
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId); // personal room

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // Notify others this user is now online
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("❌ Error handling user connection:", error);
      }
    });

    /**
     * Get user status (online/offline + lastSeen)
     */
    socket.on("get_user_status", async (requestedUserId, callback) => {
      try {
        const isOnline = onlineUsers.has(requestedUserId);
        const user = await User.findById(requestedUserId).select("lastSeen");

        callback({
          userId: requestedUserId,
          isOnline,
          lastSeen: user?.lastSeen || null,
        });
      } catch (error) {
        console.error("❌ Error fetching user status:", error);
        callback({
          userId: requestedUserId,
          isOnline: false,
          lastSeen: null,
        });
      }
    });

    /**
     * Forward message to receiver + confirm to sender
     */
    socket.on("send_message", async (message) => {
      try {
        // Optionally save in DB here if needed:
        // const savedMsg = await Message.create(message);

        // Emit to sender (for UI update)
        socket.emit("message_sent", message);

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(message.receiver?._id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("received_message", message);
        }
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    /**
     * Mark messages as read and notify sender
     */
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_status_update", {
            messageIds,
            messageStatus: "read",
          });
        }
      } catch (error) {
        console.error("❌ Error updating message status:", error);
      }
    });

    /**
     * Typing indicator (auto stops after 3s)
     */
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const userTyping = typingUsers.get(userId);

      userTyping[conversationId] = true;

      // Notify receiver that user started typing
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });

      // Clear any previous timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      // Auto stop after 3 seconds
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);
    });

    /**
     * Typing stop event
     */
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    /**
     * Add or update reactions on a message
     */
    socket.on("add_reactions", async ({ messageId, emoji, reactionUserId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const existingIndex = msg.reactions.findIndex(
          (r) => r.user.toString() === reactionUserId
        );

        if (existingIndex > -1) {
          const existing = msg.reactions[existingIndex];
          if (existing.emoji === emoji) {
            // remove same reaction
            msg.reactions.splice(existingIndex, 1);
          } else {
            // change emoji
            msg.reactions[existingIndex].emoji = emoji;
          }
        } else {
          // add new reaction
          msg.reactions.push({ user: reactionUserId, emoji });
        }

        await msg.save();

        const populatedMessage = await Message.findById(msg._id)
          .populate("sender", "userName profilePicture")
          .populate("receiver", "userName profilePicture")
          .populate("reactions.user", "userName profilePicture");

        const reactionUpdated = {
          messageId,
          reactions: populatedMessage.reactions,
        };

        const senderSocket = onlineUsers.get(
          populatedMessage.sender._id.toString()
        );
        const receiverSocket = onlineUsers.get(
          populatedMessage.receiver?._id.toString()
        );

        if (senderSocket) io.to(senderSocket).emit("reaction_update", reactionUpdated);
        if (receiverSocket) io.to(receiverSocket).emit("reaction_update", reactionUpdated);
      } catch (error) {
        console.error("❌ Error handling reactions:", error);
      }
    });

    /**
     * Handle disconnection
     */
    const handleDisconnected = async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        // clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith(`_timeout`)) clearTimeout(userTyping[key]);
          });
          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`🔌 User ${userId} disconnected.`);
      } catch (error) {
        console.error("❌ Error in handle disconnection:", error);
      }
    };

    socket.on("disconnect", handleDisconnected);
  });

  // attach the online user map to the socket server for external use
  io.socketUserMap = onlineUsers;
  return io;
};
