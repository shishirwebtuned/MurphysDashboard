import { Request, Response, NextFunction } from 'express';
import Profile from '../models/profile.model';
import Role from '../models/role.model';
// import { AuthenticatedRequest } from './auth';

// Define available permissions
export enum Permission {
  // Profile permissions
  CREATE_PROFILE = 'create_profile',
  READ_PROFILE = 'read_profile',
  UPDATE_PROFILE = 'update_profile',
  DELETE_PROFILE = 'delete_profile',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_PERMISSIONS = 'manage_permissions',
  
  // Service permissions
  CREATE_SERVICE = 'create_service',
  READ_SERVICE = 'read_service',
  UPDATE_SERVICE = 'update_service',
  DELETE_SERVICE = 'delete_service',
  ASSIGN_SERVICE = 'assign_service',
  VIEW_ASSIGNED_SERVICES = 'view_assigned_services',
  ACCEPT_ASSIGNED_SERVICE = 'accept_assigned_service',
  
  // Category permissions
  CREATE_CATEGORY = 'create_category',
  VIEW_CATEGORY = 'view_category',
  UPDATE_CATEGORY = 'update_category',
  DELETE_CATEGORY = 'delete_category',
  
  // Payment permissions
  CREATE_PAYMENT = 'create_payment',
  VIEW_PAYMENTS = 'view_payments',
  UPDATE_PAYMENT = 'update_payment',
  DELETE_PAYMENT = 'delete_payment',
  MANAGE_PAYMENTS = 'manage_payments',
  
  // Invitation permissions
  SEND_INVITATION = 'send_invitation',
  VIEW_INVITATIONS = 'view_invitations',
  UPDATE_INVITATION = 'update_invitation',
  DELETE_INVITATION = 'delete_invitation',
  MANAGE_INVITATIONS = 'manage_invitations'
}

// Role definitions with default permissions
export const RolePermissions: { [key: string]: Permission[] } = {
  'admin user': [
    Permission.CREATE_PROFILE,
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.DELETE_PROFILE,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_PERMISSIONS,
    Permission.CREATE_SERVICE,
    Permission.UPDATE_SERVICE,
    Permission.DELETE_SERVICE,
    Permission.ASSIGN_SERVICE,
    Permission.VIEW_PAYMENTS,
    Permission.MANAGE_PAYMENTS,
    Permission.SEND_INVITATION,
    Permission.MANAGE_INVITATIONS
  ],
  'client user': [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_PAYMENTS
  ]
};

/**
 * Middleware to check if user has required permissions
 * @param requiredPermissions - Array of permissions required to access the route
 */
export const checkPermission = (...requiredPermissions: Permission[]) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.email) {
        res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        });
        return;
      }

      // Fetch user profile from database
      const profile = await Profile.findOne({ email: req.user.email });

      if (!profile) {
        res.status(404).json({ 
          error: 'Profile not found', 
          message: 'User profile does not exist' 
        });
        return;
      }

      // Check if profile is active
      if (profile.status !== 'active') {
        res.status(403).json({ 
          error: 'Account inactive', 
          message: 'Your account has been disabled. Please contact support.' 
        });
        return;
      }

      // Get user's permissions from their assigned role
      let userPermissions: string[] = [];

      // Get role permissions if assigned
      if (profile.role) {
        const userRole = await Role.findById(profile.role);
        if (userRole && userRole.isActive) {
          userPermissions = [...userRole.permissions];
        }
      }

      // Merge with custom permissions if any
      if (profile.permissions && Array.isArray(profile.permissions)) {
        userPermissions = [...new Set([...userPermissions, ...profile.permissions])];
      }

      // Check if user has all required permissions
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission as string)
      );

      if (!hasPermission) {
        res.status(403).json({ 
          error: 'Forbidden', 
          message: 'You do not have permission to access this resource',
          required: requiredPermissions,
          userPermissions: userPermissions
        });
        return;
      }

      // Attach profile to request for use in controllers
      (req as any).profile = profile;

      next();
    } catch (error: any) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  };
};

/**
 * Middleware to check if user has admin role
 */
export const isAdmin = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.email) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
      return;
    }

    const profile = await Profile.findOne({ email: req.user.email }).populate('role');

    if (!profile) {
      res.status(404).json({ 
        error: 'Profile not found', 
        message: 'User profile does not exist' 
      });
      return;
    }

    // Check if profile has an active role with admin permissions
    let isAdminUser = false;
    
    if (profile.role) {
      const userRole = await Role.findById(profile.role);
      if (userRole && userRole.isActive) {
        // Check if role has admin permissions (like MANAGE_ROLES, MANAGE_USERS, etc.)
        const adminPermissions = [
          Permission.MANAGE_ROLES,
          Permission.MANAGE_USERS,
          Permission.MANAGE_PERMISSIONS
        ];
        isAdminUser = adminPermissions.some(perm => userRole.permissions.includes(perm));
      }
    }
    
    // Fallback to role_type if role is not set
    if (!isAdminUser && profile.role_type === 'admin user') {
      isAdminUser = true;
    }

    if (!isAdminUser) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required' 
      });
      return;
    }

    if (profile.status !== 'active') {
      res.status(403).json({ 
        error: 'Account inactive', 
        message: 'Your account has been disabled' 
      });
      return;
    }

    (req as any).profile = profile;
    next();
  } catch (error: any) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

/**
 * Middleware to check if user can access their own resource or is admin
 */
export const isOwnerOrAdmin = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.email) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
      return;
    }

    const profile = await Profile.findOne({ email: req.user.email });

    if (!profile) {
      res.status(404).json({ 
        error: 'Profile not found', 
        message: 'User profile does not exist' 
      });
      return;
    }

    // Check if user has admin permissions from their role
    let isAdminUser = false;
    
    if (profile.role) {
      const userRole = await Role.findById(profile.role);
      if (userRole && userRole.isActive) {
        const adminPermissions = [
          Permission.MANAGE_ROLES,
          Permission.MANAGE_USERS,
          Permission.MANAGE_PERMISSIONS
        ];
        isAdminUser = adminPermissions.some(perm => userRole.permissions.includes(perm));
      }
    }
    
    // Fallback to role_type if role is not set
    if (!isAdminUser && profile.role_type === 'admin user') {
      isAdminUser = true;
    }

    // Check if user is admin
    if (isAdminUser) {
      (req as any).profile = profile;
      next();
      return;
    }

    // Check if user is accessing their own resource
    const resourceId = req.params.id;
    const resourceEmail = req.params.email;

    if (resourceId && resourceId === profile._id.toString()) {
      (req as any).profile = profile;
      next();
      return;
    }

    if (resourceEmail && resourceEmail === profile.email) {
      (req as any).profile = profile;
      next();
      return;
    }

    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You can only access your own resources' 
    });
  } catch (error: any) {
    console.error('Owner/Admin check error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};
