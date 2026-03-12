import cloudinary from "../config/cloudinary";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// Lightweight local type for Multer's File to avoid depending on @types/multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

const cloudinaryUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const fileReq = req as Request & { file: MulterFile };
  if (!fileReq.file) {
    // No file uploaded, continue without uploading to Cloudinary
    return next();
  }
  try {
    const uploadPath = fileReq.file.path || fileReq.file.filename || undefined;
    const result = await cloudinary.uploader.upload(uploadPath as string, {
      folder: "MurphysDashboard/uploads",
    });
    // Optionally delete local file after upload (only if a path exists)
    if (uploadPath && fs.existsSync(uploadPath)) {
      try {
        fs.unlinkSync(uploadPath);
      } catch (e) {
        console.warn("Failed to delete local upload:", e);
      }
    }
    // Attach uploaded image info to the request body for downstream handlers
    (req as any).body[fileReq.file.fieldname] = result.secure_url;
    (req as any).body.public_id = result.public_id;
    next();
  } catch (error: any) {
    // Log full error to console for debugging
    console.error("Cloudinary upload error:", error);
    const errMsg = error?.message || "Unknown error";
    const errName = error?.name || "Error";
    return res
      .status(500)
      .json({
        message: "Cloudinary upload failed",
        error: { name: errName, message: errMsg },
      });
  }
};

export default cloudinaryUpload;
