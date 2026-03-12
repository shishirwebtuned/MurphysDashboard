import * as nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error("SMTP_USER and SMTP_PASS must be set in your .env file");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587, // Use port 465 instead of 587 for Render
  secure: false, // Use SSL/TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

// Verify transporter configuration (with error handling)
transporter.verify(function (error: Error | null, success: boolean) {
  if (error) {
    console.error("⚠️ SMTP Connection Error:", error.message);
    console.error("Check: 1) Brevo credentials 2) Sender verified 3) Render env vars");
  } else {
    console.log("✅ SMTP Server is ready to send emails");
  }
});

export default transporter;