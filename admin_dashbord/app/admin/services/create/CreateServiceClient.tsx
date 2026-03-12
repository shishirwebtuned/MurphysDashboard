"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ServiceForm from '@/app/page/service-form';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/app/page/common/header';
import { ArrowLeft } from 'lucide-react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { fetchServiceById } from '@/lib/redux/slices/serviceSlice';
import { Service } from '@/types/service';
import SpinnerComponent from '@/app/page/common/Spinner';

export default function CreateServiceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const editId = searchParams.get('edit');
  
  const [editService, setEditService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      dispatch(fetchServiceById(editId))
        .unwrap()
        .then((service) => {
          setEditService(service);
        })
        .catch((error) => {
          console.error('Failed to fetch service:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [editId, dispatch]);

  const handleSuccess = () => {
    router.push('/admin/services');
  };

  const isEditMode = !!editId;

  return (
    <> 
     <Header 
      title={isEditMode ? "Edit Service" : "Create Service"}
      description={isEditMode ? "Update the service details below" : "Fill in the details to create a new service"}
      link="/admin/services"
      linkText="View Services List"
      icon={<ArrowLeft />}
      onButtonClick={() => router.push('/admin/services')}
    />
      <div className="">
      <Card>
        <CardContent>
          {loading ? (
            <div className="py-8">
              <SpinnerComponent />
            </div>
          ) : (
            <ServiceForm service={isEditMode ? editService : null} onSuccess={handleSuccess} />
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
