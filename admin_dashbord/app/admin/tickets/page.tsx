'use client'
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchAllTickets, updateTicketStatus, deleteTicket } from '@/lib/redux/slices/ticketSlice'
import { getMee } from '@/lib/redux/slices/meeSlice'
import { useRouter } from 'next/navigation'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Eye, Trash2, Loader2, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Header from '@/app/page/common/header'

export default function AdminTicketsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: meeData } = useAppSelector((state) => state.mee)
  const { tickets, loading, pagination } = useAppSelector((state) => state.tickets)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!meeData) {
      dispatch(getMee())
    }
  }, [dispatch, meeData])

  useEffect(() => {
    loadTickets()
  }, [dispatch, statusFilter, priorityFilter])

  const loadTickets = () => {
    const params: any = { page: 1, limit: 10 }
    if (statusFilter !== 'all') params.status = statusFilter
    if (priorityFilter !== 'all') params.priority = priorityFilter
    dispatch(fetchAllTickets(params))
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await dispatch(updateTicketStatus({ id: ticketId, status: newStatus })).unwrap()
      toast.success('Status updated successfully')
    } catch (error: any) {
      toast.error(error || 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!ticketToDelete) return

    try {
      await dispatch(deleteTicket(ticketToDelete)).unwrap()
      toast.success('Ticket deleted successfully')
      setDeleteDialogOpen(false)
      setTicketToDelete(null)
    } catch (error: any) {
      toast.error(error || 'Failed to delete ticket')
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ticket.userName.toLowerCase().includes(query) ||
      ticket.userEmail.toLowerCase().includes(query) ||
      ticket.assignedServiceName.toLowerCase().includes(query) ||
      ticket.problemType.toLowerCase().includes(query)
    )
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return ''
      case 'high': return ''
      case 'medium': return ''
      case 'low': return ""
      default: return ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return ''
      case 'in-progress': return ''
      case 'resolved': return ''
      case 'closed': return ''
      default: return ''
    }
  }

  return (
    <div className="">
        <Header title="Support Tickets" description="Manage all support tickets"  
        extra ={
              <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, service, or problem type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

        }
        />
      <div>

        <div>
          {/* Filters */}
        

          {/* Table */}
          {loading && filteredTickets.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tickets found</p>
            </div>
          ) : (
            <div className=" ">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Problem Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>View</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{ticket.userName}</span>
                          <span className="text-sm text-muted-foreground">{ticket.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{ticket.assignedServiceName}</TableCell>
                      <TableCell>{ticket.problemType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleStatusChange(ticket._id, value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue>
                              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full "></div>
                                Open
                              </div>
                            </SelectItem>
                            <SelectItem value="in-progress">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full "></div>
                                In Progress
                              </div>
                            </SelectItem>
                            <SelectItem value="resolved">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full "></div>
                                Resolved
                              </div>
                            </SelectItem>
                            <SelectItem value="closed">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full "></div>
                                Closed
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Button className='bg-none cursor-pointer ' variant="link" size="sm" onClick={() => router.push(`/admin/tickets/${ticket._id}`)}> View  </Button></TableCell>

                      <TableCell>
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/tickets/${ticket._id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setTicketToDelete(ticket._id)
                                setDeleteDialogOpen(true)
                              }}
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
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} tickets
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === 1}
                  onClick={() => {
                    const params: any = { page: pagination.currentPage - 1, limit: pagination.limit }
                    if (statusFilter !== 'all') params.status = statusFilter
                    if (priorityFilter !== 'all') params.priority = priorityFilter
                    dispatch(fetchAllTickets(params))
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => {
                    const params: any = { page: pagination.currentPage + 1, limit: pagination.limit }
                    if (statusFilter !== 'all') params.status = statusFilter
                    if (priorityFilter !== 'all') params.priority = priorityFilter
                    dispatch(fetchAllTickets(params))
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setTicketToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
