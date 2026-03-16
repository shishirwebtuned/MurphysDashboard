import { Request, Response } from "express";
import Profile from "../models/profile.model";
import { AuthenticatedRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemiller";
import Auth from "../models/auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Invite from "../models/invite.model";

export const registerUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      firstName,
      lastName,
      email,
      gender,
      phone,
      country,
      referralSource,
      password,
      inviteToken,
    } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if user already exists
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Default role
    let role_type = "client user";
    let usertypes = "client";
    let inviteDoc: any = null;

    if (inviteToken) {
      try {
        const decoded = jwt.verify(inviteToken, process.env.JWT_SECRET!) as any;

        if (decoded.email !== email) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: "Invite token email does not match registration email",
          });
        }

        // Find invite by email & type
        inviteDoc = await Invite.findOne({
          email: decoded.email,
          invite_type: "invite",
        }).session(session);

        if (!inviteDoc) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: "Invite not found" });
        }

        // Use role from token/invite
        role_type = decoded.role_type || inviteDoc.role_type || "client user";
        usertypes = role_type === "admin user" ? "admin" : "client";

        // Do NOT block if invite already accepted
        // We'll still allow registration if Auth doesn't exist
      } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "Invalid or expired invite token",
          error: error.message,
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Auth
    const authUser = await Auth.create([{ email, password: hashedPassword }], {
      session,
    });

    // Create Profile
    const profile = await Profile.create(
      [
        {
          userId: authUser[0]._id,
          firstName,
          lastName,
          email,
          phone: phone || "",
          gender: gender || "",
          country: country || "Australia",
          referralSource: referralSource || "",
          role_type,
          status: "active",
          usertypes,
        },
      ],
      { session },
    );

    // ✅ Only now mark invite as accepted
    if (inviteDoc) {
      inviteDoc.inviteStatus = "accepted";
      await inviteDoc.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: profile[0]._id,
        firstName: profile[0].firstName,
        lastName: profile[0].lastName,
        email: profile[0].email,
        role_type: profile[0].role_type,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  try {
    // Find user by email
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Create JWT token (use jwt sign options, not cookie options)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1h" }, //1 hour only
    );

    if (rememberMe) {
      // save the refresh token in the db
      const refreshToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || "defaultrefreshsecret",
        { expiresIn: "30d" },
      );
      user.refreshToken = refreshToken;
      await user.save();
    }

    // Only generate refresh token if rememberMe is true
    const response: { token: string; refreshToken?: string } = { token };
    if (rememberMe) {
      const refreshToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || "defaultrefreshsecret",
        { expiresIn: "30d" },
      );
      response.refreshToken = refreshToken;
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await Auth.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await Profile.findOne({ userId: user._id });
    let frontendUrl =
      process.env.USER_FRONTEND_URL ||
      "https://client.murphystechnology.com.au/";

    if (profile && profile.role_type === "admin user") {
      frontendUrl =
        process.env.ADMIN_FRONTEND_URL ||
        "https://login.murphystechnology.com.au/";
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    const resetUrl = `${frontendUrl}reset-password?token=${token}`;

    const fromEmail =
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER ||
      `no-reply@${process.env.FRONTEND_HOST || "example.com"}`;

    try {
      await transporter.sendMail({
        from: `"Support Team" <${fromEmail}>`,
        to: email,
        subject: "Reset Your Password",
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset</h2>
          <p>Click the button below to reset your password.</p>
          <a 
            href="${resetUrl}" 
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            "
          >
            Reset Password
          </a>
        </div>
      `,
      });

      user.isEmailSent = true;
      await user.save();

      res.status(200).json({ message: "Password reset link sent to email" });
    } catch (mailError: any) {
      console.error("Email send error:", mailError);
      if (mailError && mailError.code === "EENVELOPE") {
        return res.status(500).json({
          message:
            "Email sending failed: invalid FROM/TO envelope (check SMTP_FROM/SMTP_USER).",
        });
      }
      return res.status(500).json({
        message: "Email sending failed",
        error: mailError?.message || mailError,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const verifyForgotPasswordToken = async (
  req: Request,
  res: Response,
) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decoded || typeof decoded === "string") {
      return res
        .status(400)
        .json({ valid: false, message: "Invalid or expired token" });
    }

    const payload = decoded as { userId?: string; email?: string };
    if (!payload.userId || !payload.email) {
      return res
        .status(400)
        .json({ valid: false, message: "Invalid or expired token" });
    }

    const user = await Auth.findOne({
      _id: payload.userId,
      email: payload.email,
      isEmailSent: true,
    });
    if (!user) {
      return res
        .status(400)
        .json({ valid: false, message: "Invalid or expired token" });
    }

    res.status(200).json({
      data: { email: payload.email, userId: payload.userId },
      valid: true,
    });
  } catch (error) {
    res.status(400).json({ valid: false, message: "Invalid or expired token" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { id, email, newPassword } = req.body;

  try {
    const user = await Auth.findOne({ _id: id, email, isEmailSent: true });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or invalid request" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isEmailSent = false;
    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    ) as { userId: string; email: string; profileId: string };

    // Find and update profile
    const profile = await Profile.findById(decoded.profileId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.status === "active") {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
        alreadyVerified: true,
      });
    }

    // Update profile status to active
    profile.status = "active";
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Your account is now active.",
      data: {
        id: profile._id,
        email: profile.email,
        status: profile.status,
      },
    });
  } catch (error: any) {
    console.error("Email verification error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Verification link has expired. Please request a new one.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
};

export const resendVerificationEmail = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find profile
    const profile = await Profile.findOne({ email });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.status === "active") {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
        alreadyVerified: true,
      });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      {
        email: profile.email,
        profileId: profile._id,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    );

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3001"}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Hi ${profile.firstName},</h2>
              <p>You requested a new verification link. Click the button below to verify your email:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Murphy's SaaS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
      error: error.message,
    });
  }
};
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userIdentifier = req.user;

    if (!userIdentifier) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Extract the actual userId string from the user object
    const userId = userIdentifier.userId || userIdentifier.uid;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid user data" });
    }

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh Token Controller
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  console.log("nepal");
  try {
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || "defaultrefreshsecret",
    ) as { userId: string };

    const user = await Auth.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: "Access denied" });
    }
    const newToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "30d" }, //1 month
    );
    res.status(200).json({ token: newToken });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// change password controller for logged in users

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const userIdentifier = req.user;
    if (!userIdentifier) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = userIdentifier.userId || userIdentifier.uid;
    const user = await Auth.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const userIdentifier = req.user;
  const userId = userIdentifier?.userId || userIdentifier?.uid;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await Auth.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    // Delete profile directly
    await Profile.deleteOne({ userId }).session(session);

    // Delete auth user
    await Auth.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    session.endSession();
  }
};
