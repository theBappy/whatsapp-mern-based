import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./configs/db-connect.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
