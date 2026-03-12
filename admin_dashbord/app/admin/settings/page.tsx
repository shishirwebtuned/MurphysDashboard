"use client"

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchSiteSettings, updateSiteSettings } from '@/lib/redux/slices/siteSettingSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import ImageUploadField from '@/app/page/serviceImage'
import Header from '@/app/page/common/header'



const formSchema = z.object({
  appName: z.string().min(2).default('Murphy\'s Admin'),
  description: z.string().default(''),
  contactEmail: z.string().email().or(z.literal('')).default(''),
  contactPhone: z.string().default(''),
  address: z.string().default(''),
  footerText: z.string().default(''),
  currency: z.string().default('USD'),
  socialLinks: z.object({
    facebook: z.string().default(''),
    twitter: z.string().default(''),
    linkedin: z.string().default(''),
    instagram: z.string().default(''),
  }).default(() => ({
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',
  })),
  maintenanceMode: z.boolean().default(false),
  publicid: z.string().default(''),
})

type FormValues = z.infer<typeof formSchema>

export default function SiteSettingsPage() {
  const dispatch = useAppDispatch()
  const { settings, loading, updating } = useAppSelector((state) => state.siteSettings)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      footerText: '',
      currency: '',
      socialLinks: {
        facebook: '',
        twitter: '',
        linkedin: '',
        instagram: '',
      },
      maintenanceMode: false,
      publicid: '',
    },
  })

  useEffect(() => {
    dispatch(fetchSiteSettings())
  }, [dispatch])

  useEffect(() => {
    if (settings) {
      form.reset({
        appName: settings.appName || '',
        description: settings.description || '',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        address: settings.address || '',
        footerText: settings.footerText || '',
        currency: settings.currency || 'USD',
        socialLinks: {
          facebook: settings.socialLinks?.facebook || '',
          twitter: settings.socialLinks?.twitter || '',
          linkedin: settings.socialLinks?.linkedin || '',
          instagram: settings.socialLinks?.instagram || '',
        },
        maintenanceMode: settings.maintenanceMode || false,
        publicid: settings.publicid || '',
      })
      setLogoPreview(settings.logo || '')
      setLogoFile(null)
    }
  }, [settings, form])

  async function onSubmit(data: FormValues) {
    try {
      const formData = new FormData()
      Object.keys(data).forEach(key => {
        if (key === 'logo') return; // Always skip logo string, handled by file
        if (key === 'socialLinks') {
          formData.append(key, JSON.stringify(data[key as keyof FormValues]))
        } else {
          formData.append(key, data[key as keyof FormValues] as string)
        }
      })
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      await dispatch(updateSiteSettings(formData)).unwrap()
      toast({
        title: "Settings updated",
        description: "Your site settings have been updated successfully.",
      })
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive"
      })
    }
  }

  if (loading && !settings) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
    <Header title="Site Settings" description="Manage your application's site settings." />
    <div className="space-y-6 p-6">

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Basic details about your application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Murphys SaaS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A brief description of your site..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Code</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How users can reach you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="support@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Links to your social profiles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="socialLinks.facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="socialLinks.twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter (X)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="socialLinks.linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  <FormField
                  control={form.control}
                  name="socialLinks.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>Branding & Footer</CardTitle>
                <CardDescription>Logo and footer configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Logo</label>
                  <ImageUploadField
                    imageFile={logoFile}
                    setImageFile={setLogoFile}
                    imagePreview={logoPreview}
                    setImagePreview={setLogoPreview}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="footerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Text</FormLabel>
                      <FormControl>
                        <Input placeholder="© 2024 All rights reserved." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>System</CardTitle>
                <CardDescription>System-wide settings.</CardDescription>
              </CardHeader>
              <CardContent>
                 <FormField
                  control={form.control}
                  name="maintenanceMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Maintenance Mode</FormLabel>
                        <FormDescription>
                          Temporarily disable the public facing site.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Button type="submit" disabled={updating}>
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
    </>
  )
}