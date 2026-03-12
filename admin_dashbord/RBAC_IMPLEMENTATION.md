# RBAC (Role-Based Access Control) Admin Dashboard

## Overview

This implementation provides a comprehensive RBAC system with the following features:

- **Role Management**: Create, edit, and delete custom roles with specific permissions
- **Permission Management**: Toggle individual permissions for users
- **User Management**: Manage user role types, custom role assignments, and status
- **Real-time Updates**: All changes are reflected immediately with Redux state management

## Features Implemented

### 1. Redux Slices

#### Role Slice (`lib/redux/slices/roleSlice.ts`)
- Fetch all roles with pagination and search
- Create new custom roles
- Update role details and permissions
- Delete roles
- Toggle role permissions
- Assign roles to users
- Fetch available permissions

#### Permission Slice (`lib/redux/slices/permissionSlice.ts`)
- Toggle user permissions (grant/revoke)
- Update user role type (admin user / client user)
- Update user status (active/inactive/suspended)
- Get user permissions

### 2. Admin Pages

#### Role Management (`app/admin/roles/page.tsx`)
- **Features**:
  - View all custom roles in a card grid
  - Create new roles with permission selection
  - Edit existing roles
  - Delete roles (with user assignment check)
  - Real-time search and filtering
  - Grouped permissions by category

- **Usage**:
  - Navigate to `/admin/roles`
  - Click "Create Role" to add a new custom role
  - Select permissions from categorized list
  - Edit/delete roles from the card actions

#### User Management (`app/admin/users_management/page.tsx`)
- **Features**:
  - View all users with pagination
  - Filter by role type (admin/client)
  - Search users by name/email
  - Change user role type (admin ↔ client)
  - Assign custom roles to users
  - Toggle individual user permissions
  - Update user status (active/inactive/suspended)
  
- **Usage**:
  - Navigate to `/admin/users_management`
  - Use filters to find specific users
  - Click user row actions to:
    - Change role type via dropdown
    - Assign custom role via "Assign Role" button
    - Manage permissions via settings icon
    - Update status via dropdown

#### Admin Users Page (`app/admin/admin_users/page.tsx`)
- Lists users with role_type = "admin user"
- Debounced search (500ms)
- Pagination support
- Profile images display

### 3. Components

#### PermissionSwitch (`app/page/PermissionSwitch.tsx`)
- Reusable permission toggle component
- Uses shadcn Switch component
- Toast notifications on success/error
- Loading state during toggle

#### Header (`app/page/common/header.tsx`)
- Consistent page headers
- Action buttons
- Search inputs
- Total counts

#### Pagination (`app/page/common/Pagination.tsx`)
- Page navigation
- Smart page range display
- Disabled states

## API Integration

All components are configured to work with the RBAC API endpoints:

### Role Endpoints
```
GET    /roles                       - Fetch all roles
GET    /roles/:id                   - Get role by ID
POST   /roles                       - Create role
PUT    /roles/:id                   - Update role
DELETE /roles/:id                   - Delete role
POST   /roles/permissions/toggle    - Toggle role permission
POST   /roles/assign                - Assign role to user
GET    /roles/:roleId/users         - Get users by role
GET    /permissions/available       - Get available permissions
```

### Permission Endpoints
```
POST   /permissions/toggle          - Toggle user permission
POST   /permissions/role            - Update user role type
POST   /permissions/status          - Update user status
GET    /permissions/:userId         - Get user permissions
```

### Profile Endpoints
```
GET    /profiles                    - Get all profiles
                                     Query params: role_type, page, limit, search
```

## Usage Guide

### 1. Create a Custom Role

```typescript
// Navigate to /admin/roles
// Click "Create Role" button
// Fill in:
{
  name: "Project Manager",
  description: "Manages projects and services",
  permissions: [
    "create_service",
    "update_service",
    "assign_service",
    "view_payments"
  ]
}
```

### 2. Assign Role to User

```typescript
// Navigate to /admin/users_management
// Find the user
// Click "Assign Role" button
// Select the custom role from dropdown
// Click "Assign Role"
```

