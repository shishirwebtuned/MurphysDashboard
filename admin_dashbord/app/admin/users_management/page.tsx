"use client"
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { getadminProfile } from '@/lib/redux/slices/profileSlice'
import { updateUserRoleType, updateUserStatus } from '@/lib/redux/slices/permissionSlice'
import { fetchRoles, assignRoleToUser, fetchAvailablePermissions } from '@/lib/redux/slices/roleSlice'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import Header from '@/app/page/common/header'
import Pagination from '@/app/page/common/Pagination'
import SpinnerComponent from '@/app/page/common/Spinner'
import PermissionSwitch from '@/app/page/PermissionSwitch'
import { Shield, Settings, Users } from 'lucide-react'
import { toast } from 'sonner'

function UserManagementPage() {
  const dispatch = useAppDispatch()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleTypeFilter, setRoleTypeFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [showRoleAssignDialog, setShowRoleAssignDialog] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState('')

  const { profile, loading, error, page, totalPages } = useAppSelector((state: any) => state.profile)
  const { roles } = useAppSelector((state: any) => state.role)
  const { availablePermissions } = useAppSelector((state: any) => state.role)

  const profiles = Array.isArray(profile) ? profile : profile ? [profile] : []

  useEffect(() => {
    dispatch(getadminProfile({ page: 1, limit: 10, search: '', role_type: roleTypeFilter } as any))
    dispatch(fetchRoles({ isActive: true }))
    dispatch(fetchAvailablePermissions())
  }, [dispatch])

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(getadminProfile({
        page: 1,
        limit: 10,
        search: searchTerm,
        role_type: roleTypeFilter
      } as any))
    }, 500)
    return () => clearTimeout(handle)
  }, [searchTerm, roleTypeFilter, dispatch])

  const handlePageChange = (p: number) => {
    dispatch(getadminProfile({
      page: p,
      limit: 10,
      search: searchTerm,
      role_type: roleTypeFilter
    } as any))
  }

  const handleRoleTypeChange = async (userId: string, newRoleType: string) => {
    if (!confirm(`Change user role type to ${newRoleType}?`)) return

    try {
      await dispatch(updateUserRoleType({ userId, role_type: newRoleType })).unwrap()
      toast.success('Role type updated successfully')
      dispatch(getadminProfile({ page, limit: 10, search: searchTerm, role_type: roleTypeFilter } as any))
    } catch (error: any) {
      toast.error(error || 'Failed to update role type')
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!confirm(`Change user status to ${newStatus}?`)) return

    try {
      await dispatch(updateUserStatus({ userId, status: newStatus })).unwrap()
      toast.success('Status updated successfully')
      dispatch(getadminProfile({ page, limit: 10, search: searchTerm, role_type: roleTypeFilter } as any))
    } catch (error: any) {
      toast.error(error || 'Failed to update status')
    }
  }

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return

    try {
      await dispatch(assignRoleToUser({ userId: selectedUser._id, roleId: selectedRoleId })).unwrap()
      toast.success('Role assigned successfully')
      setShowRoleAssignDialog(false)
      setSelectedUser(null)
      setSelectedRoleId('')
      dispatch(getadminProfile({ page, limit: 10, search: searchTerm, role_type: roleTypeFilter } as any))
    } catch (error: any) {
      toast.error(error || 'Failed to assign role')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div>
      <Header
        title="User Management"
        description="Manage user roles, permissions, and access control"
        icon={<Users className="h-5 w-5" />}
        total={profiles.length}
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search users..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={roleTypeFilter} onValueChange={setRoleTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by role type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Users</SelectItem>
            <SelectItem value="admin user">Admin Users</SelectItem>
            <SelectItem value="client user">Client Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <SpinnerComponent />
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableCaption>List of system users</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role Type</TableHead>
                  <TableHead>Custom Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles && profiles.length > 0 ? (
                  profiles.map((user: any, index: number) => (
                    <TableRow key={user._id || user.id}>
                      <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                      <TableCell>
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role_type || 'client user'}
                          onValueChange={(value) => handleRoleTypeChange(user._id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin user">Admin User</SelectItem>
                            <SelectItem value="client user">Client User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            {roles.find((r: any) => r._id === user.role)?.name || 'Custom'}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowRoleAssignDialog(true)
                            }}
                          >
                            Assign Role
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.status || 'active'}
                          onValueChange={(value) => handleStatusChange(user._id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowPermissionsDialog(true)
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page || 1}
            totalPages={totalPages || 1}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Custom Permissions</DialogTitle>
            <DialogDescription>
              Grant or revoke individual permissions for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedUser && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePermissions.map((perm: any) => (
                      <PermissionSwitch
                        key={perm.key}
                        userId={selectedUser._id}
                        permission={perm.key}
                        initialState={selectedUser.permissions?.includes(perm.key) || false}
                        label={perm.label}
                        onToggle={(newState: boolean) => {
                          // Optimistically update selectedUser.permissions so UI reflects change immediately
                          setSelectedUser((prev: any) => {
                            if (!prev) return prev
                            const has = prev.permissions?.includes(perm.key)
                            let newPermissions = prev.permissions || []
                            if (newState && !has) {
                              newPermissions = [...newPermissions, perm.key]
                            } else if (!newState && has) {
                              newPermissions = newPermissions.filter((p: string) => p !== perm.key)
                            }
                            return { ...prev, permissions: newPermissions }
                          })
                          // Also refresh list to keep server in sync
                          dispatch(getadminProfile({ page, limit: 10, search: searchTerm, role_type: roleTypeFilter } as any))
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog open={showRoleAssignDialog} onOpenChange={setShowRoleAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Custom Role</DialogTitle>
            <DialogDescription>
              Assign a custom role to {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name} ({role.permissions.length} permissions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRoleId}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagementPage
