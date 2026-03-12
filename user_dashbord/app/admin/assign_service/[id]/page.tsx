'use client';
import React from 'react'
import { useParams, useRouter } from 'next/navigation';
import Header from '@/app/page/common/header';
import axiosInstance from '@/lib/axios';
import { showErrorToast } from '@/lib/toast-handler';
import { useState } from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AppDispatch } from '@/lib/redux/store';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchCategories } from '@/lib/redux/slices/categorySlice';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DateRangePicker from '@/components/ui/date-range-picker';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import SpinnerComponent from '@/app/page/common/Spinner';

import { assignServiceToClient, fetchServices } from '@/lib/redux/slices/serviceSlice';

interface PageProps {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  service_catalog_id?: string;
  total?: number;
  page?: number;
  limit?: number;
}

function page() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const dispatch = useAppDispatch();
  const {services , loading } = useAppSelector((state) => state.services);

  console.log('Services from Redux:', services);
  
  // FIX: Handle the nested array structure
  // Access the actual services array - it could be services[0] or services.services
  const servicesList = React.useMemo(() => {
    if (!services) return [];
    
    // If services is an array with nested array structure
    if (Array.isArray(services) && services.length > 0 && Array.isArray(services[0])) {
      return services[0];
    }
    
    // If services is an object wrapping the array (e.g. { services: [...] })
    if (
      services &&
      typeof services === 'object' &&
      !Array.isArray(services) &&
      'services' in services &&
      Array.isArray((services as any).services)
    ) {
      return (services as any).services as any[];
    }
    
    // If services is already a flat array
    if (Array.isArray(services)) {
      return services;
    }
    
    return [];
  }, [services]);

  console.log('Processed services list:', servicesList);

  const clientId = Array.isArray(id) ? id[0] : id ?? null;

  // client id comes from route params (prefill)
  const [selectedClient, setSelectedClient] = React.useState<string | null>(clientId);
  const [selectedService, setSelectedService] = React.useState<string | null>(null);
  const [assignStatus, setAssignStatus] = React.useState<'active' | 'paused' | 'cancelled'>('active');
  const [assignCycle, setAssignCycle] = React.useState<'monthly' | 'annual' | 'none'>('monthly');
  const [assignStartDate, setAssignStartDate] = React.useState<string>('');
  const [assignRenewalDate, setAssignRenewalDate] = React.useState<string | null>(null);
  const [assignPrice, setAssignPrice] = React.useState<number | undefined>(undefined);
  const [assignAutoInvoice, setAssignAutoInvoice] = React.useState<boolean>(false);
  const [assignNotes, setAssignNotes] = React.useState<string>('');
  const [assignEndDate, setAssignEndDate] = React.useState<string | null>(null);
  
  const handleAssignSubmit = async () => {
    // Validate required fields
    if (!selectedClient) {
      showErrorToast('Client is required');
      return;
    }
    if (!selectedService) {
      showErrorToast('Service is required');
      return;
    }
    if (assignPrice == null || assignPrice === undefined) {
      showErrorToast('Price is required');
      return;
    }
    if (!assignCycle || assignCycle === 'none') {
      showErrorToast('Cycle is required');
      return;
    }

    try {
      const svc = servicesList.find((s: any) => (s._id || s.id) === selectedService) || {};
      const payload = {
        id: typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`,
        client_id: selectedClient,
        service_catalog_id: selectedService,
        categoryId: svc.categoryId || svc.categoryId || null,
        status: assignStatus,
        cycle: assignCycle,
        start_date: assignStartDate,
        end_date: assignEndDate,
        price: assignPrice,
        auto_invoice: assignAutoInvoice,
        notes: assignNotes,
      } as any;

      const response = await dispatch(assignServiceToClient(payload)).unwrap();
      if (response) {
        router.push('/admin/view_assign_service');
      }
      // Success handling (axios interceptor will show toast)
    } catch (error) {
      console.error('Error assigning service:', error); 
      // Error toast shown by axios interceptor
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/profiles/${id}`);
        const profileData = response.data?.data || response.data;
        setData(profileData);
        console.log('Fetched profile data:', profileData);
      }
      catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, [id]);

  React.useEffect(() => {
    dispatch(fetchServices({ page: 1, limit: 100 }));
  }, [dispatch]);

  // FIX: Update selectedServiceName to use servicesList
  const selectedServiceName = React.useMemo(() => {
    if (!servicesList || servicesList.length === 0) return null;
    const service = servicesList.find((s: any) => (s._id || s.id) === selectedService);
    if (!service) return null;
    const currency = service.currency || service.currencyCode || '';
    return `${service.name} • ${service.price != null ? service.price : ''} ${currency}`.trim();
  }, [servicesList, selectedService]);

  // When user selects a service, prefill the assign price with the service's base price
  React.useEffect(() => {
    if (!selectedService) return;
    const svc = servicesList.find((s: any) => (s._id || s.id) === selectedService);
    if (svc && typeof svc.price === 'number') {
      setAssignPrice(svc.price);
    }
  }, [selectedService, servicesList]);


  return (
    <>
      {loading ? (
        <SpinnerComponent />
      ) : (
        <>
          <Header
            title="Assign Service"
            description="Assign services to clients"
            link="/admin/get_all_users"
            linkText="Go to users list"
          />

          <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-lg border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Assign Service to Client</h2>
          <p className="text-muted-foreground">Fill details for assigning this service to a client</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className=' pb-2'>Client</Label>
            <div className="p-2 bg-muted rounded">
              {data ? `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email || 'Client' : 'Loading...'}
            </div>
          </div>

          <div className="mt-3">
            <Label className=' pb-2'>Service</Label>
            <Select value={selectedService || ''} onValueChange={(v) => setSelectedService(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a service">
                  {selectedServiceName || undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {servicesList && servicesList.length > 0 ? (
                  servicesList.map((service: any) => (
                    <SelectItem key={service._id || service.id} value={service._id || service.id}>
                      <div className="flex justify-between w-full">
                        <span className="truncate">{service.name}</span>
                        <span className="text-sm text-muted-foreground">{service.price != null ? `${service.price} ${service.currency || ''}` : ''}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No services available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className=' pb-2'>Status</Label>
              <Select value={assignStatus} onValueChange={(v) => setAssignStatus(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className=' pb-2'>Cycle</Label>
              <Select value={assignCycle} onValueChange={(v) => setAssignCycle(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className=' pb-2'>Start / End date</Label>
            <DateRangePicker
              value={{ from: assignStartDate || null, to: assignEndDate || null }}
              onChange={(v) => {
                setAssignStartDate(v.from || '');
                setAssignEndDate(v.to || null);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className=' pb-2'>Price (override)</Label>
              <Input type="number" value={assignPrice ?? ''} onChange={(e) => setAssignPrice(e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="flex flex-col">
              <Label className=' pb-2'>Auto invoice</Label>
              <div className="mt-2">
                <Switch checked={assignAutoInvoice} onCheckedChange={(v) => setAssignAutoInvoice(Boolean(v))} />
              </div>
            </div>
          </div>

          <div>
            <Label className=' pb-2'>Notes (internal)</Label>
            <Textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleAssignSubmit}>Assign</Button>
          </div>
        </div>
          </div>
        </>
      )}
    </>
  )
}

export default page