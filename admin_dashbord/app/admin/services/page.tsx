'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchServices } from '@/lib/redux/slices/serviceSlice';
import { Service } from '@/types/service';
import dynamic from 'next/dynamic';
const ServiceTable = dynamic(() => import('@/app/page/service-table'), { ssr: false });
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Plus ,ArrowLeft ,RefreshCcw} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchCategories } from '@/lib/redux/slices/categorySlice';
import SpinnerComponent from '@/app/page/common/Spinner';

export default function Page() {
  const dispatch = useAppDispatch();
  const { loading ,total} = useAppSelector((state) => state.services);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { categories } = useAppSelector((state) => state.categories);

  const router = useRouter();

  useEffect(() => {
    dispatch(fetchCategories({ page: 1, limit:100 }));
  }, [dispatch]);

  const handleCreateNew = () => {
    // navigate to dedicated create page instead of opening modal
    router.push('/admin/services/create');
  };

  const handleEdit = (service: Service) => {
    const serviceId = (service as any)._id || (service as any).id;
    router.push(`/admin/services/create?edit=${serviceId}`);
  };

  const handleRefresh = () => {
    dispatch(fetchServices({ page: 1, limit: 10 }));
  };

  return (
    <div className="bg-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className='flex gap-2 justify-center items-center'>
          <Button variant="ghost" className="cursor-pointer hover:bg-transparent">
            <ArrowLeft className="h-6 w-6 inline-block mr-2 text-blue-600 cursor-pointer" onClick={() => router.push('/admin/dashboard')} />
          </Button>
          <div className='flex flex-col'>             
            <CardTitle className="text-">Service Management {total === 0 ? "" : "Total:" + `_${total}`}</CardTitle>
            <CardDescription className="text-base"> 
              Manage your services, pricing, and categories
            </CardDescription>
          </div>
        </div>
        
        <div className="flex gap-2">
          <RefreshCcw className="h-6 w-6 text-gray-500 inline-block mr-2 cursor-pointer" onClick={handleRefresh} />
          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.filter(cat => cat.status === 'active').map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Service
          </Button>
        </div>
      </div>

      <div className="pt-4">
        {loading && (
          <div className="mb-2">
            <SpinnerComponent />
          </div>
        )}
        <ServiceTable onEdit={handleEdit} categoryFilter={categoryFilter} />
      </div>
    </div>
  );
}
