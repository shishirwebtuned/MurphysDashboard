import { Router } from "express";
import { 
  createProfile, 
  getProfiles, 
  getProfileById, 
  updateProfile, 
  sentemail, 
  getProfileByEmail, 
  getAdminProfiles,
  toggleUserPermission,
  updateUserRole,
  updateUserStatus,
  getUserPermissions
} from "../conttrolers/profile.conttrolers";
import upload from "../middleware/upload";
import cloudinaryUpload from "../middleware/cloudinaryUpload";
import { verifyToken } from "../middleware/auth";
// import { isAdmin, isOwnerOrAdmin, checkPermission, Permission } from "../middleware/rbac";

const profilerouter = Router();

// Public routes (no authentication required)
profilerouter.post("/profiles", upload.single('profile_image'), cloudinaryUpload, verifyToken, createProfile);

// Protected routes (authentication required)
profilerouter.get("/profiles", verifyToken, getProfiles);
profilerouter.get("/profiles/types", verifyToken, getAdminProfiles);
profilerouter.get("/profiles/:id", verifyToken, getProfileById);
profilerouter.get("/profiles/email/:email", verifyToken, getProfileByEmail);
profilerouter.put("/profiles/:id", verifyToken, upload.single('profile_image'), cloudinaryUpload, updateProfile);

// Email route (admin only)
profilerouter.post("/send-email", verifyToken, sentemail);
profilerouter.post("/profiles/permissions/toggle", verifyToken, toggleUserPermission);
profilerouter.post("/profiles/permissions/role", verifyToken, updateUserRole);
profilerouter.post("/profiles/permissions/status", verifyToken, updateUserStatus);
profilerouter.get("/profiles/permissions/:userId", verifyToken, getUserPermissions);

export default profilerouter;   