import express from "express"
import { checkAuthenticate, getAllUsers, logout, profileUpdate, sendOtp, verifyOtpLogic } from "../controllers/auth-controllers.js";
import { authMiddleware } from "../middlewares/authorize-middleware.js";
import { multerMiddleware } from "../middlewares/multer.js";


const router = express.Router()

router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtpLogic)
router.get("/logout", logout)

//protected routes
router.put("/update-profile", authMiddleware, multerMiddleware, profileUpdate);
router.get("/check-auth", authMiddleware, checkAuthenticate)
router.get("/users", authMiddleware, getAllUsers)

export default router;