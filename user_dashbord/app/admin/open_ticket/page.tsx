'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchTickets, deleteTicket } from '@/lib/redux/slices/ticketSlice'
import Header from '@/app/page/common/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent,  CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, MoreVertical, Eye, Trash2, Edit, Plus, TicketIcon, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function OpenTicketPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { tickets, loading, total } = useAppSelector((state) => state.tickets)
  const { data: meeData } = useAppSelector((state) => state.mee)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  console.log('meeData:', meeData)



  useEffect(() => {
        dispatch(fetchTickets())
   
  }, [dispatch,])

  const handleDelete = async () => {
    if (!ticketToDelete) return
    setDeleting(true)
    try {
      await dispatch(deleteTicket(ticketToDelete._id)).unwrap()
      toast.success('Ticket deleted successfully')
      setDeleteDialogOpen(false)
      setTicketToDelete(null)
    } catch (error: any) {
      toast.error(error || 'Failed to delete ticket')
    } finally {
      setDeleting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    // Distinct, eye-catching colors per priority
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-amber-700 border-yellow-200 dark:bg-amber-900/20 dark:text-amber-200'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200'
    }
  }

  const getStatusColor = (status: string) => {
    // Eye-catching status colors
    switch ((status || '').toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200'
      case 'in-progress':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200'
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-200'
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200'
    }
  }

  // Calculate stats
  const stats = React.useMemo(() => {
    const open = tickets.filter(t => t.status === 'open').length
    const inProgress = tickets.filter(t => t.status === 'in-progress').length
    const resolved = tickets.filter(t => t.status === 'resolved').length
    const urgent = tickets.filter(t => t.priority === 'urgent').length
    return { open, inProgress, resolved, urgent }
  }, [tickets])

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent ">
      <Header
        title="Support Tickets"
        description="Manage your service support tickets"
        buttonText="Create Ticket"
        onButtonClick={() => router.push('/admin/open_ticket/create')}
        total={total}
        icon={<Plus className="h-6 w-6" />}
      />

      <div className="max-w-7xl mx-auto  space-y-8">
        {/* Stats Overview */}
        {tickets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow transform hover:-translate-y-0.5">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white p-2 rounded-lg shadow-md">
                    <TicketIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open Tickets</p>
                    <p className="text-2xl font-extrabold tracking-tight">{stats.open}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow transform hover:-translate-y-0.5">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white p-2 rounded-lg shadow-md">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-extrabold tracking-tight">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow transform hover:-translate-y-0.5">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-2 rounded-lg shadow-md">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-extrabold tracking-tight">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow transform hover:-translate-y-0.5">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-2 rounded-lg shadow-md">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Urgent</p>
                    <p className="text-2xl font-extrabold tracking-tight">{stats.urgent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tickets Table */}
        <div className="">
          <CardHeader className="">
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>Image</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Problem Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Loading tickets...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 shadow-inner">
                          <TicketIcon className="h-14 w-14 text-indigo-600" />
                        </div>
                        <p className="text-lg font-semibold mt-2">No tickets yet</p>
                        <p className="text-sm text-muted-foreground">Create your first ticket to get help from our support team</p>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => router.push('/admin/open_ticket/create')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Ticket
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket._id} className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <TableCell>{ticket.images && ticket.images.length > 0 ? <img src={ticket.images[0]} alt="Ticket" className="h-10 w-10 rounded-md object-cover" /> : <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><TicketIcon className="h-4 w-4 text-gray-500" /></div>}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <TicketIcon className="h-4 w-4 text-blue-600" />
                              </div>
                          <span className="truncate max-w-[200px]">{ticket.assignedServiceName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{ticket.problemType}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${getStatusColor(ticket.status)}`}>
                          {ticket.status === 'in-progress' ? 'In Progress' : ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" onClick={() => router.push(`/admin/open_ticket/${ticket._id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                              <MoreVertical className="h-4 w-4 rotate-90" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/open_ticket/${ticket._id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/open_ticket/${ticket._id}?edit=true`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-blue-600 focus:text-blue-700"
                              onClick={() => {
                                setTicketToDelete(ticket)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Delete Ticket
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {ticketToDelete && (
            <div className="py-4 space-y-3 border rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TicketIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Service</p>
                    <p className="text-sm font-medium">{ticketToDelete.assignedServiceName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Problem Type</p>
                    <p className="text-sm font-medium">{ticketToDelete.problemType}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={`capitalize ${getPriorityColor(ticketToDelete.priority)}`}>
                      {ticketToDelete.priority}
                    </Badge>
                    <Badge variant="outline" className={`capitalize ${getStatusColor(ticketToDelete.status)}`}>
                      {ticketToDelete.status === 'in-progress' ? 'In Progress' : ticketToDelete.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setTicketToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
