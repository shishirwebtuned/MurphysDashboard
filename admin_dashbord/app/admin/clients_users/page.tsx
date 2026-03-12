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
import { useRouter  } from 'next/navigation'
import { fetchServices, assignServiceToClient } from '@/lib/redux/slices/serviceSlice'
import { useToast } from '@/hooks/use-toast'
import DateRangePicker from '@/components/ui/date-range-picker'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import Link from "next/link"
import { useAuth } from '@/hooks/use-auth'
import OtpVerifyModal from '@/components/OtpVerifyModal'
import { getMee } from '@/lib/redux/slices/meeSlice'




function ClientsUsersPage() {
  const dispatch = useAppDispatch()
  const { user: currentUser } = useAuth()
  const meeData = useAppSelector((state: any) => state.mee?.data)
  const [otpVerified, setOtpVerified] = useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const { profile, loading, error, page, totalPages } = useAppSelector((state) => state.profile as any)
  const { services } = useAppSelector((state) => state.services)
  const router = useRouter();
  const { toast } = useToast();

  const profiles = Array.isArray(profile) ? profile : profile ? [profile] : []
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null)
  
  // Assign dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigningClient, setAssigningClient] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [assignStatus, setAssignStatus] = useState<'active' | 'paused' | 'cancelled'>('active')
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [assignStartDate, setAssignStartDate] = useState<string>('')
  const [assignRenewalDate, setAssignRenewalDate] = useState<string | null>(null)
  const [assignCycle, setAssignCycle] = useState<'monthly' | 'annual' | 'none'>('monthly')
  const [assignPrice, setAssignPrice] = useState<number | undefined>(undefined)
  const [assignAutoInvoice, setAssignAutoInvoice] = useState<boolean>(false)
  const [assignNotes, setAssignNotes] = useState<string>('')

  // initial load — only after OTP is verified
  useEffect(() => {
    if (!otpVerified) return
    dispatch(getadminProfile({ role_type: 'client user', page: 1, limit: 10, search: '' } as any))
    dispatch(fetchRoles({} as any))
    dispatch(fetchServices({ page: 1, limit: 1000 } as any)) // Fetch all services for dropdown
  }, [dispatch, otpVerified])

  // debounced search: when searchTerm changes, wait 500ms before dispatching
  useEffect(() => {
    if (!otpVerified) return
    const handle = setTimeout(() => {
      // reset to first page when searching
      dispatch(getadminProfile({ role_type: 'client user', page: 1, limit: 10, search: searchTerm } as any))
    }, 500)

    return () => clearTimeout(handle)
  }, [searchTerm, dispatch, otpVerified])

  const handlePageChange = (p: number) => {
    dispatch(getadminProfile({ role_type: 'client user', page: p, limit: 10, search: searchTerm } as any))
  }

  const openAssignDialog = (client: any) => {
    setAssigningClient(client)
    setAssignStartDate(new Date().toISOString().slice(0, 10))
    setAssignRenewalDate(null)
    setSelectedService(null)
    setAssignPrice(undefined)
    setAssignNotes('')
    setAssignCycle('monthly')
    setAssignAutoInvoice(false)
    setAssignStatus('active')
    setAssignDialogOpen(true)
  }

  const handleAssignSubmit = async () => {
    if (!assigningClient || !selectedService) {
      toast({ title: 'Error', description: 'Please select a service', variant: 'destructive' })
      return
    }
    setAssignSubmitting(true)
    const payload = {
      id: typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`,
      client_id: assigningClient._id || assigningClient.id,
      service_catalog_id: selectedService,
      status: assignStatus,
      start_date: assignStartDate,
      end_date: assignRenewalDate || null,
      cycle: assignCycle,
      price: assignPrice,
      auto_invoice: assignAutoInvoice,
      notes: assignNotes,
    } as any
    try {
      await dispatch(assignServiceToClient(payload)).unwrap()
      toast({ title: 'Success', description: 'Service assigned to client' })
      setAssignDialogOpen(false)
      setAssigningClient(null)
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to assign service', variant: 'destructive' })
      console.error('assign error', err)
    } finally {
      setAssignSubmitting(false)
    }
  }

  if (!otpVerified) {
    return <OtpVerifyModal email={meeData?.email || ''} onVerified={() => setOtpVerified(true)} />
  }

  return (
    <div>
      <Header
        title="Client Users"
        description="Manage client users of the application"
        extra={
          <Input
            placeholder="Search client users..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        }
      />

      {loading ? (
        <SpinnerComponent />
      ) : 
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>List of Client users</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role Type</TableHead>
                {/* <TableHead>Role</TableHead> */}
                <TableHead>Assign Service</TableHead>
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
                      <Link href={`/admin/assign_service/${admin._id || admin.id}`}>
                      <Button
                        variant="link"
                        size="sm"
                        className='cursor-pointer'
                      >
                        Assign Service  
                      </Button>
                      </Link>
                      
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
                          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                            <MoreVertical className="h-4 w-4 rotate-90" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUserDetails(admin); setShowDetailsDialog(true); }}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/assign_service/${admin._id || admin.id}`)}>Assign Service</DropdownMenuItem>
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

          {/* Assign Service Dialog */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Service to Client</DialogTitle>
                <DialogDescription>
                  Assign a service to {assigningClient?.firstName} {assigningClient?.lastName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label className="pb-2">Service</Label>
                  <Select value={selectedService || ''} onValueChange={(v) => {
                    setSelectedService(v || null)
                    const service = services.find((s: any) => (s._id || s.id) === v)
                    if (service) {
                      setAssignPrice(service.price)
                      setAssignCycle(service.billingType === 'monthly' ? 'monthly' : 'none')
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service: any) => (
                        <SelectItem key={service._id || service.id} value={service._id || service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="pb-2">Status</Label>
                    <Select value={assignStatus} onValueChange={(v) => setAssignStatus(v as any)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="pb-2">Cycle</Label>
                    <Select value={assignCycle} onValueChange={(v) => setAssignCycle(v as any)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="pb-2">Start / Complete date</Label>
                  <DateRangePicker
                    value={{ from: assignStartDate || null, to: assignRenewalDate || null }}
                    onChange={(v) => {
                      setAssignStartDate(v.from || '')
                      setAssignRenewalDate(v.to || null)
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="pb-2">Price (override)</Label>
                    <Input type="number" value={assignPrice ?? ''} onChange={(e) => setAssignPrice(e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                  <div className="flex flex-col">
                    <Label className="pb-2">Auto invoice</Label>
                    <div className="mt-2">
                      <Switch checked={assignAutoInvoice} onCheckedChange={(v) => setAssignAutoInvoice(Boolean(v))} />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="pb-2">Notes (internal)</Label>
                  <Textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assignSubmitting}>Cancel</Button>
                  <Button onClick={handleAssignSubmit} disabled={!selectedService || assignSubmitting}>
                    {assignSubmitting ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        }
    </div>
  )
}

export default ClientsUsersPage