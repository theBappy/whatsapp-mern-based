import { User } from "../models/User.js";
import { sentOtpToEmail } from "../services/email-service.js";
import { sendOtpToPhoneNumber, verifyOtp } from "../services/twillo-phone.js";
import { generateToken } from "../utils/generate-token.js";
import { otpGenerate } from "../utils/otp-generator.js";
import { response } from "../utils/response-handler.js";

// Helper to normalize phone number to E.164
const formatPhoneNumber = (phoneSuffix, phoneNumber) => {
  if (!phoneSuffix.startsWith("+")) {
    phoneSuffix = `+${phoneSuffix}`;
  }
  return `${phoneSuffix}${phoneNumber}`;
};

// Step-1: send OTP
export const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = otpGenerate();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  try {
    let user;

    if (email) {
      // 🔹 Email OTP flow
      user = await User.findOne({ email });
      if (!user) user = new User({ email });

      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();

      await sentOtpToEmail(email, otp);

      return response(res, 200, "OTP sent to your email", { email });
    }

    // 🔹 Phone OTP flow
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and phone code is required");
    }

    const fullPhoneNumber = formatPhoneNumber(phoneSuffix, phoneNumber);

    user = await User.findOne({ phoneNumber });
    if (!user) user = new User({ phoneNumber, phoneSuffix });

    await sendOtpToPhoneNumber(fullPhoneNumber);
    await user.save();

    return response(res, 200, "OTP sent successfully", { phoneNumber: fullPhoneNumber });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// Step-2: verify OTP
export const verifyOtpLogic = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;

  try {
    let user;

    if (email) {
      // 🔹 Email verification
      user = await User.findOne({ email });
      if (!user) return response(res, 404, "User not found");

      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or expired OTP");
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    } else {
      // 🔹 Phone verification
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "Phone number and phone code is required");
      }

      const fullPhoneNumber = formatPhoneNumber(phoneSuffix, phoneNumber);

      user = await User.findOne({ phoneNumber });
      if (!user) return response(res, 404, "User not found");

      const result = await verifyOtp(fullPhoneNumber, otp);
      if (result.status !== "approved") {
        return response(res, 400, "Invalid OTP");
      }

      user.isVerified = true;
      await user.save();
    }

    // 🔹 Generate auth token
    const token = generateToken(user._id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    });

    return response(res, 200, "OTP verified successfully", { token, user });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
