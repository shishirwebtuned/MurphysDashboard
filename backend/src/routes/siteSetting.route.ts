import { Router } from "express";
import { getSiteSettings, updateSiteSettings } from "../conttrolers/siteSetting.controller";
import upload from "../middleware/upload";
import cloudinaryUpload from "../middleware/cloudinaryUpload";
import { verifyToken } from "../middleware/auth";
import { isAdmin } from "../middleware/rbac";


const siteSettingRouter = Router();

// Public route to get settings (e.g. for login page logo)
siteSettingRouter.get("/", verifyToken, getSiteSettings);

// Protected routes for updates
siteSettingRouter.put("/", verifyToken, isAdmin, upload.single('logo'), cloudinaryUpload, updateSiteSettings);

export default siteSettingRouter;
