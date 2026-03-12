'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Camera,
  Loader2,
  User,
  Mail,
  Globe,
  Briefcase,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { motion,  } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { updateProfile, clearUpdateSuccess, fetchProfileByEmail, createProfile } from '@/lib/redux/slices/profileSlice';
import { useToast } from '@/hooks/use-toast';
import { RegionDropdown } from 'react-country-region-selector';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl,  FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { getMee } from "@/lib/redux/slices/meeSlice";
import { format } from 'date-fns';
import { useRouter, usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { COUNTRIES } from '@/lib/countries';

const profileSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  middleName: z.string().optional(),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().nullable(),
  phone: z.string().regex(/^\+?[\d\s-]+$/, { message: 'Please enter a valid phone number' }).optional().or(z.literal('')),
  gender: z.string().optional(),
  dob: z.string().optional().refine((v) => {
    if (!v) return true;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) { age--; }
    return age >= 17;
  }, { message: 'You must be at least 17 years old' }),
  doj: z.string().optional(),
  bio: z.string().max(500, { message: 'Bio must be less than 500 characters' }).optional(),
  website: z.string().url({ message: 'Please enter a valid URL' }).or(z.literal('')).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  position: z.string().min(2, { message: 'Position must be at least 2 characters' }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileUpdateForm() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { loading, profile: data } = useAppSelector((state) => state.profile);
  const pd = data as any;
  const { data: meeData } = useAppSelector((state) => state.mee);
  const router = useRouter();
  const pathname = usePathname();

  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dobOpen, setDobOpen] = useState(false);
  const [dojOpen, setDojOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [dojDate, setDojDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (meeData?.email)
       dispatch(fetchProfileByEmail(meeData.email));
  }, [dispatch, meeData?.email]);

  useEffect(() => {
    if (!meeData) dispatch(getMee());
  }, [dispatch, meeData]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      dob: '',
      doj: '',
      bio: '',
      website: '',
      country: '',
      state: '',
      city: '',
      position: '',
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        firstName: pd.firstName || '',
        middleName: pd.middleName || '',
        lastName: pd.lastName || '',
        email: meeData?.email || pd.email || '',
        phone: pd.phone || '',
        gender: pd.gender || '',
        dob: pd.dob || '',
        doj: pd.doj || '',
        bio: pd.bio || '',
        website: pd.website || '',
        country: pd.country || '',
        state: pd.state || '',
        city: pd.city || '',
        position: pd.position || '',
      });
      if (data.profile_image) setImagePreview(data.profile_image);
      if (pd.dob) setDate(new Date(pd.dob));
      if (pd.doj) setDojDate(new Date(pd.doj));
    }
  }, [data, meeData, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (formData: ProfileFormData) => {
    try {
      const email = meeData?.email || formData.email || '';
      const fd = new FormData();
      Object.entries({ ...formData, email }).forEach(([key, value]) => {
        if (value) fd.append(key, String(value));
      });
      if (imageFile) fd.append('profile_image', imageFile);

      if (pd?._id) {
        await dispatch(updateProfile({ id: String(pd._id), formData: fd as any })).unwrap();
        toast({ title: 'Success', description: 'Profile updated' });
      } else {
        await dispatch(createProfile(fd as any)).unwrap();
        toast({ title: 'Success', description: 'Profile created' });
      }

      setTimeout(() => dispatch(clearUpdateSuccess()), 3000);
      if (pathname === '/profile') setTimeout(() => router.push('/admin/dashboard'), 2000);
    } catch (error: any) {
      toast({ title: 'Error', description: error || 'Failed to save', variant: 'destructive' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="  bg-card overflow-hidden">
            <div className="h-24 " />
            <CardContent className="relative pt-0">
              <div className="flex flex-col items-center -mt-12">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-background  transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={imagePreview} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-muted">
                      {form.watch('firstName')?.[0] || <User className="w-12 h-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer  hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-foreground">
                    {form.watch('firstName')} {form.watch('lastName')}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">{form.watch('position') || 'Role not set'}</p>
                </div>

                <Separator className="my-6" />

                <div className="w-full space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span>{meeData?.email || 'No email set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span>{form.watch('position') || 'Position pending'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className=" bg-primary/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-primary">Profile Completeness</h4>
            </div>
            <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden mt-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: pd?._id ? '100%' : '40%' }}
                className="h-full bg-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {pd?._id ? 'Your profile is looking great!' : 'Complete your details to access all features.'}
            </p>
          </Card> */}
        </div>

        {/* Right Column: Main Form */}
        <div className="lg:col-span-8">
          <Card className="  bg-card">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                  {/* Personal Information */}
                  <motion.div variants={sectionVariants} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Personal Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} className="bg-muted/50  focus:bg-background transition-all" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} className="bg-muted/50  focus:bg-background transition-all" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl className="w-full">
                                <SelectTrigger className="bg-muted/50 ">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Keep Private</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover open={dobOpen} onOpenChange={setDobOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn("justify-between font-normal bg-muted/50 ", !date && "text-muted-foreground")}>
                                    {date ? format(date, "PPP") : "Select date"}
                                    <CalendarIcon className="w-4 h-4 ml-2 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={date}
                                  onSelect={(d) => {
                                    setDate(d);
                                    if (d) field.onChange(d.toISOString().split('T')[0]);
                                    setDobOpen(false);
                                  }}
                                  disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Professional Information */}
                  <motion.div variants={sectionVariants} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Professional Info</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Creative Director" {...field} className="bg-muted/50 " />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="doj"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Join Date</FormLabel>
                            <Popover open={dojOpen} onOpenChange={setDojOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn("justify-between font-normal bg-muted/50 ", !dojDate && "text-muted-foreground")}>
                                    {dojDate ? format(dojDate, "PPP") : "Select date"}
                                    <CalendarIcon className="w-4 h-4 ml-2 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={dojDate}
                                  onSelect={(d) => {
                                    setDojDate(d);
                                    if (d) field.onChange(d.toISOString().split('T')[0]);
                                    setDojOpen(false);
                                  }}
                                  disabled={(d) => d > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your professional journey..."
                              className="bg-muted/50  resize-none min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <div className="text-[10px] text-right text-muted-foreground">
                            {field.value?.length || 0}/500 characters
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <Separator />

                  {/* Contact & Social */}
                  <motion.div variants={sectionVariants} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Phone className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Contact & Social</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 234 567 890" {...field} className="bg-muted/50 " />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portfolio / Website</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="https://portfolio.com" {...field} className="pl-9 bg-muted/50 " />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Location Information */}
                  <motion.div variants={sectionVariants} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Location</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select
                              onValueChange={(val) => { field.onChange(val); form.setValue('state', ''); }}
                              value={field.value}
                            >
                              <FormControl className=' w-full'>
                                <SelectTrigger className="bg-muted/50 ">
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {COUNTRIES.map((c, i) => (
                                  <SelectItem key={i} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                              <RegionDropdown
                                country={form.watch('country') || ''}
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="flex h-10 w-full rounded-md  bg-muted/50 px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
                                disabled={!form.watch('country')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="San Francisco" {...field} className="bg-muted/50 " />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-4 pt-10 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="min-w-[200px] h-11 "
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          {pd?._id ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Update Profile</>
                          ) : (
                            'Save Profile Information'
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
