"use client"
import React, { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getadminProfile } from '@/lib/redux/slices/profileSlice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchRoles } from '@/lib/redux/slices/roleSlice'
import { useAuth } from '@/hooks/use-auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Pagination from '@/app/page/common/Pagination'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Header from '@/app/page/common/header'
import SpinnerComponent from '@/app/page/common/Spinner'
import { Input } from '@/components/ui/input'
import axiosInstance from '@/lib/axios'
import DeleteModel from '@/app/page/common/DeleteModel'
import { deleteProfile } from '@/lib/redux/slices/profileSlice'
import OtpVerifyModal from '@/components/OtpVerifyModal'
import { getMee } from '@/lib/redux/slices/meeSlice'

function AdminUsersPage() {
  const dispatch = useAppDispatch()
  const [searchTerm, setSearchTerm] = React.useState('')
  const { profile, loading, error, page, totalPages } = useAppSelector((state) => state.profile as any)
  const { roles } = useAppSelector((state: any) => state.role)
  const { user: currentUser } = useAuth()
  const meeData = useAppSelector((state: any) => state.mee?.data)
  const [otpVerified, setOtpVerified] = useState(false)

  const profiles = Array.isArray(profile) ? profile : profile ? [profile] : []
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null)
  const [showDeleteModel, setShowDeleteModel] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // initial load — only after OTP is verified
  useEffect(() => {
    if (!otpVerified) return
    dispatch(getadminProfile({ role_type: 'admin user', page: 1, limit: 10, search: '' } as any))
    dispatch(fetchRoles({} as any))
  }, [dispatch, otpVerified])

  // debounced search: when searchTerm changes, wait 500ms before dispatching
  useEffect(() => {
    if (!otpVerified) return
    const handle = setTimeout(() => {
      // reset to first page when searching
      dispatch(getadminProfile({ role_type: 'admin user', page: 1, limit: 10, search: searchTerm } as any))
    }, 500)

    return () => clearTimeout(handle)
  }, [searchTerm, dispatch, otpVerified])

  const handlePageChange = (p: number) => {
    dispatch(getadminProfile({ role_type: 'admin user', page: p, limit: 10, search: searchTerm } as any))
  }

  if (!otpVerified) {
    return <OtpVerifyModal email={meeData?.email || currentUser?.email || ''} onVerified={() => setOtpVerified(true)} />
  }

  return (
    <div>
      <Header
        title="Admin Users"
        description="Manage admin users of the application"
        extra={
          <Input
            placeholder="Search admin users..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        }
      />

      {loading ? (
        <SpinnerComponent />
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>List of admin users</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Country</TableHead>
                <TableHead> Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles && profiles.length > 0 ? (
                profiles.map((admin: any , index: number) => (
                  <TableRow key={admin.id || admin._id}>
                  <TableCell>  { (page - 1)  * 10 + index + 1} </TableCell>
                    <TableCell>
                      {admin.profile_image  ?
                      <img
                        src={admin.profile_image || '/default-profile.png'}
                        alt={`${admin.firstName} ${admin.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      /> : '-'}
                    </TableCell>
                    
                    <TableCell>{admin.firstName} {admin.lastName}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{admin.role_type || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={admin.role || ''}
                        onValueChange={async (value) => {
                          try {
                            // get Firebase id token
                            const idToken = currentUser ? await currentUser.getIdToken(true) : ''
                            // convert placeholder 'none' to null for unassign
                            const roleIdToSend = value === 'none' ? null : value
                            // send assign request to backend
                            await axiosInstance.post('/roles/assign', { userId: admin._id || admin.id, roleId: roleIdToSend })
                            // refresh list
                            dispatch(getadminProfile({ role_type: 'admin user', page: page || 1, limit: 10, search: searchTerm } as any))
                          } catch (err: any) {
                            console.error('Assign role error', err)
                            alert(err?.response?.data?.message || 'Failed to assign role')
                          }
                        }}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder={roles.find((r: any) => r._id === admin.role)?.name || 'Select role'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {roles.map((r: any) => (
                            <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                       <TableCell>{admin.country || '-'}</TableCell>
                    <TableCell>{admin.phone || '-'}</TableCell>
                    <TableCell>{admin.status || '-'}</TableCell>
<TableCell>
  {admin.createdAt
    ? new Date(admin.createdAt).toISOString().split('T')[0]
    : '-'}
</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer ">
                            <MoreVertical className="h-4 w-4 rotate-90" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUserDetails(admin); setShowDetailsDialog(true); }}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setUserToDelete(admin); setShowDeleteModel(true); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No admin users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>Full profile information</DialogDescription>
              </DialogHeader>
              {selectedUserDetails && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={selectedUserDetails.profile_image || '/default-profile.png'} alt="profile" className="h-20 w-20 rounded-full object-cover" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{selectedUserDetails.firstName} {selectedUserDetails.lastName}</div>
                          <div className="text-sm text-muted-foreground">{selectedUserDetails.email}</div>
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant={selectedUserDetails.status === 'active' ? 'default' : 'secondary'}>{selectedUserDetails.status || 'unknown'}</Badge>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{selectedUserDetails.position || '—'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Phone</Label>
                          <div className="text-sm">{selectedUserDetails.phone || '-'}</div>
                        </div>
                        <div>
                          <Label>Role Type</Label>
                          <div className="text-sm">{selectedUserDetails.role_type || '-'}</div>
                        </div>
                       
                        <div>
                          <Label>Location</Label>
                          <div className="text-sm">{selectedUserDetails.city || '-'}, {selectedUserDetails.state || '-'}, {selectedUserDetails.country || '-'}</div>
                        </div>
                        <div>
                          <Label>Website</Label>
                          <div className="text-sm"><a href={selectedUserDetails.website} target="_blank" rel="noreferrer" className="text-primary">{selectedUserDetails.website}</a></div>
                        </div>
                        <div>
                          <Label>DOB</Label>
                          <div className="text-sm">{selectedUserDetails.dob ? new Date(selectedUserDetails.dob).toLocaleDateString() : '-'}</div>
                        </div>
                        <div>
                          <Label>DOJ</Label>
                          <div className="text-sm">{selectedUserDetails.doj ? new Date(selectedUserDetails.doj).toLocaleDateString() : '-'}</div>
                        </div>
                       
                      </div>

                      <div>
                        <Separator />
                        <div className="mt-4">
                          <Label>Bio</Label>
                          <div className="text-sm">{selectedUserDetails.bio || '-'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Created At</Label>
                          <div className="text-sm">{selectedUserDetails.createdAt ? new Date(selectedUserDetails.createdAt).toLocaleString() : '-'}</div>
                        </div>
                        <div>
                          <Label>Updated At</Label>
                          <div className="text-sm">{selectedUserDetails.updatedAt ? new Date(selectedUserDetails.updatedAt).toLocaleString() : '-'}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mt-4">
            <Pagination page={page || 1} totalPages={totalPages || 1} onPageChange={handlePageChange} />
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteModel
        isOpen={showDeleteModel}
        onClose={() => setShowDeleteModel(false)}
        title="Delete Admin User"
        description={`Are you sure you want to delete admin user "${userToDelete?.firstName} ${userToDelete?.lastName}"? This action cannot be undone.`}
        onConfirm={async () => {
          try {
            const idToDelete = userToDelete._id || userToDelete.id;
            await dispatch(deleteProfile(idToDelete)).unwrap()
            await axiosInstance.delete(`/users/${idToDelete}`)
            setShowDeleteModel(false)
          }
          catch (err: any) {
            console.error('Delete admin user error', err)
            alert(err?.response?.data?.message || 'Failed to delete admin user')
          }
        }}
      />
    </div>
  )
}

export default AdminUsersPage
