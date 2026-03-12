import { Request, Response } from "express";
import OtpModel from "../models/otp.model";
import transporter from "../config/nodemiller";

// Generate a 6-digit numeric OTP
const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /api/admin-otp/send
 * Body: { email: string }
 * Generates a fresh OTP, stores it in DB, and emails it to the user.
 */
export const sendAdminOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalised = email.toLowerCase().trim();

    // Delete any existing (unused / expired) OTPs for this email
    await OtpModel.deleteMany({ email: normalised });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OtpModel.create({ email: normalised, code, expiresAt, used: false });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: normalised,
      subject: "Your Admin Access Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; color: #111827; }
            .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
            .header { padding: 24px; text-align: center; background-color: #111827; color: #ffffff; }
            .header h1 { margin: 0; font-size: 20px; }
            .content { padding: 32px; text-align: center; }
            .otp { font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #111827; margin: 24px 0; }
            .note { font-size: 13px; color: #6b7280; margin-top: 16px; }
            .footer { padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>Admin Access Verification</h1></div>
            <div class="content">
              <p>Use the following one-time password to access the admin section:</p>
              <div class="otp">${code}</div>
              <p class="note">This code expires in <strong>5 minutes</strong> and can only be used once.</p>
            </div>
            <div class="footer">If you did not request this, please ignore this email.</div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("sendAdminOtp error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

/**
 * POST /api/admin-otp/verify
 * Body: { email: string, code: string }
 * Checks the OTP against DB. Marks it as used on success.
 */
export const verifyAdminOtp = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const normalised = email.toLowerCase().trim();

    const otp = await OtpModel.findOne({
      email: normalised,
      code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      return res.status(400).json({ valid: false, message: "Invalid or expired OTP" });
    }

    // Mark as used so it cannot be reused
    otp.used = true;
    await otp.save();

    return res.status(200).json({ valid: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("verifyAdminOtp error:", error);
    return res.status(500).json({ message: "Verification failed" });
  }
};
