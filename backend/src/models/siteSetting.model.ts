import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema({
    appName: { type: String, required: true, default: "Murphy's Admin" },
    description: { type: String, default: "" },
    logo: { type: String, default: "" },
    publicid: { type: String, default: "" }, // For cloudinary or similar if needed
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    footerText: { type: String, default: "" },
    currency: { type: String, default: "USD" },
    socialLinks: {
        facebook: { type: String, default: "" },
        twitter: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        instagram: { type: String, default: "" },
    },
    maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure only one document exists usually, but for now standard model is fine.
const SiteSetting = mongoose.model("SiteSetting", siteSettingSchema);
export default SiteSetting;
