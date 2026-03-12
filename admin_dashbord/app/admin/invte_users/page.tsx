'use client'
import React, { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Label } from '@radix-ui/react-label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MoreVertical, Files, Send } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Header from '@/app/page/common/header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getMee } from '@/lib/redux/slices/meeSlice'
import { getinvite, createInvite, updateInvite, resendInvite, deleteInvite } from '@/lib/redux/slices/inviteSlicer'
import { useAppDispatch } from '@/lib/redux/hooks'
import { useAppSelector } from '@/lib/redux/hooks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import DeleteModel from '@/app/page/common/DeleteModel'
import SpinnerComponent from '@/app/page/common/Spinner'
import Pagination from '@/app/page/common/Pagination'


function Page() {
  const [modalOpen, setModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const mee = useAppSelector((state: any) => state.mee.data);
  const { loading, items, pagination } = useAppSelector((s: any) => s.invite);
  const data = items || [];
  const [page, setPage] = useState<number>(pagination?.page || 1);
  // default to 10 items per page when pagination not yet available
  const [limit, setLimit] = useState<number>(pagination?.limit || 1);
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!mee) {

      dispatch(getMee());
    }
  }, [dispatch, mee]);

  React.useEffect(() => {
    if (!data || data.length === 0 || page !== pagination?.page || limit !== pagination?.limit)
      dispatch(getinvite({ page, limit }));
  }, [dispatch, page, limit]);

  // Sync local page/limit state when server pagination updates
  React.useEffect(() => {
    if (!pagination) return;
    if (typeof pagination.page === 'number' && pagination.page !== page) {
      setPage(pagination.page);
    }
    if (typeof pagination.limit === 'number' && pagination.limit !== limit) {
      setLimit(pagination.limit);
    }
    // only run when pagination changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination]);

  interface InviteUserFormValues {
    email: string;
    firstName?: string;
    lastName?: string;
    invite_email?: string;
    role_type?: string;
  }

  const initialValues: InviteUserFormValues = {
    email: selectedInvite?.email || '',
    firstName: selectedInvite?.firstName || '',
    lastName: selectedInvite?.lastName || '',
    invite_email: mee?.email,
    role_type: selectedInvite?.role_type || '',
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    role_type: Yup.string().required('Role type is required'),
  });

  const handelSubmit = async (values: InviteUserFormValues, { setSubmitting, resetForm }: any) => {
    try {
      // Always set invite_email to authenticated user's email
      const payload = { ...values, invite_email: mee?.email };
      if (selectedInvite && (selectedInvite._id || selectedInvite.id)) {
        const id = selectedInvite._id || selectedInvite.id;
        await dispatch(updateInvite({ id, formData: payload }));
      } else {
        await dispatch(createInvite(payload));
      }
      setSubmitting(false);
      resetForm();
      setModalOpen(false);
      setSelectedInvite(null);

    } catch (error) {
      setSubmitting(false);
      // Optionally handle error here
    }
  }

  const statusConfig: Record<'pending' | 'accepted' | 'rejected', "outline" | "default" | "secondary" | "destructive"> = {
    pending: "outline",
    accepted: "secondary",
    rejected: "destructive",
  };

  const getStatus = (inviteUser: any) => {
    const raw = (inviteUser.inviteStatus || inviteUser.status || inviteUser.invite_status || 'pending')?.toString();
    const key = raw?.toLowerCase();
    const variant = (statusConfig as any)[key] || 'outline';
    const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Pending';
    return { variant, label };
  }
  const handleDelate = () => {
    setDeleteId(null);
    dispatch(deleteInvite(deleteId as string));
  }



  return (
    <>
      {loading && <SpinnerComponent />}
      <Header
        title={selectedInvite ? "Sent Invite Again" : "Invite Users"}
        description="Send invitations to new users by entering their email addresses below."
        buttonText="Invite New User"
        onButtonClick={() => setModalOpen(true)}
        total={pagination.total}

      />
      {/* Debug: show pagination state */}
      <div className=" text-sm text-muted-foreground">

      </div>
      <div>
        <div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedInvite ? "Update Invite " : "Invite User"}</DialogTitle>
                <DialogDescription>
                  Enter the email and role to send an invitation.
                </DialogDescription>
              </DialogHeader>
              <Formik
                initialValues={initialValues}
                enableReinitialize={true}
                validationSchema={validationSchema}
                onSubmit={handelSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting,
                }) => (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="block mb-1">Email Address</Label>
                      <Input
                        type="email"
                        name="email"
                        id="email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email}
                        className="w-full"
                      />
                      {errors.email && touched.email && (
                        <div className="text-red-600 text-sm mt-1">{errors.email}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="firstName" className="block mb-1">First Name</Label>
                      <Input
                        type="text"
                        name="firstName"
                        id="firstName"
                        placeholder=' John '
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.firstName}
                        className="w-full" />

                      {errors.firstName && touched.firstName && (
                        <div className="text-red-600 text-sm mt-1">{errors.firstName}</div>
                      )}

                    </div>
                    <div>
                      <Label htmlFor="lastName" className="block mb-1">Last Name</Label>
                      <Input
                        type="text"
                        name="lastName"
                        id="lastName"
                        placeholder=' Doe '
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.lastName}
                        className="w-full" />
                      {errors.lastName && touched.lastName && (
                        <div className="text-red-600 text-sm mt-1">{errors.lastName}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="role_type" className="block mb-1">
                        Role Type
                      </Label>

                      <Select
                        name="role_type"
                        value={values.role_type}
                        onValueChange={(value) => {
                          handleChange({
                            target: { name: "role_type", value },
                          } as React.ChangeEvent<any>);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="admin user">Admin User</SelectItem>
                          <SelectItem value="client user">Client User</SelectItem>
                        </SelectContent>
                      </Select>

                      {errors.role_type && touched.role_type && (
                        <div className="text-red-600 text-sm mt-1">
                          {errors.role_type}
                        </div>
                      )}
                    </div>


                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (selectedInvite ? 'Updating...' : 'Inviting...') : (selectedInvite ? 'Update Invite' : 'Send Invitation')}
                    </Button>
                  </form>
                )}
              </Formik>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead> Invite By </TableHead>
                <TableHead> Users Name  </TableHead>
                <TableHead> Invite Status  </TableHead>
                <TableHead> Invite Date </TableHead>
                <TableHead> Actions </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>Loading invites...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>No invites found</TableCell>
                </TableRow>
              ) : (
                data.map((inviteUser: any, idx: number) => (
                  <TableRow key={inviteUser.id || inviteUser._id || inviteUser.email || idx}>
                    <TableCell className=' flex  gap-3'>
                      {inviteUser.email || '-'}
                      <div className=' flex gap-4'>
                        <Tooltip>
                          <TooltipTrigger>


                            <Files
                              className="inline-block h-4 w-4 ml-2 cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(inviteUser.email || '');
                                toast({
                                  title: "Copied to clipboard",
                                  description: `${inviteUser.email || ''} has been copied to clipboard.`,
                                  duration: 2000,
                                });
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to copy email</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            {((inviteUser.inviteStatus || inviteUser.status || inviteUser.invite_status) || 'pending').toString().toLowerCase() === 'pending' && (



                              <Send
                                className="inline-block h-4 w-4 ml-2 cursor-pointer text-blue-600"
                                onClick={async () => {
                                  try {
                                    await dispatch(resendInvite({ id: inviteUser._id || inviteUser.id }));
                                    toast({ title: 'Invite resent', description: `${inviteUser.email || ''} invitation resent.`, duration: 3000 });
                                    // dispatch(getinvite());
                                  } catch (err: any) {
                                    toast({ title: 'Resend failed', description: err?.message || 'Failed to resend invite', duration: 3000 });
                                  }
                                }}
                              />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Resend Invite</p>
                          </TooltipContent>
                        </Tooltip>

                      </div>
                    </TableCell>
                    <TableCell>{inviteUser.invite_email || '-'}</TableCell>
                    <TableCell>{(inviteUser.firstName || '') + ' ' + (inviteUser.lastName || '')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatus(inviteUser).variant}>
                        {getStatus(inviteUser).label}
                      </Badge>
                    </TableCell>

                    <TableCell>{inviteUser.createdAt ? new Date(inviteUser.createdAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>

                          <MoreVertical className="h-4 w-4 rotate-90 cursor-pointer" />

                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">

                          <DropdownMenuItem onClick={() => { setSelectedInvite(inviteUser); setModalOpen(true); }}> Update  </DropdownMenuItem>
                          {((inviteUser.inviteStatus || inviteUser.status || inviteUser.invite_status) || 'pending').toString().toLowerCase() === 'pending' && (
                            <DropdownMenuItem onClick={() => { dispatch(resendInvite({ id: inviteUser._id || inviteUser.id })); }}>Resend Invite</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { setDeleteId(inviteUser._id) }}> Delete  </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {pagination && (
        <Pagination page={pagination.page || page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
      )}
      < DeleteModel
        deleteId={deleteId}
        onsuccess={handleDelate}
      />
    </>


  )
}

export default Page