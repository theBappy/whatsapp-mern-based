import express from "express"
import { sendOtp, verifyOtpLogic } from "../controllers/auth-controllers.js";

const router = express.Router()

router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtpLogic)

export default router;