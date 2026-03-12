"use client";
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { getCart, removeFromCart, clearCart  ,updateCartStatus} from '@/lib/redux/slices/cartSlice';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShoppingCart, Trash2, X, Info, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import SpinnerComponent from './common/Spinner';
import Header from './common/header';
import { useRouter } from 'next/navigation';
import {getMee} from  "@/lib/redux/slices/meeSlice"

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { cart, loading } = useAppSelector((state) => state.cart);
 const { data: meeData } = useAppSelector((state) => state.mee);
  const userid = meeData?._id || '';
  const router = useRouter();
  const [viewingSingleService, setViewingSingleService] = React.useState<string | null>(null);


  useEffect(() => {
    if (userid) {
      dispatch(getCart(userid));
    }
  }, [dispatch, userid]);

  const formatPrice = (price: number, billingType: string, currency?: string) => {
    const cur = currency || 'USD';
    const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(price);
    if (billingType === 'monthly') return `${formatted}/mo`;
    if (billingType === 'yearly') return `${formatted}/yr`;
    return formatted;
  };

  const formatBillingType = (type: string) => {
    const formats: Record<string, string> = {
      one_time: 'One Time',
      monthly: 'Monthly',
      yearly: 'Yearly',
      pay_as_you_go: 'Pay as you go',
    };
    return formats[type] || type;
  };

  const handleRemoveFromCart = async (serviceId: string) => {
    try {
      await dispatch(removeFromCart({ userid, serviceId })).unwrap();
      // Refetch cart to ensure we have the latest data
      await dispatch(getCart(userid)).unwrap();
      toast({
        title: 'Success',
        description: 'Service removed from cart',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove from cart',
        variant: 'destructive',
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await dispatch(clearCart(userid)).unwrap();
      toast({
        title: 'Success',
        description: 'Cart cleared',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmCart = async (serviceItemId: string) => {
    try {
      await dispatch(updateCartStatus({ serviceItemId, status: 'confirmed' })).unwrap();
      await dispatch(getCart(userid)).unwrap();
      toast({
        title: 'Service Confirmed!',
        description: 'Your request has been submitted. Admin will assign this service to you soon.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm service',
        variant: 'destructive',
      });
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.Services || cart.Services.length === 0) return 0;
    return cart.Services.reduce((total, cartService) => {
      const service = cartService.serviceId;
      if (!service || typeof service !== 'object') return total;
      let price = service.price;
      if (service.hasDiscount && service.discountValue) {
        price = service.discountType === 'percentage'
          ? price - (price * (service.discountValue || 0) / 100)
          : price - (service.discountValue || 0);
      }
      return total + price;
    }, 0);
  };

  if (loading && !cart) {
    return <SpinnerComponent />;
  }

  const cartItems = cart?.Services || [];
  const totalAmount = calculateTotal();

  // Filter to show only single service if viewing one
  const displayedItems = viewingSingleService 
    ? cartItems.filter(item => (item.serviceId as any)?._id === viewingSingleService)
    : cartItems;

  return (
    <>
    <Header
      title="Shopping Cart"
      description="Browse and manage your selected services"
      link="/admin/services"
      buttonText="Add New items"
      extra={
        <>
          {viewingSingleService && (
            <Button
              variant="outline"
              onClick={() => setViewingSingleService(null)}
              className="mr-2"
            >
              Show All Services
            </Button>
          )}
          {cartItems.length > 0 && !viewingSingleService ? (
            // keep extra small and inline so header can place it next to the action button
            <Button
              variant="outline"
              onClick={handleClearCart}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          ) : null}
        </>
      }
    />

    <div className="">
      {/* Cart Status Notice */}
      {cart && displayedItems.length > 0 && !viewingSingleService && (
        <div className="mb-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Confirm Services</AlertTitle>
            <AlertDescription className="text-blue-800">
              Please confirm each service individually. Once confirmed, our admin team will review and assign the services to you.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {displayedItems.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground">
              Add some services to get started!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {displayedItems.map((cartService) => {
              const service = cartService.serviceId;
              if (!service || typeof service !== 'object') return null;
              
              const discountedPrice = service.hasDiscount && service.discountValue
                ? service.discountType === 'percentage'
                  ? service.price - (service.price * (service.discountValue || 0) / 100)
                  : service.price - (service.discountValue || 0)
                : service.price;

              return (
                <Card key={cartService._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {/* Service Image */}
                      <div className="shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-muted">
                        {((service as any).image || (service as any).imageUrl) ? (
                          <Image
                            src={(service as any).image || (service as any).imageUrl}
                            alt={service.name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none">
                              {service.categoryName || 'Unknown'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`capitalize text-[10px] ${
                                cartService.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-200'
                                  : cartService.status === 'confirmed'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                  : cartService.status === 'done'
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-200'
                                  : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              {cartService.status === 'pending' && (
                                <><Clock className="h-3 w-3 mr-1" /> Pending</>
                              )}
                              {cartService.status === 'confirmed' && (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</>
                              )}
                              {cartService.status === 'done' && (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                              )}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {service.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {formatBillingType(service.billingType)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-col">
                            {service.hasDiscount && service.discountValue ? (
                              <>
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(service.price, service.billingType, service.currency)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-emerald-600">
                                    {formatPrice(discountedPrice, service.billingType, service.currency)}
                                  </span>
                                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] h-4 px-1">
                                    Sale
                                  </Badge>
                                </div>
                              </>
                            ) : (
                              <span className="text-xl font-bold">
                                {formatPrice(service.price, service.billingType, service.currency)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {cartService.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmCart(cartService._id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                            )}
                            {cartService.status === 'confirmed' && (
                              <Alert className="bg-emerald-50 border-emerald-200 p-2 text-xs">
                                <AlertDescription className="text-emerald-800 flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  Admin will assign soon
                                </AlertDescription>
                              </Alert>
                            )}
                            {cartService.status === 'done' && (
                              <Alert className="bg-blue-50 border-blue-200 p-2 text-xs">
                                <AlertDescription className="text-blue-800 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Service accepted by admin
                                </AlertDescription>
                              </Alert>
                            )}
                            {cartService.status !== 'done' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart((service as any)._id || (service as any).id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setViewingSingleService((service as any)._id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                View Service
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          {!viewingSingleService && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review your cart items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items ({cartItems.length})</span>
                      <span className="font-medium">${totalAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    Confirm each service individually to proceed
                  </AlertDescription>
                </Alert>

            
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