### 3. Toggle Individual Permission

```typescript
// Navigate to /admin/users_management
// Click the settings icon for a user
// Toggle permissions using switches
// Changes are saved immediately
```

### 4. Change User Role Type

```typescript
// Navigate to /admin/users_management
// Use the "Role Type" dropdown for any user
// Select "admin user" or "client user"
// Confirm the change
```

### 5. Update User Status

```typescript
// Navigate to /admin/users_management
// Use the "Status" dropdown for any user
// Select: active, inactive, or suspended
// Confirm the change
```

## Permission Categories

The system groups permissions into categories:

- **Profile**: create_profile, read_profile, update_profile, delete_profile
- **User Management**: manage_users, manage_roles, manage_permissions
- **Service**: create_service, update_service, delete_service, assign_service
- **Payment**: view_payments, manage_payments
- **Invitation**: send_invitation, manage_invitations

## State Management

### Redux Store Structure
```typescript
{
  profile: {
    profile: ProfileData | ProfileData[],
    loading: boolean,
    error: string | null,
    page: number,
    totalPages: number
  },
  role: {
    roles: RoleData[],
    currentRole: RoleData | null,
    availablePermissions: Permission[],
    loading: boolean,
    error: string | null,
    page: number,
    totalPages: number
  },
  permission: {
    loading: boolean,
    error: string | null
  }
}
```

## Best Practices

### 1. Permission Checking
Always check user permissions before displaying UI elements:
```typescript
const hasPermission = (permission: string) => {
  const user = useAppSelector((state) => state.profile.profile)
  return user?.permissions?.includes(permission)
}
```

### 2. Error Handling
All async actions use toast notifications:
```typescript
try {
  await dispatch(createRole(roleData)).unwrap()
  toast.success('Role created successfully')
} catch (error: any) {
  toast.error(error || 'Failed to create role')
}
```

### 3. Debounced Search
Search inputs use 500ms debounce to reduce API calls:
```typescript
useEffect(() => {
  const handle = setTimeout(() => {
    dispatch(fetchRoles({ search: searchTerm }))
  }, 500)
  return () => clearTimeout(handle)
}, [searchTerm])
```

## Testing the Implementation

### 1. Role Management
- ✅ Create a role with multiple permissions
- ✅ Edit role name and permissions
- ✅ Delete role (ensure error if users assigned)
- ✅ Search for roles
- ✅ View role permissions

### 2. User Management
- ✅ Filter users by role type
- ✅ Search users by name/email
- ✅ Change user from client to admin
- ✅ Assign custom role to user
- ✅ Toggle individual permissions
- ✅ Suspend/activate users

### 3. Pagination
- ✅ Navigate between pages
- ✅ Maintain search/filters across pages
- ✅ Correct page counts

## Troubleshooting

### Backend Returns 403 Forbidden
- Ensure Firebase token is valid
- Check user has required permissions
- Verify role_type is correct

### Permissions Not Updating
- Reload user list after permission changes
- Check network tab for API response
- Verify dispatch unwrap() is used

### Role Assignment Fails
- Ensure role exists and is active
- Check user ID is valid
- Verify API endpoint is correct

## Next Steps

1. Add permission-based route guards
2. Implement audit log for permission changes
3. Add bulk user operations
4. Create permission presets/templates
5. Add role inheritance/hierarchy

## Routes

- `/admin/roles` - Role management page
- `/admin/users_management` - Comprehensive user management
- `/admin/admin_users` - Admin users list (filtered by role_type)

All routes require authentication via Firebase.

## Dependencies

- `@radix-ui/react-checkbox` - Checkbox component
- `@radix-ui/react-dialog` - Dialog/modal component
- `@radix-ui/react-select` - Select dropdown
- `@radix-ui/react-switch` - Toggle switch
- `sonner` - Toast notifications
- `@reduxjs/toolkit` - State management

## Support

For issues or questions, check:
1. Browser console for errors
2. Network tab for API responses
3. Redux DevTools for state changes
4. Error toasts for user-friendly messages
