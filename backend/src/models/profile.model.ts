import mongoose from "mongoose";
const profileSchema = new mongoose.Schema({ 
userId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Auth', unique: true }, // Reference to Auth model
bio :{type: String },
city: { type: String },
country: { type: String },
dob: { type: Date },
doj: { type: Date },
email: { type: String , required: true, unique: true , lowercase: true, trim: true },
firstName: { type: String },
gender: { type: String },
lastName: { type: String },
middleName: { type: String },
phone: { type: String },
position: { type: String },
state: { type: String },
website: { type: String },
profile_image: { type: String },
public_id: { type: String },
usertypes: { type: String },
role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }, // Reference to custom Role
status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
role_type: { type: String , enum: ['client user', 'admin user'] }, // Type: admin or client
permissions: [{ type: String }], // Custom permissions array for granular access control
referralSource: { type: String }, // How did the user hear about us
}, { timestamps: true });

const Profile = mongoose.model("Profile",profileSchema);
export default Profile;         