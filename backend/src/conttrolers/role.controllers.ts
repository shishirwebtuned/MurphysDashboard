import Role from "../models/role.model";
import Profile from "../models/profile.model";
import { Request, Response } from "express";

// Create a new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const userProfile = (req as any).profile;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ 
        message: 'Role name and permissions array are required' 
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name });
    if (existingRole) {
      return res.status(409).json({ 
        message: 'Role with this name already exists' 
      });
    }

    const role = new Role({
      name,
      description,
      permissions,
      createdBy: userProfile?.email
    });

    await role.save();

    res.status(201).json({
      data: role,
      message: 'Role created successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get all roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive as string | undefined;
    const category = req.query.category as string | undefined;

    const filter: any = {};
    
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } }
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (category) {
      filter.category = category;
    }

    const [total, roles] = await Promise.all([
      Role.countDocuments(filter),
      Role.find(filter).skip(skip).limit(limit).sort({ category: 1, createdAt: -1 })
    ]);

    res.status(200).json({
      data: roles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      message: 'Roles retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get role by ID
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({
      data: role,
      message: 'Role retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name: name });
      if (existingRole) {
        return res.status(409).json({ 
          message: 'Role with this name already exists' 
        });
      }
      role.name = name;
    }

    if (description !== undefined) role.description = description;
    if (permissions !== undefined && Array.isArray(permissions)) {
      role.permissions = permissions;
    }
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    res.status(200).json({
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if any users have this role
    const usersWithRole = await Profile.countDocuments({ role: id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
      });
    }

    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({
      data: role,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Toggle permission in role
export const toggleRolePermission = async (req: Request, res: Response) => {
  try {
    const { roleId, permission } = req.body;

    if (!roleId || !permission) {
      return res.status(400).json({ 
        message: 'Role ID and permission are required' 
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const permissionIndex = role.permissions.indexOf(permission);
    if (permissionIndex > -1) {
      // Remove permission
      role.permissions.splice(permissionIndex, 1);
    } else {
      // Add permission
      role.permissions.push(permission);
    }

    await role.save();

    res.status(200).json({
      data: role,
      message: `Permission ${permissionIndex > -1 ? 'removed from' : 'added to'} role successfully`,
      permissions: role.permissions
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Assign role to user
export const assignRoleToUser = async (req: Request, res: Response) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ 
        message: 'User ID and Role ID are required' 
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (!role.isActive) {
      return res.status(400).json({ 
        message: 'Cannot assign an inactive role' 
      });
    }

    const profile = await Profile.findById(userId);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    profile.role = roleId;
    await profile.save();

    res.status(200).json({
      data: {
        user: profile,
        role: role
      },
      message: 'Role assigned to user successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get users by role
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const [total, users] = await Promise.all([
      Profile.countDocuments({ role: roleId }),
      Profile.find({ role: roleId }).skip(skip).limit(limit)
    ]);

    res.status(200).json({
      data: {
        role: role,
        users: users
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Get available permissions list
export const getAvailablePermissions = async (req: Request, res: Response) => {
  try {
    const permissions = [
      { key: 'create_profile', label: 'Create Profile', category: 'Profile' },
      { key: 'read_profile', label: 'Read Profile', category: 'Profile' },
      { key: 'update_profile', label: 'Update Profile', category: 'Profile' },
      { key: 'delete_profile', label: 'Delete Profile', category: 'Profile' },
      { key: 'manage_users', label: 'Manage Users', category: 'User Management' },
      { key: 'manage_roles', label: 'Manage Roles', category: 'User Management' },
      { key: 'manage_permissions', label: 'Manage Permissions', category: 'User Management' },
      { key: 'create_service', label: 'Create Service', category: 'Service' },
      { key: 'update_service', label: 'Update Service', category: 'Service' },
      { key: 'delete_service', label: 'Delete Service', category: 'Service' },
      { key: 'assign_service', label: 'Assign Service', category: 'Service' },
      { key: 'view_payments', label: 'View Payments', category: 'Payment' },
      { key: 'manage_payments', label: 'Manage Payments', category: 'Payment' },
      { key: 'send_invitation', label: 'Send Invitation', category: 'Invitation' },
      { key: 'manage_invitations', label: 'Manage Invitations', category: 'Invitation' },
      { key: 'create_role', label: 'Create Role', category: 'Role Management' },
      {key: 'update_role', label: 'Update Role', category: 'Role Management' },
      { key: 'delete_role', label: 'Delete Role', category: 'Role Management' },
      { key: 'create_category', label: 'Create Category', category: 'Category Management' },
      { key: 'update_category', label: 'Update Category', category: 'Category Management' },
      { key: 'delete_category', label: 'Delete Category', category: 'Category Management' }
    ];

    res.status(200).json({
      data: permissions,
      message: 'Available permissions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
