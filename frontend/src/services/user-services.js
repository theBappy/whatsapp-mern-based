
import { axiosInstance } from "./url-service";

// ✅ Send OTP via email only
export const sentOtp = async (email) => {
  try {
    const response = await axiosInstance.post("/auth/send-otp", { email });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ✅ Verify OTP via email only
export const verifyOtp = async (email, otp) => {
  try {
    const response = await axiosInstance.post("/auth/verify-otp", {
      email,
      otp,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const updateUserProfile = async (updateData) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axiosInstance.put("/auth/update-profile", updateData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data; // updated user object
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ✅ Check authentication
export const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("/auth/check-auth");
    if (response.data.status === "success") {
      return { isAuthenticated: true, user: response?.data?.data };
    } else if (response.data.status === "error") {
      return { isAuthenticated: false };
    }
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ✅ Logout user
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ✅ Get all users
export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/auth/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};




// import { axiosInstance } from "./url-service";

// export const sentOtp = async (phoneNumber, phoneSuffix, email) => {
//   try {
//     const response = await axiosInstance.post("/auth/send-otp", {
//       phoneNumber,
//       phoneSuffix,
//       email,
//     });
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : error.message;
//   }
// };
// export const verifyOtp = async (phoneNumber, phoneSuffix, email, otp) => {
//   try {
//     const response = await axiosInstance.post("/auth/verify-otp", {
//       phoneNumber,
//       phoneSuffix,
//       email,
//       otp,
//     });
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : error.message;
//   }
// };
// export const updateUserProfile = async (updateData) => {
//   try {
//     const response = await axiosInstance.put(
//       "/auth/update-profile",
//       updateData
//     );
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : error.message;
//   }
// };
// export const checkUserAuth = async () => {
//   try {
//     const response = await axiosInstance.get("/auth/check-auth");
//     if (response.data.status === "success") {
//       return { isAuthenticated: true, user: response?.data?.data };
//     } else if (response.data.status === "error") {
//       return {
//         isAuthenticated: false,
//       };
//     }
//   } catch (error) {
//     throw error.response ? error.response.data : error.message;
//   }
// };

// export const logoutUser = async () => {
//   try {
//     const response = await axiosInstance.get("/auth/logout");
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : error.message;
//   }
// };

// export const getAllUsers = async () => {
//   try {
//     const response = await axiosInstance.get("/auth/users");
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : error.message;
//   }
// };
