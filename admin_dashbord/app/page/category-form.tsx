'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { createCategory, updateCategory } from '@/lib/redux/slices/categorySlice';
import { Category, CategoryFormData } from '@/types/service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

// Validation schema
const categorySchema = z.object({
  name: z.string().min(2, { message: 'Category name must be at least 2 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
});

interface CategoryFormProps {
  category?: Category | null;
  onSuccess?: () => void;
}

export default function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { loading } = useAppSelector((state) => state.categories);

  const form = useForm<Omit<CategoryFormData, 'status'>>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          description: category.description,
        }
      : {
          name: '',
          description: '',
        },
  });

  const onSubmit = async (data: Omit<CategoryFormData, 'status'>) => {
    try {
      if (category) {
        await dispatch(updateCategory({ _id: category._id, data })).unwrap();
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        await dispatch(createCategory(data)).unwrap();
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || (category ? 'Failed to update category' : 'Failed to create category'),
        variant: 'destructive',
      });
      console.error('Failed to save category:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} className="bg-muted/30" />
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
                <Textarea
                  placeholder="Enter category description"
                  className="resize-none min-h-[120px] bg-muted/30"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a clear description of what this category represents
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : category ? (
              'Update Category'
            ) : (
              'Create Category'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
