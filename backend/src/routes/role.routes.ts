import { Router } from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  toggleRolePermission,
  assignRoleToUser,
  getUsersByRole,
  getAvailablePermissions
} from "../conttrolers/role.controllers";
// import { verifyToken } from "../middleware/auth";
import { isAdmin, checkPermission, Permission } from "../middleware/rbac";

const rolerouter = Router();

// All role management routes require admin access
// rolerouter.use(verifyToken, isAdmin);

// Role CRUD operations (require manage_roles permission)
rolerouter.post("/roles", createRole);
rolerouter.get("/roles", getAllRoles);
rolerouter.get("/roles/:id",  getRoleById);
rolerouter.put("/roles/:id", updateRole);
rolerouter.delete("/roles/:id", deleteRole);
// Permission management
rolerouter.post("/roles/permissions/toggle", toggleRolePermission);
rolerouter.get("/permissions/available", getAvailablePermissions);

// User-role assignment
rolerouter.post("/roles/assign", assignRoleToUser);
rolerouter.get("/roles/:roleId/users", getUsersByRole);

export default rolerouter;
