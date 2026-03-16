'use client'
import React, { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchTicketById, updateTicket } from '@/lib/redux/slices/ticketSlice'
import { getMee } from '@/lib/redux/slices/meeSlice'
import axiosInstance from '@/lib/axios'
import Editor from '@/components/Editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, ArrowLeft, Upload, X, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { quillModules, quillFormats } from '@/lib/quillConfig'
import { format } from 'date-fns'
import Image from 'next/image'
import 'react-quill/dist/quill.snow.css'
import Header from '@/app/page/common/header'

const problemTypes = [
  'Technical Issue',
  'Billing Problem',
  'Feature Request',
  'Performance Issue',
  'Bug Report',
  'Access Problem',
  'Data Loss',
  'Integration Issue',
  'Other'
]

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

function TicketDetailsContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { currentTicket, loading } = useAppSelector((state) => state.tickets)
  
  const ticketId = params.id as string
  const editMode = searchParams.get('edit') === 'true'
  
  const [isEditing, setIsEditing] = useState(editMode)
  const [submitting, setSubmitting] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  const [formData, setFormData] = useState({
    problemType: '',
    description: '',
    priority: 'medium'
  })



  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketById(ticketId))
    }
  }, [dispatch, ticketId])

  useEffect(() => {
    if (currentTicket) {
      setFormData({
        problemType: currentTicket.problemType,
        description: currentTicket.description,
        priority: currentTicket.priority
      })
    }
  }, [currentTicket])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const currentTotal = (currentTicket?.images?.length || 0) + newImages.length
    
    if (currentTotal + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    setNewImages(prev => [...prev, ...files])

    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.problemType) {
      toast.error('Please select a problem type')
      return
    }

    if (!formData.description || formData.description.trim() === '<p><br></p>') {
      toast.error('Please provide a description')
      return
    }

    setSubmitting(true)

    try {
      const form = new FormData()
      form.append('problemType', formData.problemType)
      form.append('description', formData.description)
      form.append('priority', formData.priority)

      // Append existing images
      if (currentTicket?.images) {
        currentTicket.images.forEach((img: string) => {
          form.append('existingImages[]', img)
        })
      }

      // Append new images
      newImages.forEach((image) => {
        form.append('images', image)
      })

      await dispatch(updateTicket({ id: ticketId, data: form })).unwrap()
      toast.success('Ticket updated successfully')
      setIsEditing(false)
      setNewImages([])
      setNewImagePreviews([])
    } catch (error: any) {
      toast.error(error || 'Failed to update ticket')
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
      <div className="max-w-4xl mx-auto ">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Header

        title="Ticket Details"
        description="View and manage the details of this support ticket."
      />

 

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Ticket Details</CardTitle>

            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(currentTicket.status)}>
                {currentTicket.status}
              </Badge>
              {!isEditing && (
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={currentTicket.status === 'closed'}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service (Read-only) */}
              <div className="space-y-2">
                <Label>Service</Label>
                <Input value={currentTicket.assignedServiceName} disabled />
              </div>

              {/* Problem Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="problemType">Problem Type *</Label>
                  <Select
                    value={formData.problemType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, problemType: value }))}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {problemTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description *</Label>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Describe the issue..."
                  />
                </div>
              </div>

              {/* Existing Images */}
              {currentTicket.images && currentTicket.images.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Images</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {currentTicket.images.map((image: string, index: number) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={image}
                          alt={`Ticket image ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Attachments (max 5)</Label>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={(currentTicket.images?.length || 0) + newImages.length >= 5}
                  />
                  <Label
                    htmlFor="image-upload"
                    className={`flex items-center justify-center gap-2 h-24 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                      (currentTicket.images?.length || 0) + newImages.length >= 5
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary hover:bg-accent'
                    }`}
                  >
                    <Upload className="h-5 w-5" />
                    <span>
                      {(currentTicket.images?.length || 0) + newImages.length === 0
                        ? 'Click to upload images'
                        : `${(currentTicket.images?.length || 0) + newImages.length}/5 uploaded`}
                    </span>
                  </Label>

                  {newImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {newImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeNewImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setNewImages([])
                    setNewImagePreviews([])
                    setFormData({
                      problemType: currentTicket.problemType,
                      description: currentTicket.description,
                      priority: currentTicket.priority
                    })
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Service Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Service</Label>
                  <p className="font-medium">{currentTicket.assignedServiceName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Created</Label>
                  <p>{format(new Date(currentTicket.createdAt), 'PPP p')}</p>
                </div>
              </div>

              <Separator />

              {/* Problem Details */}
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

              {/* Admin Response */}
              {currentTicket.adminResponse && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase">Admin Response</Label>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-sm whitespace-pre-wrap">{currentTicket.adminResponse}</p>
                      {currentTicket.adminEmail && (
                        <p className="text-xs text-muted-foreground mt-2">
                          - {currentTicket.adminEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* User Info */}
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Submitted by:</span> {currentTicket.userName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {currentTicket.userEmail}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TicketDetailsPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    }>
      <TicketDetailsContent />
    </Suspense>
  )
}
