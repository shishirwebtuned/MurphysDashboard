'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { deleteService, toggleServiceStatus, setSelectedService, fetchServices, assignServiceToClient } from '@/lib/redux/slices/serviceSlice';
import { getadminProfile } from '@/lib/redux/slices/profileSlice';
import { Service } from '@/types/service';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Eye, ArrowUpDown, CheckCircle2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DateRangePicker from '@/components/ui/date-range-picker';
import SpinnerComponent from './common/Spinner';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ServiceTableProps {
  onEdit: (service: Service) => void;
  categoryFilter?: string;
}

const ITEMS_PER_PAGE = 10;

export default function ServiceTable({ onEdit, categoryFilter = 'all' }: ServiceTableProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { services, loading, page: storePage, limit: storeLimit, total, totalPages } = useAppSelector((state) => state.services);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(storePage || 1);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViewService, setSelectedViewService] = useState<Service | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningService, setAssigningService] = useState<Service | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [assignStatus, setAssignStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignStartDate, setAssignStartDate] = useState<string>('');
  const [assignRenewalDate, setAssignRenewalDate] = useState<string | null>(null);
  const [assignCycle, setAssignCycle] = useState<'monthly' | 'annual' | 'none' | 'one-time'>('monthly');
  const [assignPrice, setAssignPrice] = useState<number | undefined>(undefined);
  const [assignAutoInvoice, setAssignAutoInvoice] = useState<boolean>(false);
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [clickImage, setClickImage] = useState<string>('');
  const router = useRouter();
  const profileState = useAppSelector((s) => s.profile);
  const profiles = Array.isArray(profileState.profile) ? profileState.profile : profileState.profile ? [profileState.profile] : [];

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedServices = useMemo(() => {
    let items = [...services];
    if (sortConfig !== null) {
      items.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle specific fields
        if (sortConfig.key === 'price') {
          // numeric sort
          aValue = Number(a.price);
          bValue = Number(b.price);
        } else if (sortConfig.key === 'createdAt') {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [services, sortConfig]);

  // Fetch services when page or category changes (server-driven pagination)
  useEffect(() => {
    dispatch(fetchServices({ page: currentPage, limit: ITEMS_PER_PAGE, category: categoryFilter === 'all' ? undefined : categoryFilter } as any));
  }, [dispatch, currentPage, categoryFilter]);



  const formatBillingType = (type: string) => {
    const formats: Record<string, string> = {
      one_time: 'One Time',
      monthly: 'Monthly',
      yearly: 'Yearly',
      pay_as_you_go: 'Pay as you go',
    };
    return formats[type] || type;
  };

  const formatPrice = (price: number, billingType: string, currency?: string) => {
    const cur = currency || 'USD';
    const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(price);
    if (billingType === 'monthly') return `${formatted}/mo`;
    if (billingType === 'yearly') return `${formatted}/yr`;
    return formatted;
  };

  const handleToggleStatus = async (_id: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await dispatch(toggleServiceStatus({ _id, status: newStatus })).unwrap();
      toast({
        title: 'Success',
        description: `Service ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle service status',
        variant: 'destructive',
      });
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDeleteClick = (_id: string) => {
    setServiceToDelete(_id);
    setDeleteDialogOpen(true);
  };

  const openAssignDialog = (service: Service) => {
    // Always fetch client users when opening assign dialog to ensure we have latest client list
    dispatch(getadminProfile({ page: 1, limit: 1000, role_type: 'client user' } as any));

    setAssigningService(service);
    // prefill start date to today
    setAssignStartDate(new Date().toISOString().slice(0, 10));
    setAssignRenewalDate(null);
    setSelectedClient(null);
    setAssignPrice(service.price);
    setAssignNotes('');
    setAssignCycle(service.billingType === 'monthly' ? 'monthly' : 'none');
    setAssignAutoInvoice(false);
    setAssignStatus('active');
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!assigningService || !selectedClient) {
      toast({ title: 'Error', description: 'Please select a client', variant: 'destructive' });
      return;
    }
    setAssignSubmitting(true);
    const payload = {
      client_id: selectedClient,
      service_catalog_id: (assigningService as any)._id || (assigningService as any).id,
      status: assignStatus,
      start_date: assignCycle === 'one-time' ? null : assignStartDate,
      end_date: assignCycle === 'one-time' ? null : (assignRenewalDate || null),
      cycle: assignCycle,
      price: assignPrice,
      auto_invoice: assignAutoInvoice,
      notes: assignNotes,
    } as any;
    try {
      await dispatch(assignServiceToClient(payload)).unwrap();
      toast({ title: 'Success', description: 'Service assigned to client' });
      setAssignDialogOpen(false);
      setAssigningService(null);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to assign service', variant: 'destructive' });
      console.error('assign error', err);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (serviceToDelete) {
      try {
        await dispatch(deleteService(serviceToDelete)).unwrap();
        toast({
          title: 'Success',
          description: 'Service deleted successfully',
        });
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete service',
          variant: 'destructive',
        });
        console.error('Failed to delete service:', error);
      }
    }
  };

  if (loading && services.length === 0) {
    return (
      <>
        <SpinnerComponent />
      </>

    );
  }

  const handleViewClick = (service: Service) => {
    setSelectedViewService(service);
    setViewDialogOpen(true);
  };


  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center ">
        <h3 className="text-lg font-semibold mb-2">No services found</h3>
        <p className="text-sm text-muted-foreground">
          {categoryFilter === 'all' ? 'Create your first service to get started' : 'No services in this category'}
        </p>
      </div>
    );
  }
  // Pagination indices (server-driven)
  const effectiveTotalPages = totalPages || Math.ceil((total || 0) / (storeLimit || ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * (storeLimit || ITEMS_PER_PAGE);
  const endIndex = startIndex + (storeLimit || ITEMS_PER_PAGE);
  const paginatedServices = services;

  return (
    <>
      {
        clickImage && (
          <Dialog open={Boolean(clickImage)} onOpenChange={() => setClickImage('')}>
            <DialogContent className="overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Service Image</DialogTitle>
                <DialogDescription>Full size view of the service image</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center items-center ">
                <img src={clickImage} alt="Service Full Size" className="max-w-full object-contain" />
              </div>
            </DialogContent>
          </Dialog>
        )

      }
      <div className="">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors min-w-[150px]"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Service Name
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('categoryName')}
              >
                <div className="flex items-center gap-2">
                  Category
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-2">
                  Price
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('billingType')}
              >
                <div className="flex items-center gap-2">
                  Billing
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead>Assign</TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Date
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedServices.map((service, index) => (
              <TableRow key={(service as any)._id || (service as any).id}>
                <TableCell className="text-center font-mono text-muted-foreground text-xs">
                  {startIndex + index + 1}
                </TableCell>
                <TableCell
                  onClick={() => {
                    const imgSrc = (service as any).image || (service as any).imageUrl || '';
                    setClickImage(imgSrc);
                  }
                  }
                  className="cursor-pointer"
                >

                  {((service as any).image || (service as any).imageUrl) ? (
                    (() => {
                      const src = (service as any).image || (service as any).imageUrl || '';
                      return (
                        <div className="relative group w-10 h-10">
                          <Image
                            src={src}
                            alt={service.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover border border-border shadow-sm group-hover:shadow-md transition-shadow"
                          />
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent rounded-lg transition-colors" />
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground border border-dashed border-border">
                      No Img
                    </div>
                  )}
                </TableCell>

                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{service.name}</span>

                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate block text-sm text-muted-foreground">
                        {service.description}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {service.description}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none">
                    {service.categoryName || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {service.hasDiscount && service.discountValue ? (
                      <>
                        <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                          {formatPrice(service.price, service.billingType, service.currency)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-600">
                            {(() => {
                              const disc = service.discountType === 'percentage'
                                ? service.price - (service.price * (service.discountValue || 0) / 100)
                                : service.price - (service.discountValue || 0);
                              return formatPrice(disc, service.billingType, service.currency);
                            })()}
                          </span>
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] h-4 px-1 px-y-0 border-none">
                            Sale
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <span className="font-semibold">
                        {formatPrice(service.price, service.billingType, service.currency)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatBillingType(service.billingType)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={service.status === 'active'}
                      onCheckedChange={() => handleToggleStatus((service as any)._id || (service as any).id, service.status)}
                      disabled={loading}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize border-none",
                        service.status === 'active'
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {service.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    size="sm"
                    className='cursor-pointer'
                    onClick={() => openAssignDialog(service)}
                  >
                    Assign
                  </Button>
                </TableCell>
                <TableCell>
                  {new Date(service.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[9999]" sideOffset={5}>

                      <DropdownMenuItem
                        onClick={() => handleViewClick(service)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEdit(service)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick((service as any)._id || (service as any).id)}
                        className="cursor-pointer text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {effectiveTotalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, total || 0)} of {total || 0} services
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
              {Array.from({ length: effectiveTotalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, effectiveTotalPages))}
              disabled={currentPage === effectiveTotalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Service Details</DialogTitle>
            <DialogDescription>Full summary for {selectedViewService?.name}</DialogDescription>
          </DialogHeader>

          {selectedViewService && (
            <div className="space-y-6 py-4">
              <div className="flex gap-6 items-start">
                <div className="relative group shrink-0">
                  {((selectedViewService as any).image || (selectedViewService as any).imageUrl) ? (
                    <img
                      src={(selectedViewService as any).image || (selectedViewService as any).imageUrl}
                      alt=""
                      className="w-32 h-32 rounded-xl object-cover border-4 border-muted shadow-sm"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border-4 border-muted">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 uppercase tracking-wider text-[10px]">
                    {selectedViewService.categoryName}
                  </Badge>
                  <h3 className="text-2xl font-bold tracking-tight">{selectedViewService.name}</h3>
                  <div className="flex items-center gap-3">
                    {selectedViewService.hasDiscount && selectedViewService.discountValue ? (
                      <>
                        <span className="text-3xl font-extrabold text-emerald-600">
                          {(() => {
                            const disc = selectedViewService.discountType === 'percentage'
                              ? selectedViewService.price - (selectedViewService.price * (selectedViewService.discountValue || 0) / 100)
                              : selectedViewService.price - (selectedViewService.discountValue || 0);
                            return formatPrice(disc, selectedViewService.billingType, selectedViewService.currency);
                          })()}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-muted-foreground line-through decoration-destructive/40">
                            {formatPrice(selectedViewService.price, selectedViewService.billingType, selectedViewService.currency)}
                          </span>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[11px] h-5">
                            {selectedViewService.discountType === 'percentage'
                              ? `${selectedViewService.discountValue}% OFF`
                              : `Save ${formatPrice(selectedViewService.discountValue || 0, 'one_time', selectedViewService.currency)}`}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <span className="text-3xl font-extrabold">
                        {formatPrice(selectedViewService.price, selectedViewService.billingType, selectedViewService.currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Billing Cycle</label>
                  <p className="text-sm font-medium capitalize">{formatBillingType(selectedViewService.billingType)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Status</label>
                  <div>
                    <Badge className={cn(
                      "capitalize border-none",
                      selectedViewService.status === 'active' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-muted text-muted-foreground"
                    )}>
                      {selectedViewService.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Description</label>
                <div className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border/50">
                  {selectedViewService.description}
                </div>
              </div>

              {selectedViewService.features && selectedViewService.features.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Included Features</label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {selectedViewService.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedViewService.hasDiscount && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Info className="w-3 h-3" /> Promotion Details
                  </h4>
                  <div className="grid grid-cols-2 gap-y-3 text-xs">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Promo Period</span>
                      <span className="font-semibold text-amber-900">
                        {selectedViewService.discountStartDate ? format(new Date(selectedViewService.discountStartDate), 'MMM dd, yyyy') : 'No start'}
                        {' → '}
                        {selectedViewService.discountEndDate ? format(new Date(selectedViewService.discountEndDate), 'MMM dd, yyyy') : 'No end'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Reason</span>
                      <span className="font-semibold text-amber-900">{selectedViewService.discountReason || 'Seasonal Offer'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign to client dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Service to Client</DialogTitle>
            <DialogDescription>Fill details for assigning this service to a client</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className=' pb-2'>Client</Label>
              <Select value={selectedClient || ''} onValueChange={(v) => setSelectedClient(v || null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select client " />
                </SelectTrigger>
                <SelectContent>
                  {profileState.loading ? (
                    <SelectItem value="__loading__" disabled>Loading clients...</SelectItem>
                  ) : (Array.isArray(profiles) && profiles.length === 0) ? (
                    <SelectItem value="__no_clients__" disabled>No clients found</SelectItem>
                  ) : (
                    profiles.map((u: any) => (
                      <SelectItem key={u._id || u.id || u.email} value={u.userId || u._id || u.id}>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className=' pb-2'>Status</Label>
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
                <Label className=' pb-2'>Cycle</Label>
                <Select value={assignCycle} onValueChange={(v) => setAssignCycle(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="one-time">One Time</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {assignCycle !== 'one-time' && (
              <div>
                <Label className=' pb-2'>Start / Complite  date</Label>
                <DateRangePicker
                  value={{ from: assignStartDate || null, to: assignRenewalDate || null }}
                  onChange={(v) => {
                    setAssignStartDate(v.from || '');
                    setAssignRenewalDate(v.to || null);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className=' pb-2'>Price (override)</Label>
                <Input type="number" value={assignPrice ?? ''} onChange={(e) => setAssignPrice(e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="flex flex-col">
                <Label className=' pb-2'>Auto invoice</Label>
                <div className="mt-2">
                  <Switch checked={assignAutoInvoice} onCheckedChange={(v) => setAssignAutoInvoice(Boolean(v))} />
                </div>
              </div>
            </div>

            <div>
              <Label className=' pb-2'>Notes (internal)</Label>
              <Textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assignSubmitting}>Cancel</Button>
              <Button onClick={handleAssignSubmit} disabled={!selectedClient || assignSubmitting}>
                {assignSubmitting ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
