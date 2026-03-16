'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { createTicket } from '@/lib/redux/slices/ticketSlice'
import { getMee } from '@/lib/redux/slices/meeSlice'
import { fetchProfileByEmail } from '@/lib/redux/slices/profileSlice'
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
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { quillModules, quillFormats } from '@/lib/quillConfig'
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

export default function CreateTicketPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: meeData } = useAppSelector((state) => state.mee)
  const [submitting, setSubmitting] = useState(false)
  const [assignedServices, setAssignedServices] = useState<any[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [formData, setFormData] = useState({
    assignedServiceId: '',
    assignedServiceName: '',
    problemType: '',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (!meeData) {
      dispatch(getMee())
    }
  }, [dispatch, meeData])


  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true)
        const response = await axiosInstance.get('/assigned')
        setAssignedServices(response.data.data || [])
      } catch (error) {
        console.error('Error fetching assigned services:', error)
        toast.error('Failed to load your services')
      } finally {
        setLoadingServices(false)
      }
    }

    fetchServices()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    setImages(prev => [...prev, ...files])

    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!meeData) {
      toast.error('User data not available')
      return
    }

    if (!formData.assignedServiceId) {
      toast.error('Please select a service')
      return
    }

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
      const userName = meeData.displayName || meeData.email?.split('@')[0] || 'User'

      const form = new FormData()
      form.append('userId', meeData.uid || '')
      form.append('userEmail', meeData.email || '')
      form.append('userName', userName)
      form.append('assignedServiceId', formData.assignedServiceId)
      form.append('assignedServiceName', formData.assignedServiceName)
      form.append('problemType', formData.problemType)
      form.append('description', formData.description)
      form.append('priority', formData.priority)

      images.forEach((image) => {
        form.append('images', image)
      })

      await dispatch(createTicket(form)).unwrap()
      toast.success('Ticket created successfully')
      router.push('/user/open_ticket')
    } catch (error: any) {
      toast.error(error || 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedService = useMemo(() => {
    return assignedServices.find(s => s._id === formData.assignedServiceId)
  }, [assignedServices, formData.assignedServiceId])

  return (
    <>
      <Header title="Create Support Ticket" />
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>New Support Ticket</CardTitle>
            <CardDescription>
              Fill out the form below to submit a support request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                {loadingServices ? (
                  <div className="flex items-center justify-center p-8 border rounded-md">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : assignedServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
                    No services assigned. Contact support for assistance.
                  </p>
                ) : (
                  <Select
                    value={formData.assignedServiceId}
                    onValueChange={(value) => {
                      const service = assignedServices.find(s => s._id === value)
                      setFormData(prev => ({
                        ...prev,
                        assignedServiceId: value,
                        assignedServiceName: service?.service_name || ''
                      }))
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedServices.map((service) => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.service_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                    disabled={images.length >= 5}
                  />
                  <Label
                    htmlFor="image-upload"
                    className={`flex items-center justify-center gap-2 h-24 border-2 border-dashed rounded-md cursor-pointer transition-colors ${images.length >= 5
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary hover:bg-accent'
                      }`}
                  >
                    <Upload className="h-5 w-5" />
                    <span>
                      {images.length === 0
                        ? 'Click to upload images'
                        : `${images.length}/5 uploaded`}
                    </span>
                  </Label>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {imagePreviews.map((preview, index) => (
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
                            onClick={() => removeImage(index)}
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
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || loadingServices}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
