import React, { useState } from "react";
import { useLoginStore } from "../../store/use-login-store";
import countries from "../../utils/countries";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { avatars } from "../../utils/data";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/use-user-store";
import { useForm } from "react-hook-form";
import { useThemeStore } from "../../store/use-theme-store";
import { motion } from "framer-motion";
import { FaArrowLeft, FaChevronDown, FaUser, FaWhatsapp } from "react-icons/fa";
import Spinner from "../../utils/spinner";
import {
  sentOtp,
  updateUserProfile,
  verifyOtp,
} from "../../services/user-services";
import { toast } from "react-toastify";

const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
      .transform((value, originalValue) =>
        originalValue?.trim() === "" ? null : value
      ),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("Please enter a valid email")
      .transform((value, originalValue) =>
        originalValue?.trim() === "" ? null : value
      ),
  })
  .test(
    "at-least-one",
    "Either email or phone number is required",
    (value) => !!(value?.phoneNumber || value?.email)
  );

const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .required("OTP is required")
    .matches(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

const profileValidationSchema = yup.object().shape({
  userName: yup.string().required("Username is required"),
  agreed: yup
    .boolean()
    .required()
    .oneOf([true], "You must agree to the terms and conditions"),
});

const UserLogin = () => {
  // login store
  const { step, setStep, userPhoneData, resetLoginState, setUserPhoneData } =
    useLoginStore();
  const { setUser } = useUserStore();
  const { theme } = useThemeStore();

  // Local UI state
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [profilePicture, setProfilePicture] = useState(null); // preview URL
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null); // actual file
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // LOGIN form (phone/email)
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    // watch can be used if needed: watch("phoneNumber"), watch("email")
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

  // OTP form (we use setValue to update 'otp' field)
  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  // Profile form
  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  );

  // ---- Handlers ----

  // Login: formData comes from react-hook-form
  const onLoginSubmit = async (formData) => {
    try {
      setError("");
      setLoading(true);

      const { phoneNumber, email } = formData;

      if (email) {
        // object-style payload (consistent with sentOtp usage)
        const response = await sentOtp({ email });
        if (response?.status === "success") {
          toast.info("OTP sent to your email");
          setUserPhoneData({ email });
          setStep(2);
        } else {
          throw new Error(response?.message || "Failed to send OTP to email");
        }
      } else {
        // phone path
        const response = await sentOtp({
          phoneNumber,
          dialCode: selectedCountry.dialCode,
        });
        if (response?.status === "success") {
          toast.info("OTP sent to your phone number");
          setUserPhoneData({
            phoneNumber,
            phoneSuffix: selectedCountry.dialCode,
          });
          setStep(2);
        } else {
          throw new Error(response?.message || "Failed to send OTP to phone");
        }
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // OTP submit
  const onOtpSubmit = async () => {
    try {
      setError("");
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("Phone or email is missing");
      }
      const otpString = otp.join("");

      let response;
      // object-style verify call (adjust user-services if needed)
      if (userPhoneData?.email) {
        response = await verifyOtp({ email: userPhoneData.email, otp: otpString });
      } else {
        response = await verifyOtp({
          phoneNumber: userPhoneData.phoneNumber,
          dialCode: userPhoneData.phoneSuffix,
          otp: otpString,
        });
      }

      if (response?.status === "success") {
        toast.success("OTP verified successfully");
        const user = response.data?.user;
        if (user?.userName && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to WhatsApp");
          navigate("/");
          resetLoginState();
        } else {
          setStep(3);
        }
      } else {
        throw new Error(response?.message || "Failed to verify OTP");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  // File input change
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file)); // preview
    }
  };

  // Profile submit
  const onProfileSubmit = async (data) => {
    try {
      setError("");
      setLoading(true);

      const formData = new FormData();
      formData.append("userName", data.userName);
      // booleans become strings in FormData, backend should handle it
      formData.append("agreed", data.agreed);

      // Append either file (media) or avatar identifier
      if (profilePictureFile) {
        formData.append("media", profilePictureFile); // send actual file
      } else {
        // send avatar identifier/string so backend knows which avatar to use
        formData.append("avatar", selectedAvatar);
      }

      // Optionally include phone/email for backend reference if needed
      if (userPhoneData?.email) {
        formData.append("email", userPhoneData.email);
      } else if (userPhoneData?.phoneNumber) {
        formData.append("phoneNumber", userPhoneData.phoneNumber);
        formData.append("dialCode", userPhoneData.phoneSuffix || "");
      }

      const response = await updateUserProfile(formData);

      if (response?.status === "success") {
        toast.success("Welcome back to WhatsApp");
        // Optionally set user from response.data.user
        const updatedUser = response.data?.user;
        if (updatedUser) setUser(updatedUser);
        navigate("/");
        resetLoginState();
      } else {
        throw new Error(response?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to update user profile");
    } finally {
      setLoading(false);
    }
  };

  // OTP input change — only digits, auto-advance, supports backspace navigation
  const handleOtpChange = (index, value) => {
    const digit = (value || "").replace(/\D/g, "").slice(-1); // keep only last digit
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""));

    if (digit) {
      // move to next if exists
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    } else {
      // if user deleted, move to previous
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  // Destination string for OTP message
  const getDestinationLabel = () => {
    if (!userPhoneData) return "";
    if (userPhoneData.email) return userPhoneData.email;
    const suffix = userPhoneData.phoneSuffix ? `${userPhoneData.phoneSuffix} ` : "";
    return `${suffix}${userPhoneData.phoneNumber || ""}`.trim();
  };

  const ProgressBar = () => (
    <div
      className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}
    >
      <div
        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{
          width: `${(step / 3) * 100}%`,
        }}
      />
    </div>
  );

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-green-400 to-blue-500"
      } flex items-center justify-center p-4 overflow-hidden`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
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

        <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          WhatsApp Login
        </h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <ProgressBar />

        {/* Step 1: Phone number / email */}
        {step === 1 && (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
            <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-4`}>
              Enter your phone number or email to receive an OTP
            </p>

            {/* Phone + Country */}
            <div className="flex w-full">
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={showDropdown}
                  className={`flex items-center justify-between h-12 px-4 text-sm font-medium border rounded-l-md ${
                    theme === "dark" ? "text-white bg-gray-700 border-gray-600" : "text-gray-900 bg-gray-100 border-gray-200"
                  } focus:outline-none`}
                  onClick={() => setShowDropdown((s) => !s)}
                >
                  <span className="flex items-center gap-2">
                    <span>{selectedCountry.flag}</span>
                    <span className="font-medium">{selectedCountry.dialCode}</span>
                  </span>
                  <FaChevronDown className="ml-2" />
                </button>

                {showDropdown && (
                  <div
                    role="listbox"
                    className={`absolute left-0 z-10 mt-1 w-56 border rounded-md shadow-lg max-h-60 overflow-auto ${
                      theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className={`sticky top-0 p-2 ${theme === "dark" ? "bg-gray-700" : "bg-white"}`}>
                      <input
                        type="text"
                        placeholder="Search countries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-200 text-gray-900"
                        }`}
                      />
                    </div>

                    {filterCountries.map((country) => (
                      <button
                        key={country.alpha2}
                        type="button"
                        className={`w-full px-3 py-2 text-left ${
                          theme === "dark" ? "hover:bg-gray-600 text-white" : "hover:bg-gray-100 text-gray-900"
                        }`}
                        onClick={() => {
                          setSelectedCountry(country);
                          setShowDropdown(false);
                        }}
                      >
                        <span className="mr-2">{country.flag}</span>
                        <span className="mr-2 font-medium">{country.dialCode}</span>
                        <span>{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                {...loginRegister("phoneNumber")}
                className={`flex-1 h-12 px-4 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"
                } ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                placeholder="Enter Phone Number"
                aria-invalid={!!loginErrors.phoneNumber}
                autoComplete="tel"
              />
            </div>

            {loginErrors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{loginErrors.phoneNumber.message}</p>
            )}

            {/* divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-300" />
              <span className="mx-3 text-gray-500 text-sm font-medium">or</span>
              <div className="flex-grow h-px bg-gray-300" />
            </div>

            {/* Email input */}
            <div
              className={`flex items-center border rounded-md py-2 px-2 ${
                theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
              }`}
            >
              <FaUser className={`mr-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
              <input
                type="email"
                {...loginRegister("email")}
                className={`flex-1 h-8 px-1 focus:outline-none bg-transparent w-full ${theme === "dark" ? "text-white" : "text-black"} ${
                  loginErrors.email ? "border-red-500" : ""
                }`}
                placeholder="Enter Email (optional)"
                aria-invalid={!!loginErrors.email}
                autoComplete="email"
              />
            </div>
            {loginErrors.email && <p className="text-red-500 text-sm mt-1">{loginErrors.email.message}</p>}

            <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
              {loading ? <Spinner /> : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
            <p className={`text-center ${theme === "dark" ? "text-gray-200" : "text-gray-600"} mb-4`}>
              Please enter the 6-digit OTP sent to <strong>{getDestinationLabel()}</strong>
            </p>

            <div className="flex justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className={`w-12 h-12 text-center border ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white text-gray-700 border-gray-200"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${otpErrors.otp ? "border-red-500" : ""}`}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                />
              ))}
            </div>

            {otpErrors.otp && <p className="text-red-500 text-sm mt-1">{otpErrors.otp.message}</p>}

            <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
              {loading ? <Spinner /> : "Verify OTP"}
            </button>

            <button
              className={`w-full mt-2 ${theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-700"} py-2 rounded-md hover:bg-gray-300 transition flex items-center justify-center`}
              onClick={handleBack}
              type="button"
            >
              <FaArrowLeft className="mr-2" />
              Wrong number? Go back
            </button>
          </form>
        )}

        {/* Step 3 (profile) is not rendered in this excerpt — if you render it, wire it to onProfileSubmit */}
      </motion.div>
    </div>
  );
};

export default UserLogin;
