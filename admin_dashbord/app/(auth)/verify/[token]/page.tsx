"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle, Copy, Check, X, Calendar, DollarSign, Mail,  User, RefreshCw, Phone } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { useParams } from 'next/navigation';
import { showSuccessToast, showErrorToast } from '@/lib/toast-handler';

export default function ServiceVerificationPage() {
      const params = useParams();
      const rawToken = params.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  
 

  const [data, setData] = useState<any>(null);
  const [profileData , setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
  const [copied, setCopied] = useState(false);

  const cleanedToken = token ? decodeURIComponent(String(token)).replace(/^encoadedurl:?/i, '') : '';

  const verifyToken = async (token: string) => {
    try {
      setInitialLoading(true);
      const decoded = decodeURIComponent(token);
      const cleanedToken = decoded.replace(/^encoadedurl:?/i, '');
      
      // Replace with actual API call
      const response = await axiosInstance.post(`/verify_token`,{
        token: cleanedToken,
      });
      setData(response.data.data.assignedService);
      setProfileData(response.data.data.userProfile);
        
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired token');
      console.error('Verification failed:', err);
    } finally {
      setInitialLoading(false);
    }
  };

 

  const acceptService = async () => {
    if (!data) return;
    const id = data._id || data.id;
    setConfirmOpen(false);
    setConfirmAction(null);
    setLoading(true);
    
    try {
     
      const res = await axiosInstance.patch(`/accept-assigned-service/${id}`, { isaccepted: 'accepted' });
      const updated = res?.data?.data ?? { ...data, isaccepted: 'accepted' };
      setData(updated);
      showSuccessToast('Service accepted');
      
    
    } catch (err: any) {
      console.error('Accept failed:', err);
      showErrorToast(err?.response?.data?.message || 'Failed to accept service');
    } finally {
      setLoading(false);
    }
  };

  const rejectService = async () => {
    if (!data) return;
    const id = data._id || data.id;
    setConfirmOpen(false);
    setConfirmAction(null);
    setLoading(true);
    
    try {
      const res = await axiosInstance.patch(`/accept-assigned-service/${id}`, { isaccepted: 'rejected' });
      const updated = res?.data?.data ?? { ...data, isaccepted: 'rejected' };
      setData(updated);
      showSuccessToast('Service rejected');
      
    } catch (err: any) {
      console.error('Reject failed:', err);
      showErrorToast(err?.response?.data?.message || 'Failed to reject service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyToken(token as string);
    }
  }, [token]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      accepted: { label: 'Accepted', icon: CheckCircle2 },
      rejected: { label: 'Rejected', icon: XCircle },
      pending: { label: 'Pending', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className="gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No verification token provided</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Verifying your token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Service Assignment Verification
          </h1>
          <p className="text-muted-foreground">Review and respond to your service assignment</p>
        </div>

        {data && (
          <>
            {/* Status Banner */}
            {(data.isaccepted === 'accepted' || data.isaccepted === 'rejected') && (
              <Alert className="border-2">
                <div className="flex items-center gap-3">
                  {data.isaccepted === 'accepted' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <AlertDescription className="font-medium">
                    {data.isaccepted === 'accepted' 
                      ? 'You have accepted this service assignment. The client will be notified.'
                      : 'You have rejected this service assignment. The client will be notified.'}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Service Details */}
              <Card className="lg:col-span-2">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">{data.serviceName || 'Service Assignment'}</CardTitle>
                      <CardDescription>Complete service details and information</CardDescription>
                    </div>
                    {getStatusBadge(data.isaccepted)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">User Name</p>
                      </div>
                      <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md border">
                        {profileData?.firstName && profileData?.lastName ? `${profileData.firstName} ${profileData.lastName}` : '-'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Client Email</p>
                      </div>
                      <p className="text-sm bg-muted px-3 py-2 rounded-md border break-all">
                        {data.email || '-'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Price</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {data.price ? `$${data.price.toLocaleString()}` : '-'}
                      </p>
                    </div>
                     <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Phone</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {profileData?.phone || '-'}
                      </p>
                    </div>

                   

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Start Date</p>
                      </div>
                      <p className="text-sm bg-muted px-3 py-2 rounded-md border">
                        {data.start_date ? new Date(String(data.start_date)).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : '-'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Renewal Date</p>
                      </div>
                      <p className="text-sm bg-muted px-3 py-2 rounded-md border">
                        {data.renewal_date ? new Date(String(data.renewal_date)).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : '-'}
                      </p>
                    </div>
                  
                  </div>

                  {data.description && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                        <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg border">
                          {data.description}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Action Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Accept or reject this assignment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => {
                        setConfirmAction('accept');
                        setConfirmOpen(true);
                      }}
                      disabled={loading || data.isaccepted === 'accepted'}
                      className="w-full"
                      size="lg"
                    >
                      {loading && confirmAction === 'accept' ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Accept Service
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => {
                        setConfirmAction('reject');
                        setConfirmOpen(true);
                      }}
                      disabled={loading || data.isaccepted === 'rejected'}
                      variant="outline"
                      className="w-full "
                      size="lg"
                    >
                      {loading && confirmAction === 'reject' ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-5 w-5" />
                          Reject Service
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Service Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      <Badge variant="outline" className="capitalize">
                        {data.status || 'unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <span className="text-sm font-medium text-muted-foreground">Acceptance</span>
                      {getStatusBadge(data.isaccepted)}
                    </div>
                  </CardContent>
                </Card>

                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Billing Cycle</p>
                      </div>
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {data.cycle || '-'}
                      </Badge>
                    </div>
              </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent className="sm:max-w-md flex quickly flex-col gap-4" >
                <div className=''>
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    Confirm {confirmAction === 'accept' ? 'Accept' : 'Reject'}
                  </DialogTitle>
                  <DialogDescription className="text-base pt-2">
                    Are you sure you want to {confirmAction === 'accept' ? 'accept' : 'reject'} this service assignment? 
                    {confirmAction === 'accept' 
                      ? ' The client will be notified of your acceptance.' 
                      : ' This action will notify the client of your rejection.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className=" flex  sm:gap-0">
                  <div className=" flex flex-col sm:flex-row  sm:justify-end  w-full  sm:gap-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmOpen(false)}
                    className="w-full sm:w-auto "
                  >
                    Cancel
                  </Button>
                 
                  <Button
                    onClick={() => {
                      if (confirmAction === 'accept') acceptService();
                      else if (confirmAction === 'reject') rejectService();
                    }}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                   
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Confirm ${confirmAction === 'accept' ? 'Accept' : 'Reject'}`
                    )}
                  </Button>
                  </div>
                 
                </DialogFooter>
                  </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}