import mongoose from "mongoose";
import Role from "../models/role.model";
import dotenv from "dotenv";
import connectDB from "../config/connectdb";

dotenv.config();

// Predefined roles with permissions
const predefinedRoles = [
  // ===== CLIENT-SIDE ROLES =====
  {
    name: "Client Owner",
    description: "Full access to client account, can manage other client users",
    permissions: [
      "read_profile",
      "update_profile",
      "create_profile",
      "manage_users",
      "view_payments",
      "manage_payments",
      "create_service",
      "update_service",
      "delete_service",
      "send_invitation",
      "manage_invitations"
    ],
    isActive: true,
    category: "client"
  },
  {
    name: "Billing Manager",
    description: "Manages invoices and payments only",
    permissions: [
      "read_profile",
      "update_profile",
      "view_payments",
      "manage_payments"
    ],
    isActive: true,
    category: "client"
  },
  {
    name: "Viewer",
    description: "Read-only access to client account",
    permissions: [
      "read_profile",
      "view_payments"
    ],
    isActive: true,
    category: "client"
  },

  // ===== INTERNAL ROLES (Murphys) =====
  {
    name: "Super Admin",
    description: "Full system access - everything",
    permissions: [
      "create_profile",
      "read_profile",
      "update_profile",
      "delete_profile",
      "manage_users",
      "manage_roles",
      "manage_permissions",
      "create_service",
      "update_service",
      "delete_service",
      "assign_service",
      "view_payments",
      "manage_payments",
      "send_invitation",
      "manage_invitations"
    ],
    isActive: true,
    category: "internal"
  },
  {
    name: "Accounts",
    description: "Manages invoices, payments, and reminder rules",
    permissions: [
      "read_profile",
      "view_payments",
      "manage_payments",
      "send_invitation",
      "manage_invitations"
    ],
    isActive: true,
    category: "internal"
  },
  {
    name: "Support/PM",
    description: "View client data, services, and tickets (Phase 2)",
    permissions: [
      "read_profile",
      "view_payments",
      "create_service",
      "update_service",
      "assign_service",
      "send_invitation"
    ],
    isActive: true,
    category: "internal"
  },
  {
    name: "Sales",
    description: "Create service orders and quotes (Phase 2)",
    permissions: [
      "read_profile",
      "create_service",
      "update_service",
      "view_payments",
      "send_invitation"
    ],
    isActive: true,
    category: "internal"
  }
];

const seedRoles = async () => {
  try {
    console.log("🌱 Starting role seeder...");
    
    // Connect to database
    await connectDB();
    console.log("✅ Database connected");

    // Clear existing roles (optional - comment out if you want to keep existing roles)
    const existingCount = await Role.countDocuments();
    console.log(`📊 Found ${existingCount} existing roles`);

    // Ask for confirmation before clearing
    console.log("⚠️  This will create predefined roles. Existing roles will be preserved.");

    // Insert predefined roles
    let createdCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const roleData of predefinedRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        // Update existing role with new permissions
        existingRole.description = roleData.description;
        existingRole.permissions = roleData.permissions;
        existingRole.isActive = roleData.isActive;
        // Validate category before assigning to avoid enum/type issues
        const allowedCategories = ['client', 'internal', 'custom'];
        if (allowedCategories.includes(roleData.category)) {
          existingRole.category = roleData.category as 'client' | 'internal' | 'custom';
        } else {
          console.warn(`⚠️  Role "${roleData.name}" has unknown category: ${roleData.category}. Defaulting to 'custom'.`);
          existingRole.category = 'custom';
        }
        await existingRole.save();
        console.log(`🔄 Updated role: ${roleData.name}`);
        updatedCount++;
      } else {
        // Create new role
        await Role.create({
          ...roleData,
          createdBy: "system-seeder"
        });
        console.log(`✨ Created role: ${roleData.name}`);
        createdCount++;
      }
    }

    console.log("\n✅ Role seeding completed!");
    console.log(`📈 Summary:`);
    console.log(`   - Created: ${createdCount} roles`);
    console.log(`   - Updated: ${updatedCount} roles`);
    console.log(`   - Total predefined roles: ${predefinedRoles.length}`);

    // Display all roles
    const allRoles = await Role.find().sort({ category: 1, name: 1 });
    console.log("\n📋 All Roles in Database:");
    console.log("=".repeat(80));
    
    let currentCategory = "";
    for (const role of allRoles) {
      if (role.category !== currentCategory) {
        currentCategory = role.category;
        console.log(`\n🏷️  ${currentCategory?.toUpperCase() || 'UNCATEGORIZED'} ROLES:`);
      }
      console.log(`   ${role.name} - ${role.permissions.length} permissions`);
      console.log(`   └─ ${role.description}`);
    }

    console.log("\n" + "=".repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    process.exit(1);
  }
};

// Run seeder
seedRoles();
