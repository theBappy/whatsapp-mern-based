
import multer from "multer";

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
