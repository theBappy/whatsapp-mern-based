import express from "express";
import { authMiddleware } from "../middlewares/authorize-middleware.js";
import {
  createStatus,
  getStatus,
  viewStatus,
  deleteStatus,
} from "../controllers/status-controller.js";
import { multerMiddleware } from "../middlewares/multer.js";

const router = express.Router();

//protected routes
router.post("/", authMiddleware, multerMiddleware, createStatus);

router.get("/", authMiddleware, getStatus);
router.get("/:statusId/view", authMiddleware, viewStatus);

router.delete("/:statusId", authMiddleware, deleteStatus);

export default router;
