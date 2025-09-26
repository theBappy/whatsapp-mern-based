import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Mongo db connected successfully");
  } catch (error) {
    console.error("Error connecting in mongo db", error.message);
    process.exit(1)
  }
};
