import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { connectDB } from "./configs/db-connect.js";
import authRoutes from "./routes/auth-routes.js";
import chatRoutes from "./routes/chat-routes.js";
import statusRoutes from "./routes/status-routes.js";
import { initializeSocket } from "./services/socket-service.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOption));

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

//create server
const server = http.createServer(app);
const io = initializeSocket(server);

//apply socket middleware before routes
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/status", statusRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
