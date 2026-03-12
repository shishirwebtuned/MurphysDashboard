import mongoose from "mongoose";

export const noticeSchema = new mongoose.Schema({
  firstName: { type: String, required: true, uppercase: true },
  lastName: { type: String, required: true, uppercase: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: Boolean, default: false },
}, { timestamps: true });


const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;