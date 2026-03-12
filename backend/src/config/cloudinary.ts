import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Support multiple env var naming conventions (fall back to older names if present)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.Cloudname || process.env.CLOUDINARY_CLOUDNAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.APIkey || process.env.CLOUDINARY_APIKEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.APIIsecret || process.env.CLOUDINARY_APISECRET;

if (!cloudName || !apiKey || !apiSecret) {
  // If CLOUDINARY_URL is provided, cloudinary will parse it automatically. Otherwise warn so uploads don't silently fail.
  if (!process.env.CLOUDINARY_URL) {
    console.warn('Cloudinary credentials are missing or incomplete. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.');
  }
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;
