import { useEffect, useState } from "react";
import ChatList from "../pages/chat/chat-list";
import Layout from "./layout";
import { motion } from "framer-motion";
import { getAllUsers } from "../services/user-services";

function HomePage() {

  const [allUsers, setAllUsers] = useState([]);
  const getAllUser = async () => {
    try {
      const result = await getAllUsers();
      if (result.status === "success") {
        setAllUsers(result?.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllUser();
  }, []);
  

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={allUsers} />
      </motion.div>
    </Layout>
  );
}

export default HomePage;
