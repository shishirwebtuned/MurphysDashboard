"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle, Check, X, Calendar, DollarSign, Mail, RefreshCw } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Replace these imports with your actual imports
import axiosInstance from '@/lib/axios';
import { useParams } from 'next/navigation';
import { showSuccessToast, showErrorToast } from '@/lib/toast-handler';

export default function ServiceVerificationPage() {
  const params = useParams();
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  // const token = "mock_token_123";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);

  // Normalize shapes: assignedService + userProfile OR legacy single object
  const assignedService = data?.assignedService ?? data;
  const userProfile = data?.userProfile ?? null;

  // Verify token and fetch data
  const verifyToken = async (token: string) => {
    try {
      setInitialLoading(true);
      const decoded = decodeURIComponent(token);
      const cleanedToken = decoded.replace(/^encoadedurl:?/i, '');

      // Replace with actual API call
      const response = await axiosInstance.post(`/verify_token/${cleanedToken}`);
      setData(response.data.data);

      
      // Mock data - remove this
      // await new Promise(resolve => setTimeout(resolve, 1000));
      // setData({
      //   _id: "srv_67890abcdef",
      //   email: "client@example.com",
      //   price: 2500,
      //   cycle: "Monthly",
      //   start_date: "2026-01-01T00:00:00.000Z",
      //   renewal_date: "2026-02-01T00:00:00.000Z",
      //   status: "active",
      //   isaccepted: "pending",
      //   serviceName: "Premium Web Development Package",
      //   description: "Full-stack web application development with React and Node.js"
      // });
    } catch (err) {
      setError('Failed to verify token. Please check the link and try again.');
      console.error('Verification failed:', err);
    } finally {
      setInitialLoading(false);
    }
  };


  const acceptService = async () => {
    if (!data) return;
    const id = data?.assignedService?._id ?? data?._id ?? data?.assignedService?.id ?? data?.id;
    setConfirmOpen(false);
    setConfirmAction(null);
    setLoading(true);

    try {
      const res = await axiosInstance.patch(`/accept-assigned-service/${id}`, { isaccepted: 'accepted' });
      const updatedAssigned = res?.data?.data ?? { ...(data?.assignedService ?? data), isaccepted: 'accepted' };

      if (data?.assignedService) {
        setData((prev: any) => ({ ...prev, assignedService: updatedAssigned }));
      } else {
        setData(updatedAssigned);
      }

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
    const id = data?.assignedService?._id ?? data?._id ?? data?.assignedService?.id ?? data?.id;
    setConfirmOpen(false);
    setConfirmAction(null);
    setLoading(true);

    try {
      const res = await axiosInstance.patch(`/reject-assigned-service/${id}`, { isaccepted: 'rejected' });
      const updatedAssigned = res?.data?.data ?? { ...(data?.assignedService ?? data), isaccepted: 'rejected' };

      if (data?.assignedService) {
        setData((prev: any) => ({ ...prev, assignedService: updatedAssigned }));
      } else {
        setData(updatedAssigned);
      }

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
      accepted: { label: 'Accepted', variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
      pending: { label: 'Pending', variant: 'secondary', icon: Clock, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1.5 ${config.className}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Alert variant="destructive" className="max-w-md shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No verification token provided</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">Verifying your token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Alert variant="destructive" className="max-w-md shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Service Assignment Verification
          </h1>
          <p className="text-muted-foreground text-lg">Review and respond to your service assignment</p>
        </div>

        {data && (
          <>
            {/* Status Banner */}
            {(assignedService?.isaccepted === 'accepted' || assignedService?.isaccepted === 'rejected') && (
              <Alert className={`border-2 shadow-lg ${
                assignedService?.isaccepted === 'accepted' 
                  ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
                  : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50'
              }`}>
                <div className="flex items-center gap-3">
                  {assignedService?.isaccepted === 'accepted' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <AlertDescription className={`font-medium ${
                    assignedService?.isaccepted === 'accepted' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {assignedService?.isaccepted === 'accepted' 
                      ? '✓ You have accepted this service assignment. The client will be notified.'
                      : '✗ You have rejected this service assignment. The client will be notified.'}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Service Details */}
              <Card className="lg:col-span-2 shadow-xl border-0 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-violet-500 h-2"></div>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">{assignedService?.serviceName || 'Service Assignment'}</CardTitle>
                      <CardDescription className="text-base">Complete service details and information</CardDescription>
                    </div>
                    {getStatusBadge(assignedService?.isaccepted)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
  
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Client Email</p>
                      </div>
                      <p className="text-base bg-slate-100 px-3 py-2 rounded-md border break-all">
                        {assignedService?.email || '-'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Price</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {assignedService?.price ? `$${String(assignedService.price)}` : '-'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Billing Cycle</p>
                      </div>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {assignedService?.cycle || '-'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <p className="text-xs font-medium uppercase tracking-wide">Start Date</p>
                      </div>
                      <p className="text-base bg-slate-100 px-3 py-2 rounded-md border">
                        {assignedService?.start_date ? new Date(String(assignedService.start_date)).toLocaleDateString('en-US', { 
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
                      <p className="text-base bg-slate-100 px-3 py-2 rounded-md border">
                        {assignedService?.renewal_date ? new Date(String(assignedService.renewal_date)).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : '-'}
                      </p>
                    </div>
                  </div>

                  {assignedService?.description && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                        <p className="text-base leading-relaxed bg-slate-50 p-4 rounded-lg border">
                          {assignedService.description}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Action Panel */}
              <div className="space-y-6">
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-2"></div>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Accept or reject this assignment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => {
                        setConfirmAction('accept');
                        setConfirmOpen(true);
                      }}
                      disabled={loading || assignedService?.isaccepted === 'accepted'}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
                      disabled={loading || assignedService?.isaccepted === 'rejected'}
                      variant="outline"
                      className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-lg hover:shadow-xl transition-all duration-200"
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

                <Card className="shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Service Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      <Badge variant="outline" className="capitalize">
                        {assignedService?.status || 'unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <span className="text-sm font-medium text-muted-foreground">Acceptance</span>
                      {getStatusBadge(assignedService?.isaccepted)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Client / User</CardTitle>
                    <CardDescription>User details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userProfile ? (
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userProfile.profile_image} alt={userProfile.firstName || 'User'} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {((userProfile.firstName?.charAt(0) ?? '') + (userProfile.lastName?.charAt(0) ?? '')).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <p className="font-medium text-lg">{[userProfile.firstName, userProfile.middleName, userProfile.lastName].filter(Boolean).join(' ')}</p>
                          <p className="text-sm text-muted-foreground">{userProfile.email}</p>

                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                            {userProfile.phone && <div>Phone: <span className="text-sm text-foreground">{userProfile.phone}</span></div>}
                            {userProfile.position && <div>Position: <span className="text-sm text-foreground">{userProfile.position}</span></div>}
                            <div>Location: <span className="text-sm text-foreground">{[userProfile.city, userProfile.state, userProfile.country].filter(Boolean).join(', ') || '-'}</span></div>
                            {userProfile.website && <div>Website: <a href={userProfile.website} className="text-sm text-primary">{userProfile.website}</a></div>}
                            <div>Role: <span className="text-sm text-foreground">{userProfile.role || '-'}</span></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No user information available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent className="sm:max-w-md">
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
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirmAction === 'accept') acceptService();
                      else if (confirmAction === 'reject') rejectService();
                    }}
                    disabled={loading}
                    className={`w-full sm:w-auto ${
                      confirmAction === 'accept' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                    }`}
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
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}