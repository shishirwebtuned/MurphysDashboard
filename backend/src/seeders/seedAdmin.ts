import dotenv from "dotenv";
import Profile from "../models/profile.model";
import Auth from "../models/auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

dotenv.config();

export const seedAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "❌ ADMIN_EMAIL and ADMIN_PASSWORD are required in .env file",
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if admin already exists
    const existingAuth = await Auth.findOne({ email: adminEmail });
    if (existingAuth) {
      console.log("ℹ️ Admin user already exists:", adminEmail);
      await session.endSession();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create Auth record
    const authUser = await Auth.create(
      [{ email: adminEmail, password: hashedPassword }],
      { session },
    );

    // Create Profile record
    const admin = await Profile.create(
      [
        {
          userId: authUser[0]._id,
          firstName: "Admin",
          lastName: "User",
          email: adminEmail,
          role_type: "admin user",
          status: "active",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    console.log("✅ Admin user seeded successfully:", adminEmail);
  } catch (error: any) {
    await session.abortTransaction();
    throw new Error(`❌ Failed to seed admin user: ${error.message}`);
  } finally {
    session.endSession();
  }
};
