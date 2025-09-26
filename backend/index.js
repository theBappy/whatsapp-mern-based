import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./configs/db-connect.js";
import authRoutes from "./routes/auth-routes.js"

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

//routes
app.use("/api/auth", authRoutes)


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
