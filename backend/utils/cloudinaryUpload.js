

import fs from "fs";
import cloudinary from "../configs/cloudinary.js";

export const uploadFileToCloudinary = async (file) => {
  if (!file) throw new Error("No file provided");

  const options = {
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
  };

  const uploader = file.mimetype.startsWith("video")
    ? cloudinary.uploader.upload_large
    : cloudinary.uploader.upload;

  try {
    const result = await uploader(file.path, options);
    return result;
  } catch (error) {
    throw error;
  } finally {
    // cleanup local file
    fs.unlink(file.path, () => {});
  }
};
