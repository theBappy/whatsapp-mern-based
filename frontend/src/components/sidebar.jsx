import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useThemeStore } from "../store/use-theme-store";
import { useUserStore } from "../store/use-user-store";
import { useLayoutStore } from "../store/use-layout-store";
import { FaWhatsapp, FaUserCircle, FaCog } from "react-icons/fa";
import { motion } from "framer-motion";
import { MdRadioButtonChecked } from "react-icons/md";

function Sidebar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("chats");
    } else if (location.pathname === "/status") {
      setActiveTab("status");
    } else if (location.pathname === "/user-profile") {
      setActiveTab("profile");
    } else if (location.pathname === "/setting") {
      setActiveTab("setting");
    }
  }, [location, setActiveTab]);

  if (isMobile && selectedContact) {
    return null;
  }

  const SidebarContent = () => (
    <>
      <Link
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "chats" && "bg-gray-200 shadow-sm p-2 rounded-full"
        } focus:outline-none`}
        to="/"
      >
        <FaWhatsapp
          className={`h-6 w-6 ${
            activeTab === "chats"
              ? theme === "dark"
                ? "text-gray-800"
                : ""
              : theme === "dark"
              ? "text-gray-200"
              : "text-gray-800"
          }`}
        />
      </Link>
      <Link
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "status" && "bg-gray-200 shadow-sm p-2 rounded-full"
        } focus:outline-none`}
        to="/status"
      >
        <MdRadioButtonChecked
          className={`h-6 w-6 ${
            activeTab === "status"
              ? theme === "dark"
                ? "text-gray-800"
                : ""
              : theme === "dark"
              ? "text-gray-200"
              : "text-gray-800"
          }`}
        />
      </Link>
      {!isMobile && <div className="flex-grow" />}

      <Link
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "profile" && "bg-gray-200 shadow-sm p-2 rounded-full"
        } focus:outline-none`}
        to="/user-profile"
      >
        {user?.profilePicture ? (
          <img
            src={user?.profilePicture}
            alt="user-image"
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <FaUserCircle
            className={`h-6 w-6 ${
              activeTab === "profile"
                ? theme === "dark"
                  ? "text-gray-800"
                  : ""
                : theme === "dark"
                ? "text-gray-200"
                : "text-gray-800"
            }`}
          />
        )}
      </Link>
      <Link
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "setting" && "bg-gray-200 shadow-sm p-2 rounded-full"
        } focus:outline-none`}
        to="/setting"
      >
        <FaCog
          className={`h-6 w-6 ${
            activeTab === "setting"
              ? theme === "dark"
                ? "text-gray-800"
                : ""
              : theme === "dark"
              ? "text-gray-200"
              : "text-gray-800"
          }`}
        />
      </Link>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${
        isMobile
          ? "fixed bottom-0 left-0 right-0 h-16"
          : "w-16 h-screen border-r-2"
      }
      ${
        theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-[rgb(239, 242, 254)] border-gray-300"
      }
      bg-opacity-90 flex items-center py-4 shadow-lg
      ${isMobile ? "flex-row justify-around" : "flex-col justify-between"}
      `}
    >
      <SidebarContent />
    </motion.div>
  );
}

export default Sidebar;
