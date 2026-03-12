'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchServices } from '@/lib/redux/slices/serviceSlice';
import { Service } from '@/types/service';
import dynamic from 'next/dynamic';
const ServiceTable = dynamic(() => import('@/app/page/service-table'), { ssr: false });

import { ArrowLeft, RefreshCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchCategories } from '@/lib/redux/slices/categorySlice';
import SpinnerComponent from '@/app/page/common/Spinner';
import Header from '@/app/page/common/header';

export default function Page() {
  const dispatch = useAppDispatch();
  const { loading, total } = useAppSelector((state) => state.services);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { categories } = useAppSelector((state) => state.categories);

  const router = useRouter();

  useEffect(() => {
    dispatch(fetchCategories({ page: 1, limit: 100 }));
    dispatch(fetchServices({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setSelectedService(null);
    dispatch(fetchServices({ page: 1, limit: 10 }));

  };

  const handleRefresh = () => {
    dispatch(fetchServices({ page: 1, limit: 10 }));
  };
  if (loading) {
    <SpinnerComponent />;
  }

  return (
    <>
      <div className="  bg-none   ">
        <Header 
          title=" View Services"
          description=" services, pricing, and categories"
          total={total}
          extra ={
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
              </div>

          }

        />
        <div className="">
        

          <div className="pt-4">
            <ServiceTable categoryFilter={categoryFilter} />
          </div>
        </div>
      </div>
    </>
  );
}
