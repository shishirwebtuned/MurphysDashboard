import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String },
    lastName: { type: String },
    invite_type: { type: String, enum: ['invite', 'non invite'], default: 'non invite' },
    invite_email: { type: String },
    inviteStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    role_type: { type: String, enum: ['client user', 'admin user'] },
}, { timestamps: true });
const Invite = mongoose.model("invite", inviteSchema);

export default Invite;