import ChatList from "../pages/chat/chat-list";
import Layout from "./layout";
import { motion } from "framer-motion";

function HomePage() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList />
      </motion.div>
    </Layout>
  );
}

export default HomePage;
