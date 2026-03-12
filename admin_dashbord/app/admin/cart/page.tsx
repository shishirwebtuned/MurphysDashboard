'use client'
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ChevronLeft, ChevronRight, ShoppingCart, Trash2, MoreVertical } from "lucide-react"
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import DateRangePicker from '@/components/ui/date-range-picker'
import { assignServiceToClient as assignServiceAction } from '@/lib/redux/slices/serviceSlice'
import Header from '@/app/page/common/header'
import { getAllCarts, assignServiceToClient, updateCartStatus, removeFromCart, deleteCart } from "@/lib/redux/slices/cartSlicer"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import SpinnerComponent from "@/app/page/common/Spinner"

function Page() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { toast } = useToast();
    const { carts, loading, error, page, limit, totalPages, totalCarts } = useAppSelector((state) => state.cart);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteServiceData, setDeleteServiceData] = useState<{ userid: string; serviceId: string; serviceName: string } | null>(null);
    const [deleteCartDialogOpen, setDeleteCartDialogOpen] = useState(false);
    const [deleteCartData, setDeleteCartData] = useState<{ userid: string; userName: string } | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignFormData, setAssignFormData] = useState<any>({
        userId: '',
        serviceId: '',
        serviceItemId: '',
        serviceName: '',
        userName: '',
        status: 'active',
        cycle: 'monthly',
        startDate: '',
        endDate: null,
        price: undefined,
        autoInvoice: false,
        notes: ''
    });

    useEffect(() => {
        dispatch(getAllCarts({ page: currentPage, limit }));
    }, [dispatch, currentPage, limit]);

    const handleAcceptService = (userId: string, serviceId: string, serviceItemId: string, serviceName: string, userName: string, servicePrice?: number) => {
        setAssignFormData({
            userId,
            serviceId,
            serviceItemId,
            serviceName,
            userName,
            status: 'active',
            cycle: 'monthly',
            startDate: new Date().toISOString().split('T')[0],
            endDate: null,
            price: servicePrice || undefined,
            autoInvoice: false,
            notes: ''
        });
        setAssignModalOpen(true);
    };

    const handleDeleteService = (userid: string, serviceId: string, serviceName: string) => {
        setDeleteServiceData({ userid, serviceId, serviceName });
        setDeleteDialogOpen(true);
    };

    const confirmDeleteService = async () => {
        if (!deleteServiceData) return;

        try {
            await dispatch(removeFromCart({
                userid: deleteServiceData.userid,
                serviceId: deleteServiceData.serviceId
            })).unwrap();

            toast({
                title: 'Success',
                description: `${deleteServiceData.serviceName} removed from cart`,
            });

            setDeleteDialogOpen(false);
            setDeleteServiceData(null);
            dispatch(getAllCarts({ page: currentPage, limit }));
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err || 'Failed to delete service',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteCart = (userid: string, userName: string) => {
        setDeleteCartData({ userid, userName });
        setDeleteCartDialogOpen(true);
    };

    const confirmDeleteCart = async () => {
        if (!deleteCartData) return;

        try {
            await dispatch(deleteCart(deleteCartData.userid)).unwrap();

            toast({
                title: 'Success',
                description: `Cart for ${deleteCartData.userName} deleted successfully`,
            });

            setDeleteCartDialogOpen(false);
            setDeleteCartData(null);
            dispatch(getAllCarts({ page: currentPage, limit }));
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err || 'Failed to delete cart',
                variant: 'destructive',
            });
        }
    };

    const handleAssignSubmit = async () => {
        if (!assignFormData.price) {
            toast({
                title: 'Error',
                description: 'Price is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            const payload = {
                id: typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`,
                client_id: assignFormData.userId,
                service_catalog_id: assignFormData.serviceId,
                status: assignFormData.status,
                cycle: assignFormData.cycle,
                start_date: assignFormData.startDate,
                end_date: assignFormData.endDate,
                price: assignFormData.price,
                auto_invoice: assignFormData.autoInvoice,
                notes: assignFormData.notes,
                assign_by: 'admin',
            };

            await dispatch(assignServiceAction(payload)).unwrap();
            
            // Update cart service status to done
            await dispatch(updateCartStatus({
                serviceItemId: assignFormData.serviceItemId,
                status: 'done'
            })).unwrap();
            
            toast({
                title: 'Success',
                description: `${assignFormData.serviceName} assigned to ${assignFormData.userName} successfully!`,
            });
            
            setAssignModalOpen(false);
            dispatch(getAllCarts({ page: currentPage, limit }));
            router.push('/admin/view_assign_service');
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err || 'Failed to assign service',
                variant: 'destructive',
            });
        }
    };

    const computeCartTotal = (services: any[]) => {
        let sum = 0;
        services.forEach(item => {
            const svc = item.serviceId;
            if (!svc || typeof svc.price !== 'number') return;
            let price = Number(svc.price) || 0;
            if (svc.hasDiscount && svc.discountValue) {
                if (svc.discountType === 'percentage') {
                    price = price - (price * (svc.discountValue || 0) / 100);
                } else {
                    price = price - (svc.discountValue || 0);
                }
            }
            if (price < 0) price = 0;
            sum += price;
        });
        return sum;
    };

    if (loading && carts.length === 0) {
      return (
        <div>
          <SpinnerComponent />
        </div>
      );
    }

  return (
    <div>
      <Header title="Cart Management" description="Manage user carts and their services" />
      <div className=" space-y-6">
        {carts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No carts found</h3>
              <p className="text-sm text-muted-foreground">No users have items in their cart yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableCaption>List of user carts ({totalCarts} total)</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>User Info</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map((cart: any) => (
                  <TableRow key={cart._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {cart.user?.firstName} {cart.user?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cart.user?.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {cart.user?.user_id?.slice(-8)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 max-w-md">
                        {cart.Services?.map((service: any) => (
                          <div key={service._id} className="flex items-center gap-3 p-2 border rounded-lg">
                            {process.env.NODE_ENV !== 'production' && console.debug && console.debug('cart service status', service._id, service.status)}
                            {service.serviceId?.image && (
                              <Image
                                src={service.serviceId.image}
                                alt={service.serviceId.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {service.serviceId?.name}
                              </div>
                              <Badge 
                                variant={service.status === 'done' ? 'default' : service.status === 'confirmed' ? 'secondary' : 'outline'}
                                className="text-xs mt-1"
                              >
                                {service.status}
                              </Badge>
                            </div>
                              <div className="flex gap-2">
                              {service.status === 'done' ? (
                                <Button size="sm" disabled className="bg-gray-400 text-white cursor-not-allowed">
                                  This service is already accepted
                                </Button>
                              ) : service.status === 'cancelled' ? (
                                <Button size="sm" disabled variant="outline">
                                  Cancelled
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptService(
                                    cart.user?.user_id,
                                    service.serviceId?._id,
                                    service._id,
                                    service.serviceId?.name,
                                    `${cart.user?.firstName} ${cart.user?.lastName}`,
                                    service.serviceId?.price
                                  )}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteService(
                                  cart.user?.user_id,
                                  service.serviceId?._id,
                                  service.serviceId?.name
                                )}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-lg">
                        ${computeCartTotal(cart.Services).toFixed(2)}   
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cart.Services?.length} item(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {cart.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button >
                            <MoreVertical className="h-4 w-4 rotate-90" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteCart(
                              cart.userid,
                              `${cart.user?.firstName} ${cart.user?.lastName}`
                            )}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Cart
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(cart.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing page {page} of {totalPages} ({totalCarts} total carts)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Service Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Service to Client</DialogTitle>
            <DialogDescription>
              Fill in the details to assign {assignFormData.serviceName} to {assignFormData.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Client</Label>
              <div className="p-2 bg-muted rounded mt-1">
                {assignFormData.userName}
              </div>
            </div>

            <div>
              <Label>Service</Label>
              <div className="p-2 bg-muted rounded mt-1">
                {assignFormData.serviceName}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={assignFormData.status} 
                  onValueChange={(v) => setAssignFormData({...assignFormData, status: v})}
                >
                  <SelectTrigger className="mt-1 w-full">
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
                <Label>Cycle</Label>
                <Select 
                  value={assignFormData.cycle} 
                  onValueChange={(v) => setAssignFormData({...assignFormData, cycle: v})}
                >
                  <SelectTrigger className="mt-1 w-full">
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
              <Label>Start / End Date</Label>
              <DateRangePicker
                value={{ 
                  from: assignFormData.startDate || null, 
                  to: assignFormData.endDate || null 
                }}
                onChange={(v) => setAssignFormData({
                  ...assignFormData, 
                  startDate: v.from || '', 
                  endDate: v.to || null
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (override)</Label>
                <Input 
                  type="number" 
                  className="mt-1"
                  value={assignFormData.price ?? ''} 
                  onChange={(e) => setAssignFormData({
                    ...assignFormData, 
                    price: e.target.value ? Number(e.target.value) : undefined
                  })} 
                />
              </div>
              <div className="flex flex-col">
                <Label>Auto Invoice</Label>
                <div className="mt-3">
                  <Switch 
                    checked={assignFormData.autoInvoice} 
                    onCheckedChange={(v) => setAssignFormData({
                      ...assignFormData, 
                      autoInvoice: Boolean(v)
                    })} 
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Notes (internal)</Label>
              <Textarea 
                className="mt-1"
                value={assignFormData.notes} 
                onChange={(e) => setAssignFormData({
                  ...assignFormData, 
                  notes: e.target.value
                })} 
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignSubmit}>
                Assign Service
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteServiceData?.serviceName} from the cart. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Cart Confirmation Dialog */}
      <AlertDialog open={deleteCartDialogOpen} onOpenChange={setDeleteCartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entire Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the entire cart for {deleteCartData?.userName}. All services in this cart will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCart}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  )
}

export default Page