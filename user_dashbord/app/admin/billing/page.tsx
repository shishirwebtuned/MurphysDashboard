'use client';
import React, { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import SpinnerComponent from '@/app/page/common/Spinner'
import { fetchBillingInfo } from '@/lib/redux/slices/billingSlicer'
import Header from '@/app/page/common/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js'
import axiosInstance from '@/lib/axios'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AV_tVxQekwPqP4fz4bI8-CLDs7_cGnDV15R1Mlrc2ZlEUGnu2qoGL4SkfoR_sPotN6z7u8UM_BajzUPw';

// --- PayPalPaymentModal Component ---
function PayPalPaymentModal({
  renewalId, amount, assignServiceId, serviceName, onClose, onSuccess
}: {
  renewalId: string; amount: number; assignServiceId: string; serviceName: string; onClose: () => void; onSuccess: () => void;
}) {
  const { toast } = useToast();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm shadow-2xl border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Complete Payment</CardTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
          </div>
          <div className="mt-3 rounded-lg bg-muted/40 border px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground truncate max-w-[180px]">{serviceName}</span>
            <span className="font-bold text-lg ml-2">${amount} <span className="text-xs font-normal text-muted-foreground">AUD</span></span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-xs text-muted-foreground text-center">You will be redirected to PayPal to complete this payment securely.</p>
          <PayPalButtons
            fundingSource={FUNDING.PAYPAL}
            style={{ layout: 'horizontal', color: 'blue', shape: 'pill', label: 'pay', height: 44 }}
            createOrder={async () => {
              try {
                const res = await axiosInstance.post('/billing/create-order', {
                  renewalId,
                  amount,
                  assignServiceId,
                });
                return res.data.orderID as string;
              } catch (err: any) {
                toast({ title: 'Order Error', description: err?.response?.data?.message || 'Failed to create order', variant: 'destructive' });
                throw err;
              }
            }}
            onApprove={async (data: any) => {
              try {
                const response = await axiosInstance.post('/billing/capture-payment', {
                  orderID: data.orderID,
                  renewalId,
                  assignServiceId,
                });
                console.log(response.data);
                toast({ title: 'Payment Successful', description: `Payment of $${amount} AUD processed via PayPal.` });
                onSuccess();
              } catch (err: any) {
                toast({ title: 'Capture Failed', description: err?.response?.data?.message || 'Failed to capture payment', variant: 'destructive' });
              }
            }}
            onError={(err) => {
              console.error('PayPal error:', err);
              toast({ title: 'PayPal Error', description: 'PayPal payment was not completed.', variant: 'destructive' });
            }}
            onCancel={() => {
              toast({ title: 'Payment Cancelled', description: 'You cancelled the PayPal payment.' });
            }}
          />
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page Component ---
function Page() {
  const dispatch = useAppDispatch();
  const { billingInfo, loading, error } = useAppSelector((state) => state.billing);
  const [selectedRenewal, setSelectedRenewal] = useState<{
    id: string; amount: number; assignServiceId: string; serviceName: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchBillingInfo());
  }, [dispatch]);

  const getAllUnpaidRenewals = () => {
    const unpaid: any[] = [];
    billingInfo.forEach(billing => {
      billing.renewal_dates.forEach(renewal => {
        if (!renewal.haspaid) {
          unpaid.push({
            ...renewal,
            serviceName: billing.service_name,
            assignServiceId: billing._id,
            invoiceId: billing.invoice_id
          });
        }
      });
    });
    return unpaid.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const unpaidRenewals = getAllUnpaidRenewals();
  const totalUnpaidAmount = unpaidRenewals.reduce((sum, r) => sum + Number(r.price), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent pb-12">
      {loading && <SpinnerComponent />}

      <Header
        title="Billing & Payments"
        description="View your active services and payment history"
        total={billingInfo.length}
      />

      <div className=" mx-auto  space-y-8">
        {/* Simplified No Payment Status */}
        {unpaidRenewals.length === 0 && !loading && billingInfo.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium text-sm">Account up to date. No payment is required at this time.</p>
          </div>
        )}

        {error && (
          <div className="p-4 border border-destructive bg-destructive/5 rounded-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Pending Payments Section - Simple UI */}
        {unpaidRenewals.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-end border-b pb-4">
              <div>
                <h2 className="text-lg text-blue-600 font-bold tracking-tight">Outstanding Balance</h2>
                <p className="text-sm text-muted-foreground">You have {unpaidRenewals.length} pending payment(s).</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold tracking-tighter">${totalUnpaidAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unpaidRenewals.map((renewal) => (
                <Card key={renewal._id} className="border shadow-none">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-bold leading-none">{renewal.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{renewal.invoiceId}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">Pending</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">${renewal.price}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(renewal.date), 'MMM dd')}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full cursor-pointer"
                      onClick={() => setSelectedRenewal({
                        id: renewal._id,
                        amount: renewal.price,
                        assignServiceId: renewal.assignServiceId,
                        serviceName: renewal.serviceName
                      })}
                    >
                      Pay Now <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Services List - Simple UI */}
        <section className="space-y-4">
          {/* <h2 className="text-lg font-bold tracking-tight">Service History</h2> */}
          {billingInfo.length === 0 && !loading ? (
            <Card className="border-dashed shadow-none py-12 text-center">
              <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">No billing records found.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {billingInfo.map((billing) => (
                <Card key={billing._id} className="shadow-none border overflow-hidden">
                  <CardHeader className="bg-slate-50/50 dark:bg-muted/20 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base font-bold">{billing.service_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">ID: {billing.invoice_id}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{billing.isaccepted}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Simplified Stat Line */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x border-b">
                      <div className="p-4 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Price</p>
                        <p className="font-bold">${billing.price}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Cycle</p>
                        <p className="font-bold capitalize">{billing.cycle}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Start</p>
                        <p className="font-bold">{format(new Date(billing.start_date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">End</p>
                        <p className="font-bold">{format(new Date(billing.end_date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>

                    {/* Simple Payment Schedule List */}
                    <div className="p-4 space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Installments</p>
                      {billing.renewal_dates.map((renewal) => (
                        <div key={renewal._id} className="flex items-center justify-between p-3 border rounded-md text-sm">
                          <div className="flex items-center gap-3">
                            {renewal.haspaid ?
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                              <Clock className="h-4 w-4 text-slate-400" />
                            }
                            <span className="font-medium">{format(new Date(renewal.date), 'MMM dd, yyyy')}</span>
                            <span className="text-muted-foreground capitalize text-xs">({renewal.label})</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold">${renewal.price}</span>
                            {!renewal.haspaid ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setSelectedRenewal({
                                  id: renewal._id,
                                  amount: renewal.price,
                                  assignServiceId: billing._id,
                                  serviceName: billing.service_name
                                })}
                              >
                                Pay
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="text-[11px] uppercase">Paid</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {selectedRenewal && (
          <PayPalPaymentModal
            renewalId={selectedRenewal.id}
            amount={selectedRenewal.amount}
            assignServiceId={selectedRenewal.assignServiceId}
            serviceName={selectedRenewal.serviceName}
            onClose={() => setSelectedRenewal(null)}
            onSuccess={() => {
              setSelectedRenewal(null);
              dispatch(fetchBillingInfo());
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: 'AUD',
        intent: 'capture',
        locale: 'en_AU',
        disableFunding: 'card,credit,venmo,paylater',
      } as any}
    >
      <Page />
    </PayPalScriptProvider>
  );
}