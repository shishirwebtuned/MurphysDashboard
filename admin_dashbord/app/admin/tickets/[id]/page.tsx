'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchTicketById, updateTicketStatus, addAdminResponse } from '@/lib/redux/slices/ticketSlice'
import { getMee } from '@/lib/redux/slices/meeSlice'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2,  Send } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Image from 'next/image'
import Header from '@/app/page/common/header'
export default function AdminTicketDetailPage() {
  const params = useParams()
  const dispatch = useAppDispatch()
  const { data: meeData } = useAppSelector((state) => state.mee)
  console.log("meeData:", meeData)
  const { currentTicket, loading } = useAppSelector((state) => state.tickets)
  
  const ticketId = params.id as string
  
  const [adminResponseText, setAdminResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!meeData) {
      dispatch(getMee())
    }
  }, [dispatch, meeData])

  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketById(ticketId))
    }
  }, [dispatch, ticketId])

  useEffect(() => {
    if (currentTicket?.adminResponse) {
      setAdminResponseText(currentTicket.adminResponse)
    }
  }, [currentTicket])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await dispatch(updateTicketStatus({ id: ticketId, status: newStatus })).unwrap()
      toast.success('Status updated successfully')
    } catch (error: any) {
      toast.error(error || 'Failed to update status')
    }
  }

  const handleSubmitResponse = async () => {
    if (!adminResponseText.trim()) {
      toast.error('Please enter a response')
      return
    }

    // Support multiple shapes for meeData: some responses include `uid`, others use `userId` or `_id`.
    const adminIdValue = meeData?.uid || meeData?.userId || meeData?._id || null
    const adminEmailValue = meeData?.email || null

    if (!adminIdValue || !adminEmailValue) {
      toast.error('Admin information not available')
      return
    }

    setSubmitting(true)

    try {
      await dispatch(addAdminResponse({
        id: ticketId,
        adminResponse: adminResponseText,
        adminId: adminIdValue,
        adminEmail: adminEmailValue
      })).unwrap()
      toast.success('Response added successfully')
    } catch (error: any) {
      toast.error(error || 'Failed to add response')
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-600 border-red-200'
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      case 'low': return 'bg-green-500/10 text-green-600 border-green-200'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'in-progress': return 'bg-purple-500/10 text-purple-600 border-purple-200'
      case 'resolved': return 'bg-green-500/10 text-green-600 border-green-200'
      case 'closed': return 'bg-gray-500/10 text-gray-600 border-gray-200'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  if (loading && !currentTicket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!currentTicket) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="">
        <Header
            title="Support Tickets"
            description="Manage your service support tickets"
        />
    

      <div className="grid gap-6">
        {/* Ticket Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Ticket Details</CardTitle>
                <CardDescription>
                  Ticket ID: {currentTicket._id}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={currentTicket.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[150px]">
                    <Badge variant="outline" className={getStatusColor(currentTicket.status)}>
                      {currentTicket.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User & Service Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">User</Label>
                <p className="font-medium">{currentTicket.userName}</p>
                <p className="text-sm text-muted-foreground">{currentTicket.userEmail}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Service</Label>
                <p className="font-medium">{currentTicket.assignedServiceName}</p>
              </div>
            </div>

            <Separator />

            {/* Problem Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Problem Type</Label>
                <p className="font-medium">{currentTicket.problemType}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Priority</Label>
                <Badge variant="outline" className={getPriorityColor(currentTicket.priority)}>
                  {currentTicket.priority}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Created</Label>
                <p>{format(new Date(currentTicket.createdAt), 'PPP p')}</p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase">Description</Label>
              <div 
                className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-md"
                dangerouslySetInnerHTML={{ __html: currentTicket.description }}
              />
            </div>

            {/* Images */}
            {currentTicket.images && currentTicket.images.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase">Attached Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentTicket.images.map((image: string, index: number) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Ticket image ${index + 1}`}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Response Card */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Response</CardTitle>
            <CardDescription>
              {currentTicket.adminResponse ? 'Update your response to this ticket' : 'Provide a response to this ticket'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminResponse">Response Message</Label>
              <Textarea
                id="adminResponse"
                value={adminResponseText}
                onChange={(e) => setAdminResponseText(e.target.value)}
                placeholder="Enter your response to the user..."
                rows={6}
                className="resize-none"
              />
            </div>

            {currentTicket.adminEmail && (
              <p className="text-sm text-muted-foreground">
                Last responded by: {currentTicket.adminEmail}
              </p>
            )}

            <Button 
              onClick={handleSubmitResponse} 
              disabled={submitting || !adminResponseText.trim()}
              className="w-full sm:w-auto"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              {currentTicket.adminResponse ? 'Update Response' : 'Send Response'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
