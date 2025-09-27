import { uploadFileToCloudinary } from "../configs/cloudinary.js";
import { response } from "../utils/response-handler.js";
import { Status } from "../models/Status.js";

export const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    // Handle file uploads
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);

      if (!uploadResult?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      mediaUrl = uploadResult.secure_url;

      // Determine final content type based on file mimetype
      if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (!content?.trim()) {
      // Ensure at least text content is provided if no file
      return response(res, 400, "Status content is required");
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create new status
    const status = new Status({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      expiresAt,
    });

    await status.save();

    // Populate user and viewers
    const populatedStatus = await Status.findById(status._id)
      .populate("user", "userName profilePicture")
      .populate("viewers", "userName profilePicture");

    return response(res, 201, "Status created successfully", populatedStatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const getStatus = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() }, // only unexpired statuses
    })
      .populate("user", "userName profilePicture")
      .populate("viewers", "userName profilePicture")
      .sort({ createdAt: -1 }); // newest first

    return response(res, 200, "Statuses retrieved successfully", statuses);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};


export const viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }

    // Initialize viewers array if null
    if (!Array.isArray(status.viewers)) {
      status.viewers = [];
    }

    // Add current user to viewers if not already included
    if (!status.viewers.some(v => v.toString() === userId)) {
      status.viewers.push(userId);
      await status.save();
    }

    // Return the updated status
    const populatedStatus = await Status.findById(statusId)
      .populate("user", "userName profilePicture")
      .populate("viewers", "userName profilePicture");

    return response(res, 200, "Status viewed successfully", populatedStatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }

    // Only the creator can delete
    if (status.user.toString() !== userId.toString()) {
      return response(res, 401, "Not authorized to delete this status");
    }

    await status.deleteOne();

    return response(res, 200, "Status deleted successfully", status);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
