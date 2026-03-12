"use client"
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchRoles, createRole, updateRole, deleteRole, toggleRolePermission, fetchAvailablePermissions } from '@/lib/redux/slices/roleSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit, Shield } from 'lucide-react'
import Header from '@/app/page/common/header'
import SpinnerComponent from '@/app/page/common/Spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

function RolesPage() {
  const dispatch = useAppDispatch()
  const { roles, availablePermissions, loading, error } = useAppSelector((state: any) => state.role)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  })

  useEffect(() => {
    dispatch(fetchRoles({}))
    dispatch(fetchAvailablePermissions())
  }, [dispatch])

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchRoles({ search: searchTerm }))
    }, 500)
    return () => clearTimeout(handle)
  }, [searchTerm, dispatch])

  const handleCreateRole = async () => {
    if (!formData.name || formData.permissions.length === 0) {
      toast.error('Please provide role name and at least one permission')
      return
    }

    try {
      await dispatch(createRole(formData)).unwrap()
      toast.success('Role created successfully')
      setShowCreateDialog(false)
      setFormData({ name: '', description: '', permissions: [] })
      dispatch(fetchRoles({}))
    } catch (err: any) {
      toast.error(err || 'Failed to create role')
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      await dispatch(updateRole({ roleId: selectedRole._id, roleData: formData })).unwrap()
      toast.success('Role updated successfully')
      setShowEditDialog(false)
      setSelectedRole(null)
      setFormData({ name: '', description: '', permissions: [] })
      dispatch(fetchRoles({}))
    } catch (err: any) {
      toast.error(err || 'Failed to update role')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      await dispatch(deleteRole(roleId)).unwrap()
      toast.success('Role deleted successfully')
      dispatch(fetchRoles({}))
    } catch (err: any) {
      toast.error(err || 'Failed to delete role. Users may be assigned to this role.')
    }
  }

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const handleToggleRolePermission = async (roleId: string, permission: string) => {
    try {
      await dispatch(toggleRolePermission({ roleId, permission })).unwrap()
      toast.success('Permission updated')
      dispatch(fetchRoles({}))
    } catch (err: any) {
      toast.error(err || 'Failed to toggle permission')
    }
  }

  const openEditDialog = (role: any) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    })
    setShowEditDialog(true)
  }

  const filteredRoles = roles.filter((role: any) =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group permissions by category
  const permissionsByCategory = availablePermissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {})

  return (
    <div>
      <Header
        title="Role Management"
        description="Create and manage custom roles with specific permissions"
        buttonText="Create Role"
        icon={<Plus className="h-4 w-4" />}
        onButtonClick={() => {
          setFormData({ name: '', description: '', permissions: [] })
          setShowCreateDialog(true)
        }}
        extra={
          <Input
            placeholder="Search roles..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        }
      />

      {loading && roles.length === 0 ? (
        <SpinnerComponent />
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredRoles.map((role: any) => (
            <Card key={role._id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                  <Badge variant={role.isActive ? "default" : "secondary"}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="mt-2">{role.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Permissions ({role.permissions?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.slice(0, 5).map((perm: string) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {role.permissions?.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(role)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRole(role._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a custom role with specific permissions for your users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Project Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this role"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions * (Select at least one)</Label>
              <div className="border rounded-md p-4 space-y-4 max-h-96 overflow-y-auto">
                {Object.keys(permissionsByCategory).map(category => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                      {permissionsByCategory[category].map((perm: any) => (
                        <div key={perm.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`create-${perm.key}`}
                            checked={formData.permissions.includes(perm.key)}
                            onCheckedChange={() => handlePermissionToggle(perm.key)}
                          />
                          <label
                            htmlFor={`create-${perm.key}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {formData.permissions.length} permissions
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={loading}>
              {loading ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Project Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Brief description of this role"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions *</Label>
              <div className="border rounded-md p-4 space-y-4 max-h-96 overflow-y-auto">
                {Object.keys(permissionsByCategory).map(category => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                      {permissionsByCategory[category].map((perm: any) => (
                        <div key={perm.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${perm.key}`}
                            checked={formData.permissions.includes(perm.key)}
                            onCheckedChange={() => handlePermissionToggle(perm.key)}
                          />
                          <label
                            htmlFor={`edit-${perm.key}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {formData.permissions.length} permissions
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={loading}>
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RolesPage
