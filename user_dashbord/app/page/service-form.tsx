'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchCategories } from '@/lib/redux/slices/categorySlice';
import { createService, updateService } from '@/lib/redux/slices/serviceSlice';
import { Service } from '@/types/service';
import { useToast } from '@/hooks/use-toast';
import { CurrencyItem } from '@/lib/currencies';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Loader2, X, Plus, Tag, Percent, Calendar } from 'lucide-react';
import ImageUploadField from '@/app/page/serviceImage';


/* ---------------- VALIDATION ---------------- */

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be positive'),
  currency: z.string().min(1, 'Select currency'),
  billingType: z.enum(['one_time', 'monthly', 'yearly', 'pay_as_you_go']),
  categoryId: z.string().min(1, 'Select category'),
  categoryName: z.string().min(1, 'Category name is required'),
  
  // New fields
  hasDiscount: z.boolean().default(false),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  discountReason: z.string().optional(),
  discountStartDate: z.string().optional(),
  discountEndDate: z.string().optional(),
  
  tags: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().default(false),
  durationInDays: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service?: Service | null;
  onSuccess?: () => void;
}

/* ---------------- COMPONENT ---------------- */

export default function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([
    { code: 'AUD', name: 'Australian Dollar', icon: 'A$' },
  ]);
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const { categories, loading: categoriesLoading } = useAppSelector(
    (state) => state.categories
  );

  const { loading } = useAppSelector((state) => state.services);

  const form = useForm<any>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description,
          price: service.price,
          currency: service.currency ?? 'AUD',
          billingType: service.billingType,
          categoryId: service.categoryId,
          categoryName: service.categoryName,
          hasDiscount: service.hasDiscount ?? false,
          discountType: service.discountType ?? 'percentage',
          discountValue: service.discountValue ?? 0,
          discountReason: service.discountReason ?? '',
          discountStartDate: service.discountStartDate ?? '',
          discountEndDate: service.discountEndDate ?? '',
          tags: service.tags ?? [],
          features: service.features ?? [],
          isFeatured: service.isFeatured ?? false,
          durationInDays: service.durationInDays,
          notes: service.notes ?? '',
        }
      : {
          name: '',
          description: '',
          price: 0,
          currency: 'AUD',
          billingType: 'one_time',
          categoryId: '',
          categoryName: '',
          hasDiscount: false,
          discountType: 'percentage',
          discountValue: 0,
          discountReason: '',
          discountStartDate: '',
          discountEndDate: '',
          tags: [],
          features: [],
          isFeatured: false,
          notes: '',
        },
  });

  const hasDiscount = form.watch('hasDiscount');
  const discountType = form.watch('discountType');
  const price = form.watch('price');
  const discountValue = form.watch('discountValue');

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!hasDiscount || !discountValue) return price;
    
    if (discountType === 'percentage') {
      return price - (price * discountValue / 100);
    } else {
      return price - discountValue;
    }
  };

  // Fetch categories and custom currencies
  useEffect(() => {
    dispatch(fetchCategories({ page: 1, limit: 10 }));
  }, [dispatch]);

  // If editing an existing service, set image preview from service data
  useEffect(() => {
    if (service) {
      const src = (service as any).image || (service as any).imageUrl || (service as any).profile_image || '';
      if (src) {
        setImagePreview(src);
        setImageFile(null);
      }
    }
  }, [service]);

  

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags: string[] = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter((tag: string) => tag !== tagToRemove));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      const currentFeatures = form.getValues('features') || [];
      form.setValue('features', [...currentFeatures, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures: string[] = form.getValues('features') || [];
    form.setValue('features', currentFeatures.filter((_: string, i: number) => i !== index));
  };

  const onSubmit = async (data: any) => {
    try {
      // Build FormData to include image binary when present
      const formData = new FormData();
      // append simple fields
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', String(data.price ?? 0));
      formData.append('currency', data.currency ?? 'AUD');
      formData.append('billingType', data.billingType ?? 'one_time');
      formData.append('categoryId', data.categoryId ?? '');
      formData.append('categoryName', data.categoryName ?? '');
      formData.append('hasDiscount', String(data.hasDiscount ?? false));
      if (data.discountType) formData.append('discountType', data.discountType);
      if (data.discountValue !== undefined) formData.append('discountValue', String(data.discountValue));
      if (data.discountReason) formData.append('discountReason', data.discountReason);
      if (data.discountStartDate) formData.append('discountStartDate', data.discountStartDate);
      if (data.discountEndDate) formData.append('discountEndDate', data.discountEndDate);
      formData.append('isFeatured', String(data.isFeatured ?? false));
      if (data.durationInDays !== undefined) formData.append('durationInDays', String(data.durationInDays));
      if (data.notes) formData.append('notes', data.notes);
      // arrays as JSON
      formData.append('tags', JSON.stringify(data.tags || []));
      formData.append('features', JSON.stringify(data.features || []));
      // append image file if present
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (service) {
        const _id = (service as any)._id || (service as any).id;
        await dispatch(updateService({ _id, data: formData })).unwrap();
        toast({ title: 'Success', description: 'Service updated successfully' });
      } else {
        await dispatch(createService(formData)).unwrap();
        toast({ title: 'Success', description: 'Service created successfully' });
      }

      form.reset();
      setImageFile(null);
      setImagePreview('');
      onSuccess?.();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save service',
        variant: 'destructive',
      });
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <>
   
    <Form {...form}  >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 "> 

        {/* Service Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter service name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter service description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <ImageUploadField
          imageFile={imageFile}
          setImageFile={setImageFile}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl className=' w-full'>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="max-h-[300px]">
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{currency.icon}</span>
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-muted-foreground text-sm">
                            {currency.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Billing Type */}
          <FormField
            control={form.control}
            name="billingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl className=' w-full'>
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="pay_as_you_go">Pay as you go</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const selectedCategory = categories.find(cat => cat._id === value);
                    field.onChange(value);
                    if (selectedCategory) {
                      form.setValue('categoryName', selectedCategory.name);
                    }
                  }}
                  disabled={categoriesLoading}
                >
                  <FormControl className=' w-full'>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category">
                        {field.value ? categories.find(cat => cat._id === field.value)?.name || 'Select category' : 'Select category'}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.filter(cat => cat.status === 'active').map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {categoriesLoading && 'Loading categories...'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* DISCOUNT SECTION */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Discount Settings</h3>
            </div>
            <FormField
              control={form.control}
              name="hasDiscount"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="!mt-0">Enable Discount</FormLabel>
                  <FormControl  >
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {hasDiscount && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl className=' w-full'>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount Value {discountType === 'percentage' ? '(%)' : ''}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={discountType === 'percentage' ? '100' : undefined}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="discountReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Reason (e.g., "New Year Sale", "Black Friday")</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter discount reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {discountValue > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm font-medium text-green-900">
                    Discounted Price: {form.watch('currency')} {calculateDiscountedPrice().toFixed(2)}
                    <span className="text-green-600 ml-2">
                      (Save {discountType === 'percentage' 
                        ? `${discountValue}%` 
                        : `${form.watch('currency')} ${discountValue}`})
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TAGS SECTION */}
        <div className="space-y-3">
          <FormLabel className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add tags (e.g., Popular, Premium, Limited)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.watch('tags')?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* FEATURES SECTION */}
        <div className="space-y-3">
          <FormLabel>Service Features</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add feature (e.g., 24/7 Support, Free Updates)"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <Button type="button" onClick={addFeature} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="space-y-2">
            {form.watch('features')?.map((feature: string, index: number) => (
              <li key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                <span className="text-sm">• {feature}</span>
                <X
                  className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive"
                  onClick={() => removeFeature(index)}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* DURATION */}
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="durationInDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Days)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="Optional" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  For time-limited services
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* FEATURED TOGGLE */}
        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormLabel className="!mt-0">Featured</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* NOTES */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any internal notes or reminders"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                These notes are for internal use only
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {service ? 'Update Service' : 'Create Service'}
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}