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
  Info,
  CheckCircle2,
} from 'lucide-react';
import { motion, } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { updateProfile, clearUpdateSuccess, createProfile } from '@/lib/redux/slices/profileSlice';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { getMee } from "@/lib/redux/slices/meeSlice";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { useRouter, usePathname } from 'next/navigation';
import { COUNTRIES } from '@/lib/countries';

const profileSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  middleName: z.string().optional(),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().nullable(),
  countryCode: z.string().optional(),
  phone: z.string().optional().refine((v) => {
    if (!v) return true;
    const digits = v.replace(/\D/g, '');
    // Accept international numbers: require between 7 and 15 digits (basic check)
    return digits.length >= 7 && digits.length <= 15;
  }, { message: 'Please enter a valid phone number with country code (e.g. +61 412 345 678)' }),
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
  referralSource: z.string().optional(),
  bio: z.string().max(500, { message: 'Bio must be less than 500 characters' }).optional(),
  website: z.string().url({ message: 'Please enter a valid URL' }).or(z.literal('')).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileUpdateForm() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { data: meeData, loading } = useAppSelector((state) => state.mee);

  // Extract profile data from meeData
  const pd = meeData;
  const userEmail = meeData?.email;
  console.log('email', userEmail)
  const router = useRouter();
  const pathname = usePathname();

  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dobOpen, setDobOpen] = useState(false);
  const [countryCallingCodes, setCountryCallingCodes] = useState<Array<any>>([]);
  const [countrySearch, setCountrySearch] = useState<string>('');


  useEffect(() => {
    if (!meeData) dispatch(getMee());
  }, [dispatch, meeData]);


  console.log('meeData in profile form:', pd);
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: '+61',
      gender: '',
      dob: '',
      referralSource: '',
      bio: '',
      website: '',
      country: '',
      state: '',
      city: '',
    },
  });

  useEffect(() => {
    if (meeData) {
      form.reset({
        firstName: pd.firstName || '',
        middleName: pd.middleName || '',
        lastName: pd.lastName || '',
        email: userEmail || '',
        phone: pd.phone || '',
        countryCode: pd.countryCode || '+61',
        gender: pd.gender || '',
        dob: pd.dob || undefined,
        referralSource: pd.referralSource || '',
        bio: pd.bio || '',
        website: pd.website || '',
        country: pd.country || '',
        state: pd.state || '',
        city: pd.city || '',
      });
      if (pd.profile_image) setImagePreview(pd.profile_image);
    }
  }, [meeData, pd, userEmail, form]);


  // Fetch country calling codes from public API (restcountries)
  useEffect(() => {
    let mounted = true;
    const fetchCodes = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=idd,name,cca2');
        if (!res.ok) return;
        const arr = await res.json();
        const codes: any[] = [];
        arr.forEach((c: any) => {
          const root = c?.idd?.root;
          const suffixes = Array.isArray(c?.idd?.suffixes) && c.idd.suffixes.length ? c.idd.suffixes : [''];
          if (root) {
            suffixes.forEach((s: string) => {
              const raw = `${root}${s}`;
              const formatted = raw.startsWith('+') ? raw : `+${raw}`;
              codes.push({ code: formatted, name: c?.name?.common || c?.cca2, iso2: c?.cca2 });
            });
          }
        });
        // dedupe by code
        const map = new Map<string, any>();
        codes.forEach((it) => { if (!map.has(it.code)) map.set(it.code, it); });
        const list = Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        if (mounted) {
          setCountryCallingCodes(list);
          // set a sensible default if none selected
          const current = form.getValues('countryCode');
          if (!current) {
            const au = list.find((x: any) => x.iso2 === 'AU');
            form.setValue('countryCode', au?.code || list[0]?.code || '+61');
          }
        }
      } catch (e) {
        // ignore
        console.error('Failed to fetch country codes', e);
      }
    };
    fetchCodes();
    return () => { mounted = false; };
  }, [form]);

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
      const email = userEmail || formData.email || '';
      // combine country code and phone into a single phone value for backend
      const code = (formData as any).countryCode || form.getValues('countryCode') || '';
      const phoneVal = formData.phone ? `${code} ${formData.phone}`.trim() : undefined;

      const payload: any = { ...formData, email };
      if (phoneVal) payload.phone = phoneVal;

      const fd = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) fd.append(key, String(value));
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
      if (pathname === '/profile') setTimeout(() => router.push('/user/dashboard'), 2000);
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


  // General phone formatter aware of selected country code
  const formatPhone = (value: string, countryCode = '+61') => {
    let digits = value.replace(/\D/g, '');

    // If Australian country code or local mobile, format as 04xx xxx xxx
    if (countryCode === '+61' || digits.startsWith('61') || digits.startsWith('04') || digits.startsWith('4')) {
      if (digits.startsWith('61')) digits = '0' + digits.slice(2);
      if (digits.length === 9 && digits.startsWith('4')) digits = '0' + digits;
      if (digits.length > 10) digits = digits.slice(0, 10);
      if (digits.length > 4 && digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      if (digits.length > 7) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
      return digits;
    }

    // Generic grouping: groups of 3 from start
    if (digits.length > 12) digits = digits.slice(0, 15);
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  }


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
          <Card className="  overflow-hidden">
            <div className="h-24 " />
            <CardContent className="relative pt-0">
              <div className="flex flex-col items-center -mt-12">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-background  transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={imagePreview} className="object-cover" />
                    <AvatarFallback className="text-4xl text-blue-500 bg-muted">
                      {form.watch('firstName')?.[0] || <User className="w-12 h-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold text-blue-500 ">
                    {form.watch('firstName')} {form.watch('lastName')}
                  </h2>
                  <p className="text-sm text-blue-500 font-medium">User Profile</p>
                </div>

                <Separator className="my-6" />

                <div className="w-full space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-4 text-blue-400  h-4" />
                    </div>
                    <span className="truncate text-blue-500">{userEmail || 'No email set'}</span>
                  </div>
                  {form.watch('referralSource') && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="truncate">Found via: {form.watch('referralSource')}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="bg-primary/5 p-6">
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
          <Card className=" bg-card">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                  {/* Personal Information */}
                  <motion.div variants={sectionVariants} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg text-blue-500 font-bold">Personal Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem >
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
                          <FormItem >
                            <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} className="bg-muted/50 border focus:bg-background transition-all" />
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
                          <FormItem >
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
                        render={({ field }) => {
                          const selectedDate = field.value ? new Date(field.value) : undefined;
                          return (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Birth</FormLabel>

                              <Popover open={dobOpen} onOpenChange={setDobOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "justify-between font-normal bg-muted/50",
                                      !selectedDate && "text-muted-foreground"
                                    )}
                                  >
                                    {selectedDate && !isNaN(selectedDate.getTime())
                                      ? format(selectedDate, "PPP")
                                      : "Select date"}
                                    <CalendarIcon className="w-4 h-4 ml-2 opacity-50" />
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    captionLayout="dropdown"
                                    selected={selectedDate}
                                    onSelect={(d: Date | undefined) => {
                                      if (d) {
                                        field.onChange(d.toISOString().split("T")[0]);
                                      } else {
                                        field.onChange(undefined);
                                      }
                                      setDobOpen(false);
                                    }}
                                    disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                                    fromYear={1900}
                                    toYear={new Date().getFullYear() - 17} // enforce 17+ age
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>

                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </motion.div>

                  <Separator />

                  {/* How did you find us */}
                  <motion.div variants={sectionVariants} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Info className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg text-blue-500 font-bold">About You</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="referralSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How did you find our service?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl className="w-full">
                              <SelectTrigger className="bg-muted/50 ">
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="search-engine">Search Engine (Google, Bing, etc.)</SelectItem>
                              <SelectItem value="social-media">Social Media</SelectItem>
                              <SelectItem value="friend-referral">Friend or Colleague Referral</SelectItem>
                              <SelectItem value="advertisement">Online Advertisement</SelectItem>
                              <SelectItem value="blog-article">Blog or Article</SelectItem>
                              <SelectItem value="youtube">YouTube</SelectItem>
                              <SelectItem value="email">Email Newsletter</SelectItem>
                              <SelectItem value="event">Event or Conference</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Help us understand how you discovered us
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About You</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us a bit about yourself..."
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
                      <h3 className="text-lg  text-blue-500 font-bold">Contact & Social</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      <FormField
                        control={form.control}
                        name="phone"

                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>

                            <FormControl>
                              <div className="flex items-center gap-3">
                                <div className="w-36">
                                  <Select value={form.watch('countryCode') || '+61'} onValueChange={(val) => form.setValue('countryCode', val)}>
                                    <SelectTrigger className="w-full bg-muted/50  text-sm pr-4">
                                      <SelectValue />
                                    </SelectTrigger>
                                    {/* Dropdown with search at top (sticky) */}
                                    <SelectContent className="p-0" position="popper" align="start">
                                      {/* Sticky search bar at top */}
                                      <div className="sticky top-0  bg-popover border-b border-border p-3">
                                        <Input
                                          placeholder="Search country or code..."
                                          value={countrySearch}
                                          onChange={(e) => setCountrySearch(e.target.value)}
                                          className="w-full bg-background text-sm py-2 rounded-md"
                                          onClick={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => e.stopPropagation()}
                                        />
                                      </div>

                                      {/* Scrollable country list */}
                                      <div className="max-h-64 overflow-y-auto p-1">
                                        {countryCallingCodes.length === 0 ? (
                                          <SelectItem value="+61">+61 (Default)</SelectItem>
                                        ) : (
                                          countryCallingCodes
                                            .filter((c) => {
                                              if (!countrySearch) return true;
                                              const q = countrySearch.toLowerCase();
                                              return String(c.name).toLowerCase().includes(q) || String(c.code).toLowerCase().includes(q) || String(c.iso2).toLowerCase().includes(q);
                                            })
                                            .map((c) => (
                                              <SelectItem key={c.code + c.iso2} value={c.code}>{c.code} ({c.name})</SelectItem>
                                            ))
                                        )}
                                        {countryCallingCodes.length > 0 &&
                                          countryCallingCodes.filter((c) => {
                                            if (!countrySearch) return true;
                                            const q = countrySearch.toLowerCase();
                                            return String(c.name).toLowerCase().includes(q) || String(c.code).toLowerCase().includes(q) || String(c.iso2).toLowerCase().includes(q);
                                          }).length === 0 && (
                                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                              No countries found
                                            </div>
                                          )}
                                      </div>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="412 345 678"
                                  inputMode="numeric"
                                  className="flex-1 bg-muted/50"
                                  onChange={(e) => {
                                    const raw = e.target.value || '';

                                    // Only detect country code if user types "+" at the start
                                    if (raw.startsWith('+') && countryCallingCodes && countryCallingCodes.length) {
                                      const normalized = raw.replace(/\s+/g, '');
                                      let matchedCode: string | undefined;

                                      // Try longest-first match (e.g. +1, +44, +965)
                                      const codesSorted = [...countryCallingCodes].sort((a, b) => b.code.length - a.code.length);
                                      for (const c of codesSorted) {
                                        const codeStr = String(c.code);
                                        if (normalized.startsWith(codeStr)) {
                                          matchedCode = codeStr;
                                          break;
                                        }
                                      }

                                      if (matchedCode) {
                                        // Extract phone number after the country code
                                        let remainder = normalized.slice(matchedCode.length);
                                        form.setValue('countryCode', matchedCode);
                                        const formatted = formatPhone(remainder, matchedCode);
                                        field.onChange(formatted);
                                        return;
                                      }
                                    }

                                    // Normal formatting without country code detection
                                    const code = form.getValues('countryCode') || '+61';
                                    const formatted = formatPhone(raw, code);
                                    field.onChange(formatted);
                                  }}
                                />
                              </div>
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
                                <Input placeholder="https://portfolio.com" {...field} className="pl-9 bg-muted/50" />
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
                      <h3 className="text-lg  text-blue-500 font-bold">Location</h3>
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
                      className="min-w-[200px] "
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
