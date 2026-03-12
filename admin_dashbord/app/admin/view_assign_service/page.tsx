'use client'
import React, { useEffect } from 'react'
import Header from '@/app/page/common/header'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, RefreshCcw, Calendar as CalendarIcon, Plus, Edit2, Trash2, Delete, ChevronDownIcon, Loader2, User, Briefcase, DollarSign, Clock, FileText, Search } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { getAssignedServices, getAssignDetails } from '@/lib/redux/slices/assignSlice';
import SpinnerComponent from '@/app/page/common/Spinner'
import { Input } from '@/components/ui/input'
import Pagination from '@/app/page/common/Pagination'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectItem, SelectValue } from '@/components/ui/select';
import { updateAssignedService, addRenewalDate, deleteAssignedService } from '@/lib/redux/slices/assignSlice';
import { fetchServices } from '@/lib/redux/slices/serviceSlice';
import { getadminProfile } from '@/lib/redux/slices/profileSlice';
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import DeleteModel from '@/app/page/common/DeleteModel'
import { Label } from '@/components/ui/label'
import InvoiceView from '@/app/page/InvoiceView'



const page = () => {
    const dispatch = useAppDispatch();
    const { loading, total, limit, page } = useAppSelector((state) => state.assign);
    const data = useAppSelector((state) => state.assign.data);
    const totalPages = useAppSelector((state) => state.assign.totalPages || 0);
    const rows = Array.isArray(data) ? data : (data ? [data] : []);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm);
    const [pageNumber, setPageNumber] = React.useState(1);
    const [limitNumber, setLimitNumber] = React.useState(10);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [detailsData, setDetailsData] = React.useState<any>(null);
    const [editOpen, setEditOpen] = React.useState(false);
    const [editData, setEditData] = React.useState<any>(null);
    const [renewalDialogOpen, setRenewalDialogOpen] = React.useState(false);
    const [renewalDialogData, setRenewalDialogData] = React.useState<any>(null);
    const [isEditingRenewal, setIsEditingRenewal] = React.useState(false);
    const [editingRenewalId, setEditingRenewalId] = React.useState<string | null>(null);
    const [newRenewalDate, setNewRenewalDate] = React.useState<Date | undefined>(undefined);
    const [newRenewalLabel, setNewRenewalLabel] = React.useState('');
    const [newRenewalPrice, setNewRenewalPrice] = React.useState('');
    const [endOpen, setEndOpen] = React.useState(false)
    const [invoiceOpen, setInvoiceOpen] = React.useState(false)
    const [invoiceData, setInvoiceData] = React.useState<any>(null)
    const { toast } = useToast();

    // Filters state
    const [selectedClient, setSelectedClient] = React.useState<string>('all');
    const [selectedService, setSelectedService] = React.useState<string>('all');
    const [clientsList, setClientsList] = React.useState<any[]>([]);
    const [servicesList, setServicesList] = React.useState<any[]>([]);

    // Fetch clients and services for filters
    React.useEffect(() => {
        dispatch(getadminProfile({ role_type: 'client user', limit: 100 })).then((res: any) => {
            if (res.payload?.data) setClientsList(res.payload.data);
        });
        dispatch(fetchServices({ limit: 100 })).then((res: any) => {
            if (res.payload?.services) setServicesList(res.payload.services);
        });
    }, [dispatch]);

    // Debounce search input to avoid excessive requests
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    React.useEffect(() => {
        // Fetch assigned services whenever page, limit or debounced search changes
        dispatch(getAssignedServices({
            page: pageNumber,
            limit: limitNumber,
            search: debouncedSearch,
            client_id: selectedClient === 'all' ? undefined : selectedClient,
            service_catalog_id: selectedService === 'all' ? undefined : selectedService
        }));
    }, [dispatch, pageNumber, limitNumber, debouncedSearch, selectedClient, selectedService]);

    // Helper function to calculate days ago
    const getDaysAgo = (date: string | Date) => {
        if (!date) return null;
        const startDate = new Date(String(date));
        const today = new Date();
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    // Helper function to calculate days remaining and get color
    const getDaysRemainingInfo = (date: string | Date) => {
        if (!date) return { text: null, variant: 'secondary' as const };
        const renewalDate = new Date(String(date));
        const today = new Date();
        const diffTime = renewalDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let text = '';
        let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'secondary';

        if (diffDays < 0) {
            text = `Overdue ${Math.abs(diffDays)}d`;
            variant = 'destructive';
        } else if (diffDays === 0) {
            text = 'Today';
            variant = 'destructive';
        } else if (diffDays <= 7) {
            text = `${diffDays}d left`;
            variant = 'destructive';
        } else if (diffDays <= 30) {
            text = `${diffDays}d left`;
            variant = 'outline';
        } else {    
            text = `${diffDays}d left`;
            variant = 'secondary';
        }
        return { text, variant };
    };

    const handelreset = () => {
        setSearchTerm('');
        setPageNumber(1);
    }

    const handleEditRenewal = (renewal: any) => {
        setIsEditingRenewal(true);
        setEditingRenewalId(renewal._id);
        setNewRenewalLabel(renewal.label);
        setNewRenewalDate(new Date(renewal.date));
        setNewRenewalPrice(String(renewal.price));
    };

    const resetRenewalForm = () => {
        setIsEditingRenewal(false);
        setEditingRenewalId(null);
        setNewRenewalDate(undefined);
        setNewRenewalLabel('');
        setNewRenewalPrice('');
    };
    const [deleteid, setDeleteid] = React.useState<string | null>(null);
    const [deleteOpen, setDeleteOpen] = React.useState(false);


    return (
        <div className="space-y-6 ">
            {loading && <SpinnerComponent />}
            <Header
                title="Assigned Services"
                description="Manage and track all client service assignments"
                total={total}
                extra={
                     <div className="flex flex-col gap-4   ">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type='text'
                                    placeholder='Search clients or services...'
                                    className='pl-9 w-[280px] h-10'
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPageNumber(1);
                                    }}
                                />
                            </div>
                            <Select value={selectedClient} onValueChange={(val) => { setSelectedClient(val); setPageNumber(1); }}>
                                <SelectTrigger className="w-[200px] h-10">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="All Clients" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Clients</SelectItem>
                                    {clientsList.map((client) => {
                                        const label = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.name || client.email || client._id || client.id;
                                        const value = client._id || client.id;
                                        return (
                                            <SelectItem key={value} value={String(value)}>
                                                {label}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            <Select value={selectedService} onValueChange={(val) => { setSelectedService(val); setPageNumber(1); }}>
                                <SelectTrigger className="w-[200px] h-10">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="All Services" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    {servicesList.map((service) => (
                                        <SelectItem key={service.id || service._id} value={service.id || service._id}>
                                            {service.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                }
            />
            
            {/* Header Section */}
            <div className="space-y-4">

                {/* Filters and Search Bar */}
               
            </div>

            {/* Table Card */}
            <div className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold">#</TableHead>
                                <TableHead className="font-semibold">Client</TableHead>
                                <TableHead className="font-semibold">Service</TableHead>
                                <TableHead className="font-semibold">Assigned</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Pricing</TableHead>
                                <TableHead className="font-semibold">End Date</TableHead>
                                <TableHead className="font-semibold">Renewals</TableHead>
                                <TableHead className="font-semibold text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                            <TableBody>
                                {rows && rows.length > 0 ? (
                                    rows.map((service: any, index) => {
                                        const assignedDate = service.start_date || service.assignedDate || service.createdAt;
                                        const daysAgo = getDaysAgo(assignedDate);
                                        const totalRenewalPrice = (service.renewal_dates || []).reduce((sum: number, r: any) => sum + (r.price || 0), 0);
                                        const remainingPrice = Number(service.price || 0) - totalRenewalPrice;

                                        return (
                                            <TableRow key={service._id ?? service.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">{((pageNumber - 1) * limitNumber) + index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            {service.client_name || (service.userProfile ? `${service.userProfile.firstName || ''} ${service.userProfile.lastName || ''}`.trim() : (service.userName || service.clientName || service.email || '-'))}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{service.service_name || service.serviceName || service.service_catalog_id || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-sm">{assignedDate ? new Date(String(assignedDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</span>
                                                        </div>
                                                        {daysAgo && <Badge variant="secondary" className="w-fit text-xs">{daysAgo}</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={service.isaccepted === 'accepted' ? 'default' : service.isaccepted === 'pending' ? 'outline' : 'destructive'}
                                                        className="capitalize font-medium"
                                                    >
                                                        {service.isaccepted ?? service.status ?? '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-lg">${service.price ?? '-'}</span>
                                                        </div>
                                                        {totalRenewalPrice > 0 && (
                                                            <div className="flex flex-col gap-1.5">
                                                                <Badge variant="secondary" className="w-fit text-xs font-medium">
                                                                    Allocated: ${totalRenewalPrice.toFixed(2)}
                                                                </Badge>
                                                                <Badge variant={remainingPrice > 0 ? "outline" : "default"} className="w-fit text-xs font-medium">
                                                                    Remaining: ${remainingPrice.toFixed(2)}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {service.end_date ? new Date(String(service.end_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {service.renewal_dates && service.renewal_dates.length > 0 ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setRenewalDialogData(service);
                                                                resetRenewalForm();
                                                                setRenewalDialogOpen(true);
                                                            }}
                                                            className="gap-2"
                                                        >
                                                            <CalendarIcon className="h-4 w-4" />
                                                            {service.renewal_dates.length} Renewal{service.renewal_dates.length > 1 ? 's' : ''}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setRenewalDialogData(service);
                                                                resetRenewalForm();
                                                                setRenewalDialogOpen(true);
                                                            }}
                                                            className="gap-2 cursor-pointer text-muted-foreground "
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Add Renewal
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4 rotate-90" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => {
                                                                setEditData(service);
                                                                setEditOpen(true);
                                                            }} className="gap-2">
                                                                <Edit2 className="h-4 w-4" />
                                                                Edit Service
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                dispatch(getAssignDetails({ client_id: service.client_id, service_catalog_id: service.service_catalog_id }))
                                                                    .then((res: any) => {
                                                                        if (res.payload) {
                                                                            setDetailsData(res.payload);
                                                                            setDetailsOpen(true);
                                                                        }
                                                                    })
                                                                    .catch(() => {
                                                                        toast({
                                                                            title: 'Error',
                                                                            description: 'Failed to fetch details.',
                                                                            variant: 'destructive',
                                                                        });
                                                                    })
                                                            }} className="gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                setInvoiceData(service);
                                                                setInvoiceOpen(true);
                                                            }} className="gap-2">
                                                                <DollarSign className="h-4 w-4" />
                                                                View Invoice
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => { setDeleteOpen(true); setDeleteid(service._id); }}
                                                                className="gap-2 text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <Briefcase className="h-10 w-10 opacity-50" />
                                                <p className="text-sm">
                                                    No assigned services found
                                                    {searchTerm && (
                                                        <span className="font-semibold text-foreground"> for "{searchTerm}"</span>
                                                    )}
                                                </p>
                                                {searchTerm && (
                                                    <Button variant="outline" size="sm" onClick={handelreset} className="gap-2">
                                                        <RefreshCcw className="h-4 w-4" />
                                                        Clear Search
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                {/* Pagination Footer */}
                {rows && rows.length > 0 && (
                    <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-medium text-foreground">{((pageNumber - 1) * limitNumber) + 1}</span> to <span className="font-medium text-foreground">{Math.min(pageNumber * limitNumber, total || 0)}</span> of <span className="font-medium text-foreground">{total || 0}</span> results
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground">Per page:</label>
                                <Select value={String(limitNumber)} onValueChange={(value) => setLimitNumber(Number(value))}>
                                    <SelectTrigger className="w-[80px] h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value={"5"}>5</SelectItem>
                                            <SelectItem value={"10"}>10</SelectItem>
                                            <SelectItem value={"25"}>25</SelectItem>
                                            <SelectItem value={"50"}>50</SelectItem>
                                            <SelectItem value={"100"}>100</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Pagination page={pageNumber} totalPages={totalPages || 1} onPageChange={(p) => setPageNumber(p)} />
                        </div>
                    </div>
                )}
            </div>



            {/* Edit Service Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Assigned Service</DialogTitle>
                        <DialogDescription>Update details for the assigned service</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                        {editData ? (
                            <>
                                <div>
                                    <label className="text-sm font-medium">Price</label>
                                    <Input value={String(editData.price ?? '')} onChange={(e) => setEditData({ ...editData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Select value={String(editData.isaccepted ?? editData.status ?? '')} onValueChange={(val) => setEditData({ ...editData, isaccepted: val })}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={"accepted"}>Accepted</SelectItem>
                                                <SelectItem value={"pending"}>Pending</SelectItem>
                                                <SelectItem value={"rejected"}>Rejected</SelectItem>
                                                <SelectItem value={"running"}>Running</SelectItem>
                                                <SelectItem value={"completed"}>Completed</SelectItem>
                                              


                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="end-date" className="px-1">
                                        End Date
                                    </Label>
                                    <Popover open={endOpen} onOpenChange={setEndOpen} >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                id="end-date"
                                                className="justify-between font-normal"
                                            >
                                                {editData.end_date ? new Date(String(editData.end_date)).toLocaleDateString() : "Select end date"}
                                                <ChevronDownIcon />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={editData.end_date ? new Date(String(editData.end_date)) : undefined}
                                                captionLayout="dropdown"
                                                onSelect={(d) => {
                                                    setEditData((prev: any) => ({ ...prev, end_date: d ? d.toISOString() : null }))
                                                    setEndOpen(false)
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setEditData((prev: any) => ({ ...prev, end_date: null })); setEndOpen(false); }}>Clear</Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <Button onClick={async () => {
                                        try {
                                            const id = editData._id || editData.id;
                                            const payload: any = {
                                                price: editData.price,
                                            };
                                            if (editData.isaccepted !== undefined) payload.isaccepted = editData.isaccepted;
                                            // include end_date if user selected/cleared it
                                            if (editData.end_date !== undefined) {
                                                // if it's already an ISO string, use it; if Date, convert
                                                payload.end_date = typeof editData.end_date === 'string' ? editData.end_date : (editData.end_date ? new Date(editData.end_date).toISOString() : null);
                                            }

                                            await dispatch(updateAssignedService({ id, data: payload })).unwrap();
                                            // refresh list to reflect changes
                                            dispatch(getAssignedServices({ page: pageNumber, limit: limitNumber, search: debouncedSearch }));
                                            toast({ title: 'Success', description: 'Assigned service updated' });
                                            setEditOpen(false);
                                        } catch (err: any) {
                                            toast({ title: 'Update failed', description: err?.message || 'Could not update', variant: 'destructive' });
                                        }
                                    }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
                                    <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
                                </div>
                            </>
                        ) : (
                            <div>No item selected.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Assigned Service Details</DialogTitle>
                        <DialogDescription>Complete details for the selected assigned service</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {detailsData ? (() => {
                            const payload = (detailsData as any).data ? (detailsData as any).data : detailsData;
                            const client = payload.clientProfile || payload.client;
                            const service = payload.service;
                            const parseArrayField = (val: any) => {
                                try {
                                    if (!val) return [];
                                    if (Array.isArray(val)) return val.flatMap((v) => {
                                        try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; }
                                    });
                                    if (typeof val === 'string') {
                                        let parsed: any = val;
                                        let attempts = 0;
                                        while (typeof parsed === 'string' && attempts < 3) {
                                            try { parsed = JSON.parse(parsed); } catch { break; }
                                            attempts++;
                                        }
                                        return Array.isArray(parsed) ? parsed : [parsed];
                                    }
                                    return [val];
                                } catch { return [] }
                            };

                            return (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border rounded-lg p-4">
                                            <h3 className="text-lg font-semibold mb-3">Client Profile</h3>
                                            <div className="space-y-2">
                                                <div><strong>Name:</strong> {client ? `${client.firstName || client.first_name || ''} ${client.lastName || client.last_name || ''}`.trim() : '-'}</div>
                                                <div><strong>Email:</strong> {client?.email ?? payload.email ?? '-'}</div>
                                                <div><strong>Location:</strong> {client ? `${client.city || ''}${client.state ? ', ' + client.state : ''}${client.country ? ', ' + client.country : ''}` : '-'}</div>
                                                {client?.image && (
                                                    <div className="mt-2">
                                                        <Image src={client.image} alt={client.name || 'client image'} width={300} height={180} className="rounded-md object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="border rounded-lg p-4">
                                            <h3 className="text-lg font-semibold mb-3">Service Details</h3>
                                            <div className="space-y-2">
                                                <div><strong>Name:</strong> {service?.name || service?.service_name || service?.serviceName || '-'}</div>
                                                <div><strong>Description:</strong> {service?.description ?? '-'}</div>
                                                <div><strong>Category:</strong> {service?.categoryName ?? '-'}</div>
                                                <div><strong>Price:</strong> {service?.price ?? payload.price ?? '-'} {service?.currency ?? payload.currency ?? ''}</div>
                                                <div><strong>Billing:</strong> {service?.billingType ?? service?.cycle ?? payload.cycle ?? '-'}</div>
                                                <div><strong>Duration (days):</strong> {service?.durationInDays ?? '-'}</div>
                                                <div><strong>Featured:</strong> {service?.isFeatured ? 'Yes' : 'No'}</div>
                                                <div className="mt-2">
                                                    <strong>Tags:</strong>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {parseArrayField(service?.tags).map((t: any, i: number) => (
                                                            <Badge key={i} variant="secondary">{String(t)}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <strong>Features:</strong>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {parseArrayField(service?.features).map((f: any, i: number) => (
                                                            <Badge key={i} variant="outline">{String(f)}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                {service?.image && (
                                                    <div className="mt-2">
                                                        <Image src={service.image} alt={service.name || 'service image'} width={300} height={180} className="rounded-md object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })() : (
                            <div>No details available.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Renewal Dates Management Dialog */}
            <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Renewal Dates Management
                        </DialogTitle>
                        <DialogDescription>View, add, and manage renewal dates for this service</DialogDescription>
                    </DialogHeader>

                    {renewalDialogData && (() => {
                        const totalRenewalPrice = (renewalDialogData.renewal_dates || []).reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);
                        const servicePrice = Number(renewalDialogData.price || 0);
                        const remainingPrice = servicePrice - totalRenewalPrice;

                        return (
                            <div className="space-y-6">
                                {/* Service Summary */}
                                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Client</p>
                                            <p className="font-semibold text-lg">{renewalDialogData.client_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Service</p>
                                            <p className="font-semibold text-lg">{renewalDialogData.service_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-4">
                                        <Badge variant="default" className="text-sm px-3 py-1">
                                            Total: ${servicePrice.toFixed(2)}
                                        </Badge>
                                        <Badge variant="secondary" className="text-sm px-3 py-1">
                                            Allocated: ${totalRenewalPrice.toFixed(2)}
                                        </Badge>
                                        <Badge variant={remainingPrice > 0 ? "outline" : "default"} className="text-sm px-3 py-1">
                                            Remaining: ${remainingPrice.toFixed(2)}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Existing Renewal Dates */}
                                {renewalDialogData.renewal_dates && renewalDialogData.renewal_dates.length > 0 && (
                                    <div className="border rounded-lg p-4">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5" />
                                            Existing Renewal Dates ({renewalDialogData.renewal_dates.length})
                                        </h3>
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {renewalDialogData.renewal_dates.map((renewal: any, idx: number) => {
                                                const renewalInfo = getDaysRemainingInfo(renewal.date);
                                                return (
                                                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <Badge variant="secondary" className="capitalize font-medium">
                                                                    {renewal.label}
                                                                </Badge>
                                                                <span className="text-sm font-medium">
                                                                    {new Date(renewal.date).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </span>
                                                                {renewalInfo.text && (
                                                                    <Badge variant={renewalInfo.variant} className="text-xs">
                                                                        {renewalInfo.text}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="outline" className="font-semibold">
                                                                    ${renewal.price}
                                                                </Badge>
                                                                <Badge variant={renewal.haspaid ? "default" : "secondary"}>
                                                                    {renewal.haspaid ? 'Paid' : 'Unpaid'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditRenewal(renewal._id ? { ...renewal, _id: renewal._id } : { ...renewal, id: renewal.id })}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Add/Edit Renewal Form */}
                                <div className="border rounded-lg p-4 bg-muted/30">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        {loading && <SpinnerComponent />}
                                        {isEditingRenewal ? (
                                            <>
                                                <Edit2 className="h-5 w-5" />
                                                Edit Renewal Date
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-5 w-5" />
                                                Add New Renewal
                                            </>
                                        )}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Renewal Label *</label>
                                            <Input
                                                type="text"
                                                placeholder="e.g., First Renewal, Q2 Payment"
                                                value={newRenewalLabel}
                                                onChange={(e) => setNewRenewalLabel(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Renewal Date *</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !newRenewalDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newRenewalDate ? format(newRenewalDate as Date, "PPP") : "Pick a date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={newRenewalDate}
                                                        onSelect={setNewRenewalDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Renewal Price *</label>
                                            <Input
                                                type="number"
                                                placeholder="Enter price"
                                                value={newRenewalPrice}
                                                onChange={(e) => setNewRenewalPrice(e.target.value)}
                                                min="0"
                                                step="0.01"
                                                max={isEditingRenewal ? servicePrice : remainingPrice}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {isEditingRenewal ? `Max: ${servicePrice.toFixed(2)}` : `Available: ${remainingPrice.toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-6">
                                        <Button onClick={async () => {
                                            if (!newRenewalDate) {
                                                toast({ title: 'Error', description: 'Please select a date', variant: 'destructive' });
                                                return;
                                            }
                                            if (!newRenewalLabel.trim()) {
                                                toast({ title: 'Error', description: 'Please enter a renewal label', variant: 'destructive' });
                                                return;
                                            }
                                            if (!newRenewalPrice || Number(newRenewalPrice) <= 0) {
                                                toast({ title: 'Error', description: 'Please enter a valid price', variant: 'destructive' });
                                                return;
                                            }

                                            const priceNum = Number(newRenewalPrice);
                                            if (!isEditingRenewal && priceNum > remainingPrice) {
                                                toast({
                                                    title: 'Price Exceeds Limit',
                                                    description: `Renewal price cannot exceed remaining amount of ${remainingPrice.toFixed(2)}`,
                                                    variant: 'destructive'
                                                });
                                                return;
                                            }

                                            try {
                                                const id = renewalDialogData._id || renewalDialogData.id;
                                                await dispatch(addRenewalDate({
                                                    id,
                                                    renewal_date: format(newRenewalDate, 'yyyy-MM-dd'),
                                                    renewal_label: newRenewalLabel.trim(),
                                                    renewal_price: priceNum,
                                                    renewal_id: editingRenewalId ?? undefined
                                                })).unwrap();
                                                toast({
                                                    title: 'Success',
                                                    description: isEditingRenewal ? 'Renewal date updated successfully' : 'Renewal date added successfully'
                                                });
                                                resetRenewalForm();
                                                dispatch(getAssignedServices({ page: pageNumber, limit: limitNumber, search: debouncedSearch }));
                                            } catch (err: any) {
                                                toast({ title: 'Failed', description: err?.message || 'Could not save renewal date', variant: 'destructive' });
                                            }
                                        }}>
                                            {loading ? (
                                                <span className="flex items-center">
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    {isEditingRenewal ? 'Updating...' : 'Adding...'}
                                                </span>
                                            ) : (
                                                isEditingRenewal ? 'Update Renewal' : 'Add Renewal Date'
                                            )}
                                        </Button>
                                        {isEditingRenewal && (
                                            <Button variant="outline" onClick={resetRenewalForm}>
                                                Cancel Edit
                                            </Button>
                                        )}
                                        <Button variant="ghost" onClick={() => {
                                            setRenewalDialogOpen(false);
                                            resetRenewalForm();
                                        }}>
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <DeleteModel
                deleteId={deleteid}
                onsuccess={async () => {
                    try {
                        await dispatch(deleteAssignedService({ id: deleteid })).unwrap();
                        setDeleteOpen(false);
                        toast({ title: 'Deleted', description: 'Assigned service deleted successfully.' });
                    }
                    catch (err: any) {
                        toast({ title: 'Deletion Failed', description: err?.message || 'Could not delete assigned service.', variant: 'destructive' });
                    }
                }}
            />

            {/* Invoice View */}
            {invoiceOpen && invoiceData && (
                <InvoiceView
                    assignmentData={invoiceData}
                    onClose={() => {
                        setInvoiceOpen(false);
                        setInvoiceData(null);
                    }}
                />
            )}
        
        </div>
        
    )
}

export default page