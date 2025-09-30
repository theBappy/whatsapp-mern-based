import { useState, useRef } from "react";
import { useLoginStore } from "../../store/use-login-store";
import { useUserStore } from "../../store/use-user-store";
import { useThemeStore } from "../../store/use-theme-store";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { avatars } from "../../utils/data";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaWhatsapp, FaPlus } from "react-icons/fa";
import {
  sentOtp,
  verifyOtp,
  updateUserProfile,
  checkUserAuth,
} from "../../services/user-services";

const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
});

const profileValidationSchema = yup.object().shape({
  userName: yup.string().required("Username is required"),
  agreed: yup
    .boolean()
    .required()
    .oneOf([true], "You must agree to the terms and conditions"),
});

const UserLogin = () => {
  const { step, setStep, resetLoginState } = useLoginStore();
  const { setUser } = useUserStore();
  const { theme } = useThemeStore();
  const [error, setError] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [uploadedPic, setUploadedPic] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [userFromDb, setUserFromDb] = useState(null);
  const navigate = useNavigate();

  const otpRefs = useRef([]);
  const fileInputRef = useRef(null);

  // Step 1: Email
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    watch,
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

  // Step 3: Profile
  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  const ProgressBar = () => (
    <div
      className={`w-full ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
      } rounded-full h-2.5 mb-6`}
    >
      <div
        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      ></div>
    </div>
  );

  const onLoginSubmit = async (data) => {
    try {
      setError("");
      await sentOtp(data.email);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    }
  };

  // OTP Step Handlers
  const handleOtpChange = (e, idx) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      e.target.value = value;
      if (value && idx < 5) otpRefs.current[idx + 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      paste.split("").forEach((digit, i) => {
        if (otpRefs.current[i]) otpRefs.current[i].value = digit;
      });
      otpRefs.current[5].focus();
    }
    e.preventDefault();
  };

  const onOtpSubmit = async () => {
    try {
      setError("");
      const otp = otpRefs.current.map((input) => input?.value || "").join("");
      if (otp.length !== 6) return setError("Please enter the 6-digit OTP");

      const email = watch("email");
      await verifyOtp(email, otp);

      const authCheck = await checkUserAuth();
      if (authCheck?.isAuthenticated) {
        setUserFromDb(authCheck.user);
        const defaultAvatar =
          authCheck.user?.profilePicture ||
          avatars[Math.floor(Math.random() * avatars.length)];
        setSelectedAvatar(defaultAvatar);
        setProfileValue("userName", authCheck.user?.userName || "");
        setUploadedPic(null); // clear previous blob
        setUploadedFile(null);
      }

      setStep(3);
    } catch (err) {
      setError(err.message || "OTP verification failed");
    }
  };

  // Profile submit
  const onProfileSubmitHandler = async (data) => {
    try {
      setError("");

      const formData = new FormData();
      formData.append("userName", data.userName);
      formData.append("agreed", data.agreed);

      if (uploadedFile) {
        formData.append("media", uploadedFile); // matches multer single("media")
      } else if (selectedAvatar) {
        formData.append("profilePicture", selectedAvatar);
      }

      const updatedUser = await updateUserProfile(formData);
      setUser(updatedUser);
      resetLoginState();
      navigate("/");
    } catch (err) {
      setError(err.message || "Profile update failed");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedPic(URL.createObjectURL(file)); // preview
      setUploadedFile(file); // real file to send to backend
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-green-400 to-blue-500"
      } flex items-center justify-center p-4`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
        >
          <FaWhatsapp className="w-16 h-16 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-center mb-6">
          Whatsapp Login (Email OTP)
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <ProgressBar />

        {/* Step 1: Email */}
        {step === 1 && (
          <form
            onSubmit={handleLoginSubmit(onLoginSubmit)}
            className="space-y-4"
          >
            <input
              type="email"
              {...loginRegister("email")}
              placeholder="Enter your email"
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Send OTP
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center gap-2">
              {Array(6)
                .fill(0)
                .map((_, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength="1"
                    ref={(el) => (otpRefs.current[idx] = el)}
                    className="w-12 h-12 text-center border rounded text-xl"
                    onChange={(e) => handleOtpChange(e, idx)}
                    onPaste={handleOtpPaste}
                  />
                ))}
            </div>
            <button
              onClick={onOtpSubmit}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Verify OTP
            </button>
          </div>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <form
            onSubmit={handleProfileSubmit(onProfileSubmitHandler)}
            className="space-y-4"
          >
            <input
              type="text"
              {...profileRegister("userName")}
              placeholder="Choose a username"
              className="w-full p-2 border rounded"
            />

            <div className="flex gap-2 items-center">
              {(uploadedPic || selectedAvatar) && (
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-green-500 flex items-center justify-center">
                    <img
                      src={uploadedPic || selectedAvatar}
                      alt="avatar"
                      className="w-18 h-18 rounded-full object-cover border-4 border-white"
                    />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                <FaPlus />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" {...profileRegister("agreed")} />
              <span>I agree to the terms and conditions</span>
            </label>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Complete Profile
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default UserLogin;

// import React, { useState } from "react";
// import { useLoginStore } from "../../store/use-login-store";
// import countries from "../../utils/countries";
// import * as yup from "yup";
// import { yupResolver } from "@hookform/resolvers/yup";
// import { avatars } from "../../utils/data";
// import { useNavigate } from "react-router-dom";
// import { useUserStore } from "../../store/use-user-store";
// import { useForm } from "react-hook-form";
// import { useThemeStore } from "../../store/use-theme-store";
// import { motion } from "framer-motion";
// import { FaArrowLeft, FaChevronDown, FaUser, FaWhatsapp } from "react-icons/fa";
// import Spinner from "../../utils/spinner";
// import {
//   sentOtp,
//   updateUserProfile,
//   verifyOtp,
// } from "../../services/user-services";
// import { toast } from "react-toastify";

// const loginValidationSchema = yup
//   .object()
//   .shape({
//     phoneNumber: yup
//       .string()
//       .nullable()
//       .notRequired()
//       .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
//       .transform((value, originalValue) =>
//         originalValue?.trim() === "" ? null : value
//       ),
//     email: yup
//       .string()
//       .nullable()
//       .notRequired()
//       .email("Please enter a valid email")
//       .transform((value, originalValue) =>
//         originalValue?.trim() === "" ? null : value
//       ),
//   })
//   .test(
//     "at-least-one",
//     "Either email or phone number is required",
//     (value) => !!(value?.phoneNumber || value?.email)
//   );

// const otpValidationSchema = yup.object().shape({
//   otp: yup
//     .string()
//     .required("OTP is required")
//     .matches(/^\d{6}$/, "OTP must be exactly 6 digits"),
// });

// const profileValidationSchema = yup.object().shape({
//   userName: yup.string().required("Username is required"),
//   agreed: yup
//     .boolean()
//     .required()
//     .oneOf([true], "You must agree to the terms and conditions"),
// });

// const UserLogin = () => {
//   const { step, setStep, userPhoneData, resetLoginState, setUserPhoneData } =
//     useLoginStore();
//   const { setUser } = useUserStore();
//   const { theme } = useThemeStore();

//   const [selectedCountry, setSelectedCountry] = useState(countries[0]);
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [profilePicture, setProfilePicture] = useState(null);
//   const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
//   const [profilePictureFile, setProfilePictureFile] = useState(null);
//   const [error, setError] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();

//   // Login form
//   const {
//     register: loginRegister,
//     handleSubmit: handleLoginSubmit,
//     formState: { errors: loginErrors },
//     watch,
//   } = useForm({
//     resolver: yupResolver(loginValidationSchema),
//   });

//   // OTP form
//   const {
//     handleSubmit: handleOtpSubmit,
//     formState: { errors: otpErrors },
//     setValue: setOtpValue,
//   } = useForm({
//     resolver: yupResolver(otpValidationSchema),
//   });

//   // Profile form
//   const {
//     register: profileRegister,
//     handleSubmit: handleProfileSubmit,
//     formState: { errors: profileErrors },
//   } = useForm({
//     resolver: yupResolver(profileValidationSchema),
//   });

//   const filterCountries = countries.filter(
//     (country) =>
//       country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       country.dialCode.includes(searchTerm)
//   );

//   // ---- Handlers ----
//   const onLoginSubmit = async (formData) => {
//     try {
//       setError("");
//       setLoading(true);

//       const { phoneNumber, email } = formData;

//       if (email) {
//         const response = await sentOtp({ email });
//         if (response?.status === "success") {
//           toast.info("OTP sent to your email");
//           setUserPhoneData({ email });
//           setStep(2);
//         } else {
//           throw new Error(response?.message || "Failed to send OTP to email");
//         }
//       } else if (phoneNumber) {
//         const response = await sentOtp({
//           phoneNumber,
//           dialCode: selectedCountry.dialCode,
//         });
//         if (response?.status === "success") {
//           toast.info("OTP sent to your phone number");
//           setUserPhoneData({
//             phoneNumber,
//             phoneSuffix: selectedCountry.dialCode,
//           });
//           setStep(2);
//         } else {
//           throw new Error(response?.message || "Failed to send OTP to phone");
//         }
//       }
//     } catch (err) {
//       console.error(err);
//       setError(err?.message || "Failed to send OTP");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onOtpSubmit = async () => {
//     try {
//       setError("");
//       setLoading(true);
//       if (!userPhoneData) throw new Error("Phone or email is missing");

//       const otpString = otp.join("");
//       let response;

//       if (userPhoneData?.email) {
//         response = await verifyOtp({ email: userPhoneData.email, otp: otpString });
//       } else {
//         response = await verifyOtp({
//           phoneNumber: userPhoneData.phoneNumber,
//           dialCode: userPhoneData.phoneSuffix,
//           otp: otpString,
//         });
//       }

//       if (response?.status === "success") {
//         toast.success("OTP verified successfully");
//         const user = response.data?.user;
//         if (user?.userName && user?.profilePicture) {
//           setUser(user);
//           navigate("/");
//           resetLoginState();
//         } else {
//           setStep(3);
//         }
//       } else {
//         throw new Error(response?.message || "Failed to verify OTP");
//       }
//     } catch (err) {
//       console.error(err);
//       setError(err?.message || "Failed to verify OTP");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOtpChange = (index, value) => {
//     const digit = (value || "").replace(/\D/g, "").slice(-1);
//     const newOtp = [...otp];
//     newOtp[index] = digit;
//     setOtp(newOtp);
//     setOtpValue("otp", newOtp.join(""));

//     if (digit) {
//       const next = document.getElementById(`otp-${index + 1}`);
//       if (next) next.focus();
//     } else {
//       const prev = document.getElementById(`otp-${index - 1}`);
//       if (prev) prev.focus();
//     }
//   };

//   const handleBack = () => {
//     setStep(1);
//     setUserPhoneData(null);
//     setOtp(["", "", "", "", "", ""]);
//     setError("");
//   };

//   const getDestinationLabel = () => {
//     if (!userPhoneData) return "";
//     if (userPhoneData.email) return userPhoneData.email;
//     return `${userPhoneData.phoneSuffix || ""} ${userPhoneData.phoneNumber || ""}`;
//   };

//   const ProgressBar = () => (
//     <div
//       className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}
//     >
//       <div
//         className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
//         style={{ width: `${(step / 3) * 100}%` }}
//       />
//     </div>
//   );

//   return (
//     <div
//       className={`min-h-screen ${
//         theme === "dark"
//           ? "bg-gray-900"
//           : "bg-gradient-to-br from-green-400 to-blue-500"
//       } flex items-center justify-center p-4 overflow-hidden`}
//     >
//       <motion.div
//         initial={{ opacity: 0, y: -50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className={`${
//           theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
//         } p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
//       >
//         <motion.div
//           initial={{ scale: 0 }}
//           animate={{ scale: 1 }}
//           transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 20 }}
//           className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
//         >
//           <FaWhatsapp className="w-16 h-16 text-white" />
//         </motion.div>

//         <h1 className="text-3xl font-bold text-center mb-6">WhatsApp Login</h1>
//         {error && <p className="text-red-500 text-center mb-4">{error}</p>}
//         <ProgressBar />

//         {/* Step 1: Either Phone or Email */}
//         {step === 1 && (
//           <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
//             <p className="text-center text-gray-600 mb-4">
//               Enter your <b>phone number</b> or <b>email</b> to receive an OTP
//             </p>

//             {/* Phone input (only active if email is empty) */}
//             <div className="flex w-full">
//               <div className="relative">
//                 <button
//                   type="button"
//                   className="flex items-center justify-between h-12 px-4 text-sm font-medium border rounded-l-md bg-gray-100 text-gray-900"
//                   onClick={() => setShowDropdown((s) => !s)}
//                   disabled={!!watch("email")}
//                 >
//                   <span className="flex items-center gap-2">
//                     <span>{selectedCountry.flag}</span>
//                     <span>{selectedCountry.dialCode}</span>
//                   </span>
//                   <FaChevronDown className="ml-2" />
//                 </button>

//                 {showDropdown && !watch("email") && (
//                   <div className="absolute left-0 z-10 mt-1 w-56 border rounded-md shadow-lg max-h-60 overflow-auto bg-white">
//                     <div className="sticky top-0 p-2 bg-white">
//                       <input
//                         type="text"
//                         placeholder="Search countries..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="w-full px-2 py-1 border rounded-md text-sm"
//                       />
//                     </div>
//                     {filterCountries.map((country) => (
//                       <button
//                         key={country.alpha2}
//                         type="button"
//                         className="w-full px-3 py-2 text-left hover:bg-gray-100"
//                         onClick={() => {
//                           setSelectedCountry(country);
//                           setShowDropdown(false);
//                         }}
//                       >
//                         <span className="mr-2">{country.flag}</span>
//                         <span className="mr-2">{country.dialCode}</span>
//                         <span>{country.name}</span>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <input
//                 type="text"
//                 inputMode="numeric"
//                 {...loginRegister("phoneNumber")}
//                 className="flex-1 h-12 px-4 border rounded-r-md focus:ring-2 focus:ring-green-500"
//                 placeholder="Enter Phone Number"
//                 disabled={!!watch("email")}
//               />
//             </div>
//             {loginErrors.phoneNumber && (
//               <p className="text-red-500 text-sm">{loginErrors.phoneNumber.message}</p>
//             )}

//             {/* Divider */}
//             <div className="flex items-center my-4">
//               <div className="flex-grow h-px bg-gray-300" />
//               <span className="mx-3 text-gray-500 text-sm font-medium">or</span>
//               <div className="flex-grow h-px bg-gray-300" />
//             </div>

//             {/* Email input */}
//             <div className="flex items-center border rounded-md py-2 px-2 bg-white">
//               <FaUser className="mr-2 text-gray-600" />
//               <input
//                 type="email"
//                 {...loginRegister("email")}
//                 className="flex-1 h-8 px-1 focus:outline-none bg-transparent"
//                 placeholder="Enter Email"
//                 disabled={!!watch("phoneNumber")}
//               />
//             </div>
//             {loginErrors.email && (
//               <p className="text-red-500 text-sm">{loginErrors.email.message}</p>
//             )}

//             <button
//               type="submit"
//               className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
//             >
//               {loading ? <Spinner /> : "Send OTP"}
//             </button>
//           </form>
//         )}

//         {/* Step 2: Verify OTP */}
//         {step === 2 && (
//           <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
//             <p className="text-center text-gray-600 mb-4">
//               Enter the 6-digit OTP sent to <b>{getDestinationLabel()}</b>
//             </p>
//             <div className="flex justify-between">
//               {otp.map((digit, index) => (
//                 <input
//                   key={index}
//                   id={`otp-${index}`}
//                   type="text"
//                   inputMode="numeric"
//                   maxLength={1}
//                   value={digit}
//                   onChange={(e) => handleOtpChange(index, e.target.value)}
//                   className="w-12 h-12 text-center border rounded-md"
//                 />
//               ))}
//             </div>
//             {otpErrors.otp && (
//               <p className="text-red-500 text-sm">{otpErrors.otp.message}</p>
//             )}
//             <button
//               type="submit"
//               className="w-full bg-green-500 text-white py-2 rounded-md"
//             >
//               {loading ? <Spinner /> : "Verify OTP"}
//             </button>
//             <button
//               type="button"
//               className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-md flex items-center justify-center"
//               onClick={handleBack}
//             >
//               <FaArrowLeft className="mr-2" />
//               Wrong number? Go back
//             </button>
//           </form>
//         )}
//       </motion.div>
//     </div>
//   );
// };

// export default UserLogin;
