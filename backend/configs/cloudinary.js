
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed!"), false);
  }
};

export const multerMiddleware = multer({
  dest: "uploads/",
  fileFilter,
}).single("media");


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
    // cleanup: remove local file no matter what
    fs.unlink(file.path, () => {});
  }
};
