import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
    
}, {timestamps: true})

export const Status = mongoose.model("Status", statusSchema)