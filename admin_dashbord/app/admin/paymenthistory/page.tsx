'use client';
import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Receipt, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Trash2,
  User,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import SpinnerComponent from '@/app/page/common/Spinner'
import Header from '@/app/page/common/header'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { getadminProfile } from '@/lib/redux/slices/profileSlice'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import Pagination from "@/app/page/common/Pagination"
import jsPDF from 'jspdf';

interface BillingHistoryItem {
  _id: string;
  user_email: string;
  user_id: string;
  invoice_id: string;
  service_name: string;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  stripe_payment_intent_id?: string;
  payment_date?: string;
  failure_reason?: string;
  createdAt: string;
  updatedAt: string;
}

interface BillingStats {
  _id: string;
  count: number;
  totalAmount: number;
}

interface UserProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  country?: string;
  address?: string;
  position?: string;
  role_type?: string;
  status?: string;
  userId?: string;
  createdAt?: string;
}

function BillingHistoryPage() {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.profile);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [stats, setStats] = useState<BillingStats[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<string | null>(null);
  const [calendarStartDate, setCalendarStartDate] = useState<Date | undefined>();
  const [calendarEndDate, setCalendarEndDate] = useState<Date | undefined>();
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const { toast } = useToast();

  // Get clients from profile state (assuming profile data contains array of profiles/clients)
  const clients = Array.isArray(profile) ? profile : (profile ? [profile] : []);

  const fetchBillingHistory = useCallback(async () => {
    setLoading(true);
    try {
      const axiosInstance = (await import('@/lib/axios')).default;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (clientFilter !== 'all') {
        params.append('clientEmail', clientFilter);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const [historyRes, statsRes] = await Promise.all([
        axiosInstance.get(`billing/admin/history?${params.toString()}`),
        axiosInstance.get('billing/admin/stats')
      ]);

      if (historyRes.data) {
        setBillingHistory(historyRes.data.data);
        setTotalPages(historyRes.data.pagination.pages);
      }

      if (statsRes.data) {
        setStats(statsRes.data.stats);
        setTotalPaid(statsRes.data.totalPaid);
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch billing history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, clientFilter, page, startDate, endDate, toast]);

  useEffect(() => {
    // Fetch all profiles/clients for the filter dropdown
    dispatch(getadminProfile({ limit: 1000 ,role_type:'client user' }));
  }, [dispatch]);

  useEffect(() => {
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'refunded':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      failed: 'destructive',
      pending: 'outline',
      refunded: 'secondary'
    };
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  };

  const getStatByStatus = (status: string) => {
    return stats.find(s => s._id === status);
  };
  const exportToPDF = async () => {
    try {
      setLoading(true);
      const axiosInstance = (await import('@/lib/axios')).default;
      
      // Fetch all data with high limit for export
      const params = new URLSearchParams({
        page: '1',
        limit: '1000' // Higher limit to get all data
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (clientFilter !== 'all') {
        params.append('clientEmail', clientFilter);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await axiosInstance.get(`billing/admin/history?${params.toString()}`);
      const allBillingData = response.data.data || [];

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Billing History Report', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, margin, yPos);
      yPos += 5;
      
      if (filter !== 'all') {
        doc.text(`Filter: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`, margin, yPos);
        yPos += 5;
      }
      if (startDate || endDate) {
        doc.text(`Date Range: ${startDate || 'Any'} to ${endDate || 'Any'}`, margin, yPos);
        yPos += 5;
      }
      
      yPos += 5;
      doc.setDrawColor(200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Summary Statistics
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Paid: $${totalPaid}`, margin, yPos);
      yPos += 5;
      doc.text(`Completed: ${getStatByStatus('completed')?.count || 0} payments`, margin, yPos);
      yPos += 5;
      doc.text(`Failed: ${getStatByStatus('failed')?.count || 0} attempts`, margin, yPos);
      yPos += 5;
      doc.text(`Pending: ${getStatByStatus('pending')?.count || 0} payments`, margin, yPos);
      yPos += 5;
      doc.text(`Refunded: ${getStatByStatus('refunded')?.count || 0} refunds`, margin, yPos);
      yPos += 10;

      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Transactions Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transactions', margin, yPos);
      yPos += 8;

      // Transaction table headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice', margin, yPos);
      doc.text('Service', margin + 35, yPos);
      doc.text('Amount', margin + 90, yPos);
      doc.text('Status', margin + 120, yPos);
      doc.text('Date', margin + 150, yPos);
      yPos += 5;
      
      doc.setDrawColor(200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      // Transaction rows - using fetched data
      doc.setFont('helvetica', 'normal');
      allBillingData.forEach((item: BillingHistoryItem, index: number) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }

        // Truncate text if too long
        const invoiceId = item.invoice_id.length > 15 ? item.invoice_id.substring(0, 12) + '...' : item.invoice_id;
        const serviceName = item.service_name.length > 25 ? item.service_name.substring(0, 22) + '...' : item.service_name;
        
        doc.text(invoiceId, margin, yPos);
        doc.text(serviceName, margin + 35, yPos);
        doc.text(`$${item.amount}`, margin + 90, yPos);
        doc.text(item.payment_status, margin + 120, yPos);
        doc.text(format(new Date(item.createdAt), 'MM/dd/yyyy'), margin + 150, yPos);
        yPos += 6;

        // Add subtle separator line
        if (index < allBillingData.length - 1) {
          doc.setDrawColor(230);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 2;
        }
      });

      // Footer on last page
      yPos = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Total transactions shown: ${allBillingData.length}`, margin, yPos);

      // Save the PDF
      const filename = `billing-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);

      toast({
        title: 'Success',
        description: `PDF exported successfully with ${allBillingData.length} transactions`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to export PDF',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      // CSV headers
      const headers = ['Invoice ID', 'Service Name', 'Amount', 'Currency', 'Status', 'Payment Method', 'Created Date', 'Payment Date'];
      
      // CSV rows
      const rows = billingHistory.map(item => [
        item.invoice_id,
        item.service_name,
        item.amount,
        item.currency,
        item.payment_status,
        item.payment_method,
        format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        item.payment_date ? format(new Date(item.payment_date), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `billing-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'CSV exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export CSV',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedItemForDelete) return;

    try {
      setLoading(true);
      const axiosInstance = (await import('@/lib/axios')).default;
      
      await axiosInstance.delete(`/billing/history/${selectedItemForDelete}`);
      
      toast({
        title: 'Success',
        description: 'Payment record deleted successfully',
      });

      // Refresh the data
      await fetchBillingHistory();
      setDeleteDialogOpen(false);
      setSelectedItemForDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete payment record',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (itemId: string) => {
    setSelectedItemForDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const fetchUserDetails = async (userId: string, userEmail: string) => {
    setLoadingUserDetails(true);
    setUserDetailsOpen(true);
    try {
      const axiosInstance = (await import('@/lib/axios')).default;
      
      // Try to find user in the loaded profiles first
      const existingUser = clients.find((client: any) => 
        client._id === userId || client.email === userEmail
      );
      
      if (existingUser) {
        setSelectedUser(existingUser);
      } else {
        // Fetch from API if not in profiles using email
        const response = await axiosInstance.get(`/profiles?email=${encodeURIComponent(userEmail)}`);
        const userData = response.data?.data || response.data;
        setSelectedUser(userData);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch user details',
        variant: 'destructive',
      });
      setUserDetailsOpen(false);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  return (
    <>
      {loading && <SpinnerComponent />}
      <Header
        title="Billing History"
        description="View and manage all your payment transactions"
        total={billingHistory.length}
        extra={            <div className="  flex items-end justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className='cursor-pointer'>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>}
      />

      <div className="space-y-6 ">
        {/* Filters Section */}
        <div>
          <div className="">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="w-full">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client</label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client._id || client.id} value={client.email}>
                        {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          
              <div className="w-full">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          
              <div className="w-full">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!calendarStartDate && 'text-muted-foreground'}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {calendarStartDate ? format(calendarStartDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={calendarStartDate}
                      onSelect={(date) => {
                        setCalendarStartDate(date);
                        setStartDate(date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
          
              <div className="w-full">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!calendarEndDate && 'text-muted-foreground'}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {calendarEndDate ? format(calendarEndDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={calendarEndDate}
                      onSelect={(date) => {
                        setCalendarEndDate(date);
                        setEndDate(date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      initialFocus
                      disabled={(date) => calendarStartDate ? date < calendarStartDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
          
              <div className="w-full flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilter('all');
                    setClientFilter('all');
                    setStartDate('');
                    setEndDate('');
                    setCalendarStartDate(undefined);
                    setCalendarEndDate(undefined);
                    setPage(1);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className='shadow-none '>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalPaid}</p>
                  <p className="text-xs text-muted-foreground">
                    {getStatByStatus('completed')?.count || 0} payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-none'>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${getStatByStatus('failed')?.totalAmount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getStatByStatus('failed')?.count || 0} attempts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-none'>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${getStatByStatus('pending')?.totalAmount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getStatByStatus('pending')?.count || 0} payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <Card className='shadow-none'>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-gray-600 dark:text-gray-200" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refunded</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${getStatByStatus('refunded')?.totalAmount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getStatByStatus('refunded')?.count || 0} refunds
                  </p>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
    

        {/* Transaction History */}
        <div>
            {/* <div className="  flex items-end justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div> */}
          <div className="rounded-lg  overflow-hidden">
            {billingHistory.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground">
                  {filter !== 'all' ? 'Try changing your filters' : 'No payment history available'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold">#</TableHead>
                        <TableHead className="font-semibold">Invoice ID</TableHead>
                        <TableHead className="font-semibold">Service</TableHead>
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Payment Date</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.map((item, index) => (
                        <TableRow key={item._id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            {((page - 1) * 10) + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-mono text-sm">{item.invoice_id}</p>
                                {item.stripe_payment_intent_id && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.stripe_payment_intent_id.substring(0, 20)}...
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{item.service_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.payment_method}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <button
                                onClick={() => fetchUserDetails(item.user_id, item.user_email)}
                                className="text-sm cursor-pointer text-blue-600 hover:underline text-left"
                              >
                                {item.user_email}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-bold text-base">${item.amount}</p>
                              <p className="text-xs text-muted-foreground uppercase">{item.currency}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.payment_status)}
                              {getStatusBadge(item.payment_status)}
                            </div>
                            {item.failure_reason && (
                              <p className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={item.failure_reason}>
                                {item.failure_reason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.payment_date ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span className="text-sm">
                                  {format(new Date(item.payment_date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.createdAt), 'HH:mm')}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4 rotate-90" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => fetchUserDetails(item.user_id, item.user_email)}>
                                    <User className="h-4 w-4 mr-2" />
                                    View User
                                  </DropdownMenuItem>
                                  {item.payment_status === 'failed' && (
                                    <DropdownMenuItem 
                                      onClick={() => openDeleteDialog(item._id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{((page - 1) * 10) + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * 10, billingHistory.length + ((page - 1) * 10))}</span> of <span className="font-medium text-foreground">{totalPages * 10}</span> results
                  </p>
                  <Pagination 
                    page={page} 
                    totalPages={totalPages} 
                    onPageChange={setPage} 
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this failed payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedItemForDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePayment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <AlertDialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>User Details</AlertDialogTitle>
            <AlertDialogDescription>
              Complete information about the user
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {loadingUserDetails ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading user details...</p>
            </div>
          ) : selectedUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-base font-medium mt-1">{(selectedUser.firstName  + ' ' + selectedUser.lastName).trim() || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base font-medium mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-base font-medium mt-1">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Country</label>
                  <p className="text-base font-medium mt-1">{selectedUser.country || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-base font-medium mt-1">{selectedUser.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <p className="text-base font-medium mt-1">
                    <Badge variant="outline">{selectedUser.role_type || 'User'}</Badge>
                  </p>
                </div>
                {selectedUser.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                    <p className="text-base font-medium mt-1">
                      {format(new Date(selectedUser.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No user details available</p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setUserDetailsOpen(false);
              setSelectedUser(null);
            }}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default BillingHistoryPage;
