'use client'
import React, { useEffect, useState } from 'react'
import Header from '@/app/page/common/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCcw, User, Briefcase, Search, Calendar, DollarSign, Clock, CheckCircle2, Eye } from 'lucide-react'

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { getAssignedServices } from '@/lib/redux/slices/assignSlice';
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
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectItem, SelectValue } from '@/components/ui/select';
import { fetchServices } from '@/lib/redux/slices/serviceSlice';
import { Card, CardContent } from '@/components/ui/card';
import InvoiceView from '../../page/InvoiceView';
import { fetchInvoices } from "../../../lib/redux/slices/invoiceSlicer"



const page = () => {
    const dispatch = useAppDispatch();
    const { loading, total, limit, page } = useAppSelector((state) => state.assign);
    const data = useAppSelector((state) => state.assign.data);
    const totalPages = useAppSelector((state) => state.assign.totalPages || 0);
    const meeState = useAppSelector((s) => s.mee);
    const currentUserEmail = meeState.data?.email || '';

    // Data filtered by backend
    const rows = Array.isArray(data) ? data : (data ? [data] : []);

    const [searchTerm, setSearchTerm] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm);
    const [pageNumber, setPageNumber] = React.useState(1);
    const [limitNumber, setLimitNumber] = React.useState(10);
    const [renewalsModalOpen, setRenewalsModalOpen] = useState(false);
    const [selectedRenewals, setSelectedRenewals] = useState<any[]>([]);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const invoiceData = useAppSelector((state) => state.invoices.invoice);
    const { toast } = useToast();

    // Filters state
    const [selectedService, setSelectedService] = React.useState<string>('all');
    // Fetch services for filters
    

    // Debounce search input to avoid excessive requests
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    React.useEffect(() => {
        // Fetch assigned services filtered by current user email from backend
        if (currentUserEmail) {
            dispatch(getAssignedServices({
                page: pageNumber,
                limit: limitNumber,
                search: debouncedSearch,
                service_catalog_id: selectedService === 'all' ? undefined : selectedService,
                email: currentUserEmail
            }));
        }
    }, [dispatch, pageNumber, limitNumber, debouncedSearch, selectedService, currentUserEmail]);

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

    const handelreset = () => {
        setSearchTerm('');
        setPageNumber(1);
    }

    const viewInvoice = async (invoiceId: string) => {
        try {
            await dispatch(fetchInvoices(invoiceId)).unwrap();
            setInvoiceModalOpen(true);
        } catch (error) {
        }
    }
    return (
        <div className="space-y-6">
            {loading && <SpinnerComponent />}
            <Header
                title="My Services"
                description="View your assigned services"

                total={total}
                extraInfo={
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type='text'
                                placeholder='Search...'
                                className='pl-9 w-[200px]'
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPageNumber(1);
                                }}
                            />
                        </div>

                    </div>
                }
            />

            <div className="space-y-4">
                <div className="p-0">
                    {rows && rows.length > 0 ? (
                        <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rows.map((service: any, index) => {
                                const assignedDate = service.start_date || service.assignedDate || service.createdAt;
                                const endDate = service.end_date;
                                const daysAgo = getDaysAgo(assignedDate);
                                const renewalDates = service.renewal_dates || [];
                                
                                // Calculate renewal statistics
                                const servicePrice = Number(service.price || 0);
                                const totalRenewalAmount = renewalDates.reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);
                                const paidCount = renewalDates.filter((r: any) => r.haspaid).length;
                                const unpaidCount = renewalDates.length - paidCount;
                                const paidAmount = renewalDates.filter((r: any) => r.haspaid).reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);
                                const remainingAmount = servicePrice - paidAmount;
                                const unpaidRenewalAmount = totalRenewalAmount - paidAmount;
                                const collectedPercentage = servicePrice > 0 ? (paidAmount / servicePrice) * 100 : 0;

                                return (
                                    <Card key={service._id ?? service.id} className="rounded-lg duration-200">
                                        {/* Header */}
                                        <CardContent className="px-4 py-4">
                                            <div className="flex items-start gap-4">
                                                {service.service_image && (
                                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0">
                                                        <Image
                                                            src={service.service_image}
                                                            alt={service.service_name || 'Service'}
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-normal text-gray-900 dark:text-gray-100 mb-1 truncate">
                                                        {service.service_name || service.serviceName || '-'}
                                                    </h3>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {service.invoice_id || 'N/A'}
                                                        </span>
                                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                            {service.cycle || 'one-time'}
                                                        </span>
                                                        {daysAgo && (
                                                            <>
                                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">{daysAgo}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-2xl font-normal text-gray-900 dark:text-gray-100">
                                                        ${servicePrice.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {service.isaccepted === 'accepted' || service.isaccepted === 'running' 
                                                            ? <span className="text-green-600 dark:text-green-400">Active</span>
                                                            : service.isaccepted === 'pending' 
                                                                ? <span className="text-amber-600 dark:text-amber-400">Pending</span>
                                                                : <span className="text-red-600 dark:text-red-400">Inactive</span>
                                                       }
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Payment Progress */}
                                        {renewalDates.length > 0 && (
                                            <CardContent className="border-t border-gray-100 dark:border-zinc-800">
                                                {/* Progress Section */}
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Payment progress</span>
                                                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{collectedPercentage.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(collectedPercentage, 100)}%` }} />
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>${paidAmount.toFixed(2)} collected</span>
                                                        <span>{remainingAmount > 0 ? `$${remainingAmount.toFixed(2)} remaining` : 'Complete'}</span>
                                                    </div>
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total renewals</div>
                                                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">${totalRenewalAmount.toFixed(0)}</div>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Items paid</div>
                                                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{paidCount}/{renewalDates.length}</div>
                                                    </div>
                                                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2">
                                                        <div className="text-xs text-green-700 dark:text-green-400 mb-1">Paid</div>
                                                        <div className="text-lg font-medium text-green-900 dark:text-green-300">${paidAmount.toFixed(0)}</div>
                                                    </div>
                                                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2">
                                                        <div className="text-xs text-amber-700 dark:text-amber-400 mb-1">Pending</div>
                                                        <div className="text-lg font-medium text-amber-900 dark:text-amber-300">{unpaidCount}</div>
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                        <span>{assignedDate ? new Date(String(assignedDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</span>
                                                    </div>
                                                    {endDate && (
                                                        <>
                                                            <span className="text-gray-300 dark:text-gray-600">→</span>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                                <span>{new Date(String(endDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Renewals List */}
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Renewal schedule</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{renewalDates.length} {renewalDates.length === 1 ? 'item' : 'items'}</span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {renewalDates.slice(0, 3).map((renewal: any, idx: number) => (
                                                            <div key={renewal._id || idx} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${renewal.haspaid ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm text-gray-900 dark:text-gray-100 truncate capitalize">{renewal.label || `Renewal ${idx + 1}`}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{renewal.date ? new Date(renewal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
                                                                </div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">${renewal.price || 0}</div>
                                                                <div className={`text-xs px-2 py-1 rounded ${renewal.haspaid ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20'}`}>
                                                                    {renewal.haspaid ? 'Paid' : 'Due'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {renewalDates.length > 3 && (
                                                        <button className="w-full mt-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded transition-colors font-medium" onClick={() => { setSelectedRenewals(renewalDates); setRenewalsModalOpen(true); }}>
                                                            Show all {renewalDates.length} renewals
                                                        </button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        )}

                                        {/* Footer */}
                                        <CardContent className="border-t border-gray-100 dark:border-zinc-800 p-4">
                                            <button className="w-full py-2.5 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded transition-colors" onClick={() => viewInvoice(service._id)}>
                                                View invoice
                                            </button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <Briefcase className="h-16 w-16 text-muted-foreground/50" />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">No services assigned</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {searchTerm === ''
                                                ? 'You have no assigned services yet.'
                                                : (
                                                    <>
                                                        No services found for "<span className='font-bold'>{searchTerm}</span>"
                                                        <RefreshCcw
                                                            className="inline-block ml-2 cursor-pointer hover:animate-spin"
                                                            onClick={handelreset}
                                                        />
                                                    </>
                                                )
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div>
                    <Pagination page={pageNumber} totalPages={totalPages || 1} onPageChange={(p) => setPageNumber(p)} />
                </div>
                <div>
                    <Select value={String(limitNumber)} onValueChange={(value) => setLimitNumber(Number(value))}>
                        <SelectTrigger className="w-[100px]">
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
            </div>

            {/* Details Dialog */}
        

            {/* All Renewals Modal */}
            <Dialog open={renewalsModalOpen} onOpenChange={setRenewalsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">All Renewal Schedules</DialogTitle>
                        <DialogDescription className="text-base">
                            Complete overview of {selectedRenewals.length} renewal payment{selectedRenewals.length !== 1 ? 's' : ''}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Summary Statistics */}
                    {selectedRenewals.length > 0 && (() => {
                        const totalAmount = selectedRenewals.reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);
                        const paidTotal = selectedRenewals.filter((r: any) => r.haspaid).length;
                        const unpaidTotal = selectedRenewals.length - paidTotal;
                        const paidValue = selectedRenewals.filter((r: any) => r.haspaid).reduce((sum: number, r: any) => sum + (Number(r.price) || 0), 0);
                        const unpaidValue = totalAmount - paidValue;

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4 border-b">
                                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Paid</p>
                                                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{paidTotal}</p>
                                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mt-1">${paidValue.toFixed(2)}</p>
                                            </div>
                                            <CheckCircle2 className="h-12 w-12 text-emerald-500 opacity-30" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wide">Unpaid</p>
                                                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">{unpaidTotal}</p>
                                                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mt-1">${unpaidValue.toFixed(2)}</p>
                                            </div>
                                            <Clock className="h-12 w-12 text-orange-500 opacity-30" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Value</p>
                                                <p className="text-3xl font-bold text-primary mt-1">${totalAmount.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{totalAmount > 0 ? ((paidValue / totalAmount) * 100).toFixed(1) : '0.0'}% collected</p>
                                            </div>
                                            <DollarSign className="h-12 w-12 text-primary opacity-30" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })()}

                    {/* Scrollable Renewal List */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                        {selectedRenewals.map((renewal: any, idx: number) => {
                            const isPaid = renewal.haspaid;
                            const renewalDate = renewal.date ? new Date(renewal.date) : null;
                            const today = new Date();
                            const isOverdue = renewalDate && !isPaid && renewalDate < today;
                            
                            return (
                                <Card 
                                    key={renewal._id || idx}
                                    className={`transition-all hover:shadow-md ${
                                        isPaid 
                                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' 
                                            : isOverdue 
                                                ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20'
                                                : 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20'
                                    }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        #{idx + 1}
                                                    </Badge>
                                                    <span className="font-bold capitalize text-base">
                                                        {renewal.label || `Renewal ${idx + 1}`}
                                                    </span>
                                                    {isOverdue && (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            OVERDUE
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <span className="font-medium">
                                                        {renewalDate ? renewalDate.toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        }) : 'No date set'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-3xl font-bold text-primary">
                                                    ${(renewal.price || 0).toFixed(2)}
                                                </div>
                                                <Badge
                                                    variant={isPaid ? 'default' : 'destructive'}
                                                    className="text-xs px-3 py-1"
                                                >
                                                    {isPaid ? '✓ Paid' : '✗ Unpaid'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {selectedRenewals.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <Clock className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">No renewal dates available</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invoice Modal */}
            <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
                <DialogContent className="max-w-[95vw] md:max-w-[900px] max-h-[95vh] p-0 gap-0 overflow-hidden">
                    {invoiceData && (
                        <InvoiceView
                            assignmentData={invoiceData}
                            onClose={() => setInvoiceModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default page