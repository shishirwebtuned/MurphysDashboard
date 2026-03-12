import cloudinary from "../config/cloudinary";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

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

const cloudinaryMultiUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const fileReq = req as Request & {
    files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
  };

  // Check if files exist
  if (
    !fileReq.files ||
    (Array.isArray(fileReq.files) && fileReq.files.length === 0)
  ) {
    // No files uploaded, continue without uploading to Cloudinary
    return next();
  }

  try {
    const images: string[] = [];
    const publicIds: string[] = [];

    // Handle array of files
    const filesArray = Array.isArray(fileReq.files)
      ? fileReq.files
      : Object.values(fileReq.files).flat();

    // Upload each file to Cloudinary
    for (const file of filesArray) {
      const uploadPath = file.path || file.filename;

      if (uploadPath) {
        const result = await cloudinary.uploader.upload(uploadPath, {
          folder: "MurphysDashboard/tickets",
        });

        images.push(result.secure_url);
        publicIds.push(result.public_id);

        // Delete local file after upload
        if (fs.existsSync(uploadPath)) {
          try {
            fs.unlinkSync(uploadPath);
          } catch (e) {
            console.warn("Failed to delete local upload:", e);
          }
        }
      }
    }

    // Attach uploaded images info to request body
    req.body.images = images;
    req.body.publicIds = publicIds;

    next();
  } catch (error: any) {
    console.error("Cloudinary multi-upload error:", error);
    const errMsg = error?.message || "Unknown error";
    const errName = error?.name || "Error";
    return res.status(500).json({
      message: "Cloudinary upload failed",
      error: { name: errName, message: errMsg },
    });
  }
};

export default cloudinaryMultiUpload;
