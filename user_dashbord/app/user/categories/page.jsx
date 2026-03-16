'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchCategories } from '@/lib/redux/slices/categorySlice';
// Type imports removed because this file is plain JSX
import CategoryForm from '@/app/page/category-form';
import CategoryTable from '@/app/page/category-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus,} from 'lucide-react';
import Header from '@/app/page/common/header';


export default function Page() {
  const dispatch = useAppDispatch();
  const { loading, limit } = useAppSelector((state) => state.categories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory ] = useState(null);
  const { categories ,total } = useAppSelector((state) => state.categories);

  useEffect(() => {
    // CategoryTable handles fetching with server-side pagination
  }, [dispatch, categories.length]);

  const handleCreateNew = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    dispatch(fetchCategories({ page: 1, limit }));
  };


  return (
    <>
      <div className="">
        <Header 
          title="Category Management"
          description="Organize your services with categories"
          // removed `link` prop so the button uses `onButtonClick` to open the dialog
          linkText="Create Category"
          icon={<Plus />}
          onButtonClick={handleCreateNew}
          total={total}
        />
        <div className="border-none shadow-none">

          <div className="">
            <CategoryTable onEdit={handleEdit} />
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription>
                {selectedCategory
                  ? 'Update the category details below'
                  : 'Fill in the details to create a new category'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <CategoryForm category={selectedCategory} onSuccess={handleSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
