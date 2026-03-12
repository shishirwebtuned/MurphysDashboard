import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Mail, Phone, User, Calendar, Clock } from 'lucide-react'
import { Notice } from '@/lib/redux/slices/noticSlicer'

interface ViewNoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    notice: Notice | null;
}

const ViewNoticeModal: React.FC<ViewNoticeModalProps> = ({ isOpen, onClose, notice }) => {
    if (!notice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center justify-between pr-8">
                        <Badge
                            variant={notice.status ? "default" : "secondary"}
                            className={notice.status ? "bg-green-500/15 text-green-700 border-green-200" : "text-muted-foreground"}
                        >
                            {notice.status ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {notice.createdAt ? format(new Date(notice.createdAt), 'PPP') : 'Unknown Date'}
                        <span className="text-muted-foreground/50">|</span>
                        <Clock className="h-3.5 w-3.5" />
                        {notice.createdAt ? format(new Date(notice.createdAt), 'h:mm a') : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Message Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Message</h4>
                        <div className="bg-muted/30 p-4 rounded-md text-sm leading-relaxed border">
                            {notice.message}
                        </div>
                    </div>

                    {/* Sender Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sender Info</h4>
                            <div className="flex items-center gap-3 p-3 border rounded-md bg-card">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{notice.firstName} {notice.lastName}</p>
                                    <p className="text-xs text-muted-foreground">User</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Details</h4>
                            <div className="space-y-2 text-sm border p-3 rounded-md bg-card">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{notice.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{notice.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t mt-2">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ViewNoticeModal
