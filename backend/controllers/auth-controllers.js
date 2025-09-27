import { uploadFileToCloudinary } from "../configs/cloudinary.js";
import { Conversation } from "../models/Conversation.js";
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

    return response(res, 200, "OTP sent successfully", {
      phoneNumber: fullPhoneNumber,
    });
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

export const profileUpdate = async (req, res) => {
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

export const checkAuthenticate = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return response(res, 404, "Unauthorized, please login.");
    }
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found.");
    }
    return response(res, 200, "User retrieved and allowed.", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("auth_token", "", { expires: new Date(0) });
    return response(res, 200, "User logged out successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
export const getAllUsers = async (req, res) => {
  const loggedInUser = req.user.userId;
  try {
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select(
        "userName about lastSeen profilePicture isOnline phoneNumber phoneSuffix"
      )
      .lean();
    const userWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user?._id] },
        })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();
        return {
          ...user,
          conversation: conversation | null,
        };
      })
    );
    return response(res, 200, "User retrieved successfully", userWithConversation)
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
