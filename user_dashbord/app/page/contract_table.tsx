"use client"

import React, { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MoreVertical, Bell, Mail, Phone, User, Calendar, CheckCircle2, XCircle, Trash2, Eye } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Header from '@/app/page/common/header'
import { fetchNotices, toggleNoticeStatus, deleteManyNotices, markAllNoticesRead } from "@/lib/redux/slices/noticSlicer"
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import SpinnerComponent from '@/app/page/common/Spinner'
import Pagination from '@/app/page/common/Pagination'
import DeleteModel from '@/app/page/common/DeleteModel'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import ViewNoticeModal from '../admin/notifications/ViewNoticeModal'

const ContractTable = () => {

    const dispatch = useAppDispatch();
    const { notices, loading, error, total, page, limit, totalPages } = useAppSelector((state) => state.notices);
    const [selectedNotices, setSelectedNotices] = useState<string[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMarkReadModalOpen, setIsMarkReadModalOpen] = useState(false);

    // View Modal State
    const [viewNotice, setViewNotice] = useState<any | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);


    useEffect(() => {
        if (!notices || notices.length === 0) {
            dispatch(fetchNotices({ page: 1, limit: 10 }));
        } else {
            dispatch(fetchNotices());
        }
    }, [dispatch]);

    // Enhanced Empty State
    if (!loading && (!notices || notices.length === 0)) {
        return (
            <div className="">
                <Header
                    title="Notifications"
                    description="Manage and view all system notifications."
                    total={total}
                    icon="Bell"
                />
                <Card className="w-full">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No notifications found</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            You don't have any notifications yet. New system messages and alerts will appear here.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => dispatch(fetchNotices())}
                        >
                            Refresh
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handletogglestatus = (id: string, status: boolean) => {
        dispatch(toggleNoticeStatus({ noticeId: id, status: status }));
    }

    // Handle Checkbox Selection
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = notices.map(n => n._id);
            setSelectedNotices(allIds);
        } else {
            setSelectedNotices([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedNotices(prev => [...prev, id]);
        } else {
            setSelectedNotices(prev => prev.filter(item => item !== id));
        }
    };


    const handleViewDetails = (notice: any) => {
        setViewNotice(notice);
        setIsViewModalOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedNotices.length === 0) return;
        setIsDeleteModalOpen(true);
    };

    const confirmBulkDelete = async () => {
        await dispatch(deleteManyNotices(selectedNotices));
        setSelectedNotices([]);
        toast.success("Selected notifications deleted");
        setIsDeleteModalOpen(false);
    };

    const handleMarkAllRead = () => {
        setIsMarkReadModalOpen(true);
    }

    const confirmMarkAllRead = async () => {
        await dispatch(markAllNoticesRead());
        toast.success("All notifications marked as read");
        setIsMarkReadModalOpen(false);
    }


    const isAllSelected = notices.length > 0 && selectedNotices.length === notices.length;

    return (
        <div className="">
            {loading && <SpinnerComponent />}

         

            <div className="border-none overflow-hidden">
                <CardHeader >

                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="">
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[200px]">User Details</TableHead>
                                    <TableHead className="w-[150px]">Title</TableHead>
                                    <TableHead className="w-[180px]">Contact Info</TableHead>
                                    <TableHead className="min-w-[200px]">Message</TableHead>
                                    <TableHead className="w-[150px]">Date</TableHead>
                                    <TableHead className="w-[70px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {notices.map((notification) => (
                                    <TableRow key={notification._id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedNotices.includes(notification._id)}
                                                onCheckedChange={(checked) => handleSelectOne(notification._id, !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center uppercase gap-2 font-medium">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    {notification.firstName} {notification.lastName}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">
                                            {notification.title}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3" />
                                                    <span className="truncate max-w-[140px]">{notification.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{notification.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip>
                                                <TooltipTrigger className="text-left">
                                                    <p className="line-clamp-2 text-sm text-muted-foreground max-w-[250px]">
                                                        {notification.message}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-sm">
                                                    {notification.message}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                    
                                        <TableCell className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {notification.createdAt ? format(new Date(notification.createdAt), 'MMM d, yyyy') : '-'}
                                            </div>
                                            <div className="text-xs ml-5 opacity-70">
                                                {notification.createdAt ? format(new Date(notification.createdAt), 'h:mm a') : ''}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8  cursor-pointer hover:bg-muted">
                                                        <MoreVertical className="h-4 w-4 rotate-90" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem onClick={() => handleViewDetails(notification)}>
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                        {/* Note: Delete logic is usually handled by the parent or a separate handler passed to modal */}
                                                        <Trash2 />    Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </div>

            <div className="py-4">
                <Pagination page={page} totalPages={totalPages} onPageChange={(newPage) => {
                    dispatch(fetchNotices({ page: newPage, limit }));
                }} />
            </div>

            {/* Kept outside structure as it's a modal */}
            <DeleteModel
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Delete Notifications"
                description={`Are you sure you want to delete ${selectedNotices.length} notifications? This action cannot be undone.`}
            />

            <DeleteModel
                isOpen={isMarkReadModalOpen}
                onClose={() => setIsMarkReadModalOpen(false)}
                onConfirm={confirmMarkAllRead}
                title="Mark All as Read"
                description="Are you sure you want to mark all notifications as read?"
            />

            <ViewNoticeModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                notice={viewNotice}
            />
        </div>
    )
}

export default ContractTable