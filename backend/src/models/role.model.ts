import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String 
  },
  permissions: [{ 
    type: String,
    required: true 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  category: {
    type: String,
    enum: ['client', 'internal', 'custom'],
    default: 'custom'
  },
  createdBy: { 
    type: String // Email of the admin who created this role or 'system-seeder'
  }
}, { timestamps: true });

const Role = mongoose.model("Role", roleSchema);
export default Role;
