import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemiller";
import Auth from "../models/auth";

export const sendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email already exists
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) {
      return res.status(409).json({ 
        message: "This email is already registered. Please login instead." 
      });
    }

    // Generate email verification token
    const verificationToken = jwt.sign(
      { 
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        step: 'email-verification'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' } // 1 hour for email verification
    );

    // Send verification email
    const verificationUrl = `${process.env.frontendurl || 'http://localhost:3000'}complete-registration?token=${verificationToken}`;
    
    const mailOptions = {
  from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  to: email,
  subject: "Verify Your Email to Complete Registration",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
          color: #111827;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .header {
          padding: 24px;
          text-align: center;
          background-color: #111827;
          color: #ffffff;
        }
        .content {
          padding: 30px;
          text-align: center;
        }
        .content h2 {
          margin-bottom: 10px;
        }
        .content p {
          margin: 10px 0;
          font-size: 14px;
          color: #374151;
        }
        .button {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 28px;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          background-color: #f9fafb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>

        <div class="content">
          <h2>Hello${firstName ? ` ${firstName}` : ""},</h2>
          <p>
            Thank you for registering. Please verify your email address to
            complete your registration.
          </p>

          <a href="${verificationUrl}" class="button">
            Verify Email
          </a>

          <p style="margin-top: 20px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Murphy's. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
};


    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
      email
    });

  } catch (error: any) {
    console.error("Send verification email error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to send verification email", 
      error: error.message 
    });
  }
};

export const verifyTokenSS = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { email: string; firstName?: string; lastName?: string; step: string };

    // Check if email already registered
    const existingAuth = await Auth.findOne({ email: decoded.email });
    if (existingAuth) {
      return res.status(409).json({ 
        success: false,
        message: "This email is already registered. Please login instead.",
        alreadyRegistered: true
      });
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName
      }
    });

  } catch (error: any) {
    console.error("Verify token error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false,
        message: "Verification link has expired. Please start registration again." 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false,
        message: "Invalid verification token." 
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Token verification failed", 
      error: error.message 
    });
  }
};

export * from "./auth.controllers";
