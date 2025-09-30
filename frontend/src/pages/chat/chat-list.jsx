import { useState } from "react";
import { useLayoutStore } from "../../store/use-layout-store";
import { useThemeStore } from "../../store/use-theme-store";
import { useUserStore } from "../../store/use-user-store";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/format-time";

function ChatList({ contacts }) {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");
  const filteredContacts = contacts?.filter((contact) =>
    contact?.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`w-full border-r h-screen ${
        theme === "dark"
          ? "bg-[rgb(17,27,33)] border-gray-600"
          : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`p-4 flex justify-between ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
          <FaPlus />
        </button>
      </div>
      <div className="p-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-800"
            }`}
          />
          <input
            type="text"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-400"
                : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
            }`}
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh - 120px)]">
        {filteredContacts.map((contact) => (
          <motion.div
            key={contact?._id}
            onClick={() => setSelectedContact(contact)}
            className={`p-3 flex items-center cursor-pointer ${
              theme === "dark"
                ? selectedContact?._id === contact?._id
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
                : selectedContact?._id === contact?._id
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            <img
              src={contact?.profilePicture}
              alt={contact?.userName}
              className="h-12 w-12 rounded-full"
            />
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-baseline">
                <h2
                  className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  {contact?.userName}
                </h2>
                {contact?.conversation && (
                  <span
                    className={`text-xs ${
                      theme === "dark" ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {formatTimestamp(contact?.lastMessage?.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"} truncate`}>
                    {contact?.conversation?.lastMessage?.content}
                </p>
                {contact?.conversation && contact?.conversation?.unreadCount > 0 && contact?.conversation?.lastMessage?.receiver === user?._id && (
                    <p className={`text-sm font-medium w-6 h-6 flex items-center justify-center bg-yellow-500 ${theme === "dark" ? "text-gray-800" : "text-gray-400"} rounded-full`}>
                        {contact?.conversation?.unreadCount}
                    </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ChatList;
