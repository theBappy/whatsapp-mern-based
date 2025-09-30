
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
};export const profileUpdate = async (req, res) => {
  const { userName, agreed, about } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    const file = req.file;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      console.log(uploadResult);

      user.profilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }
    if (userName) user.userName = userName;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;

    await user.save();

    return response(res, 200, "User profile updated successfully", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
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
