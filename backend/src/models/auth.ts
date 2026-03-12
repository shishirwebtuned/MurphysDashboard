import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true , lowercase: true , trim: true  },
  isEmailSent : { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  refreshToken :{ type: String, default: null }
});


const Auth = mongoose.model("Auth", authSchema);

export default Auth;