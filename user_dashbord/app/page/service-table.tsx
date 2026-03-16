'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchServices } from '@/lib/redux/slices/serviceSlice';
import { addToCart, getCart } from '@/lib/redux/slices/cartSlice';
import { Service } from '@/types/service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { MoreVertical, ChevronLeft, ChevronRight, Eye, CheckCircle2, Info, ShoppingCart, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card'; // We only need base Card and Content for custom layout
import Image from 'next/image';
import SpinnerComponent from './common/Spinner';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface ServiceTableProps {
    categoryFilter?: string;
}

const ITEMS_PER_PAGE = 10;

export default function ServiceTable({ categoryFilter = 'all' }: ServiceTableProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { services, loading, page: storePage, limit: storeLimit, total, totalPages } = useAppSelector((state) => state.services);
    const { loading: cartLoading } = useAppSelector((state) => state.cart);

    const [currentPage, setCurrentPage] = useState(storePage || 1);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedViewService, setSelectedViewService] = useState<Service | null>(null);
    const [clickImage, setClickImage] = useState<string>('');
    const userid = useAppSelector((s) => s.mee.data?._id) || '';
    console.log('Services in ServiceTable in card:', userid);
    useEffect(() => {
        dispatch(fetchServices({ page: currentPage, limit: ITEMS_PER_PAGE, category: categoryFilter === 'all' ? undefined : categoryFilter } as any));
    }, [dispatch, currentPage, categoryFilter]);

    const formatBillingType = (type: string) => {
        const formats: Record<string, string> = {
            one_time: 'One Time',
            monthly: 'Monthly',
            yearly: 'Yearly',
            pay_as_you_go: 'PAYG',
        };
        return formats[type] || type;
    };

    const formatPrice = (price: number, billingType: string, currency?: string) => {
        const cur = currency || 'USD';
        const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(price);
        if (billingType === 'monthly') return `${formatted}/mo`;
        if (billingType === 'yearly') return `${formatted}/yr`;
        return formatted;
    };

    const handleAddToCart = async (service: Service) => {
        if (!userid) {
            toast({
                title: 'Error',
                description: 'Please log in to add items to cart',
                variant: 'destructive'
            });
            return;
        }

        const serviceId = (service as any)._id || (service as any).id;
        try {
            await dispatch(addToCart({ userid, serviceId })).unwrap();
            toast({
                title: 'Success',
                description: `${service.name} added to cart!`,
            });
            // Navigate to cart page
            window.location.href = '/user/cart';
        } catch (err: any) {
            const errorMessage = err || 'Failed to add to cart';
            toast({
                title: errorMessage.includes('already in your cart') ? 'Already in Cart' : 'Error',
                description: errorMessage,
                variant: 'destructive'
            });
            console.error('add to cart error', err);
        }
    };

    const handleViewClick = (service: Service) => {
        setSelectedViewService(service);
        setViewDialogOpen(true);
    };

    if (services.length === 0) {
        return (
            <div className="">
                <SpinnerComponent />

            </div>
        );
    }

    const effectiveTotalPages = totalPages || Math.ceil((total || 0) / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return (
        <>
            {(loading || cartLoading) && <SpinnerComponent />}

            {clickImage && (
                <Dialog open={Boolean(clickImage)} onOpenChange={() => setClickImage('')}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                        <div className="relative w-full h-full flex justify-center items-center">
                            <img
                                src={clickImage}
                                alt="Service Full Size"
                                className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* NEW GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                {services.map((service) => {
                    const hasDiscount = service.hasDiscount && service.discountValue;
                    const finalPrice = hasDiscount
                        ? (service.discountType === 'percentage'
                            ? service.price - (service.price * (service.discountValue || 0) / 100)
                            : service.price - (service.discountValue || 0))
                        : service.price;

                    return (
                        <Card
                            key={(service as any)._id || (service as any).id}
                            className="group relative flex p-0 flex-col h-full overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xl transition-all duration-300 rounded-2xl bg-white dark:bg-gray-900"
                        >
                            {/* Top accent border */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* 1. Full Bleed Image Header */}
                            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                                {((service as any).image || (service as any).imageUrl) ? (
                                    <Image
                                        src={(service as any).image || (service as any).imageUrl}
                                        alt={service.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800">
                                        <Sparkles className="w-12 h-12 mb-3 opacity-30" />
                                        <span className="text-sm font-medium">No Preview Available</span>
                                    </div>
                                )}

                                {/* Category Badge */}
                                <div className="absolute top-4 left-4 z-10">
                                    <Badge className="bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm px-3 py-1 text-xs font-semibold">
                                        {service.categoryName || 'General'}
                                    </Badge>
                                </div>

                                {hasDiscount && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold">
                                            {service.discountType === 'percentage' ? `-${service.discountValue}%` : 'SALE'}
                                        </Badge>
                                    </div>
                                )}

                                {/* Hover Overlay with Actions */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6 gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white hover:bg-gray-100 text-gray-900 border-0 shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-medium"
                                        onClick={() => handleViewClick(service)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="bg-white hover:bg-gray-100 text-gray-900 border-0 shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
                                        onClick={() => {
                                            const imgSrc = (service as any).image || (service as any).imageUrl || '';
                                            if (imgSrc) setClickImage(imgSrc);
                                        }}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* 2. Content Body */}
                            <CardContent className="flex flex-col flex-1 px-6 py-5 gap-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-3">
                                        <h3 className="font-bold text-xl leading-tight line-clamp-1 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {service.name}
                                        </h3>

                                        {/* Dropdown Menu */}
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md"
                                                >
                                                    <MoreVertical className="h-5 w-5" />
                                                    <span className="sr-only">More options</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 z-[9999]" sideOffset={5}>
                                                <DropdownMenuItem onClick={() => handleViewClick(service)} className="cursor-pointer">
                                                    <Info className="w-4 h-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs text-gray-500 dark:text-gray-400">
                                                    ID: {((service as any)._id || (service as any).id).slice(-6)}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                                        {service.description}
                                    </p>
                                </div>

                                {/* Spacer to push footer to bottom */}
                                <div className="flex-1" />

                                {/* 3. Footer (Price & Action) */}
                                <div className="space-y-4">
                                    {/* Divider */}
                                    <div className="w-full h-px bg-gray-200 dark:bg-gray-800" />

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                {formatBillingType(service.billingType)}
                                            </span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {formatPrice(finalPrice, service.billingType, service.currency)}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                                                        {formatPrice(service.price, 'one_time', service.currency)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleAddToCart(service)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 h-11 font-semibold text-sm rounded-xl"
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Add to Cart
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {effectiveTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-6 border-t mt-2">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{startIndex + 1}</span>-
                        <span className="font-medium text-foreground">{Math.min(endIndex, total || 0)}</span> of{' '}
                        <span className="font-medium text-foreground">{total || 0}</span> services
                    </p>

                    <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-lg">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center px-2">
                            <span className="text-sm font-medium">Page {currentPage} of {effectiveTotalPages}</span>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, effectiveTotalPages))}
                            disabled={currentPage === effectiveTotalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detailed View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden">
                    {selectedViewService && (
                        <div className="flex flex-col md:flex-row h-full">
                            {/* Sidebar / Image in Dialog */}
                            <div className="w-full md:w-2/5 bg-muted relative min-h-[200px] md:min-h-full">
                                {((selectedViewService as any).image || (selectedViewService as any).imageUrl) ? (
                                    <img
                                        src={(selectedViewService as any).image || (selectedViewService as any).imageUrl}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                                        {selectedViewService.categoryName}
                                    </Badge>
                                </div>
                            </div>

                            {/* Content in Dialog */}
                            <div className="flex-1 p-6 md:p-8 space-y-6 bg-background">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight mb-2">{selectedViewService.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-bold text-blue-600">
                                            {formatPrice(
                                                selectedViewService.hasDiscount && selectedViewService.discountValue
                                                    ? (selectedViewService.discountType === 'percentage'
                                                        ? selectedViewService.price * (1 - (selectedViewService.discountValue / 100))
                                                        : selectedViewService.price - selectedViewService.discountValue)
                                                    : selectedViewService.price,
                                                selectedViewService.billingType,
                                                selectedViewService.currency
                                            )}
                                        </span>
                                        {selectedViewService.hasDiscount && (
                                            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
                                                Save {selectedViewService.discountType === 'percentage' ? `${selectedViewService.discountValue}%` : 'Cash'}
                                            </Badge>
                                        )}
                                    </div>
                                    {selectedViewService.hasDiscount && (
                                        <div className="mt-2">
                                            <p className="text-sm text-muted-foreground">Discount period: {selectedViewService.discountStartDate ? format(new Date(selectedViewService.discountStartDate), 'MMM dd, yyyy') : 'N/A'} — {selectedViewService.discountEndDate ? format(new Date(selectedViewService.discountEndDate), 'MMM dd, yyyy') : 'N/A'}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Description</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {selectedViewService.description}
                                        </p>
                                    </div>

                                    {selectedViewService.tags && selectedViewService.tags.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Tags</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    // tags may be stored as JSON-stringified arrays or simple strings
                                                    try {
                                                        const parsed: string[] = selectedViewService.tags.flatMap((t: any) => {
                                                            if (typeof t === 'string') {
                                                                // attempt to parse JSON arrays stored as strings
                                                                if (/^\[.*\]$/.test(t.trim())) {
                                                                    try {
                                                                        const inner = JSON.parse(t);
                                                                        return Array.isArray(inner) ? inner : [String(t)];
                                                                    } catch (e) {
                                                                        return [t];
                                                                    }
                                                                }
                                                                return [t];
                                                            }
                                                            return [String(t)];
                                                        });

                                                        return parsed.map((tag, idx) => (
                                                            <Badge key={idx} className="  px-2 py-1">{tag}</Badge>
                                                        ));
                                                    } catch (e) {
                                                        return selectedViewService.tags.map((tag: any, idx: number) => (
                                                            <Badge key={idx} className="  px-2 py-1">{String(tag)}</Badge>
                                                        ));
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {selectedViewService.features && selectedViewService.features.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Features</h4>
                                            <ul className="grid grid-cols-1 gap-2">
                                                {selectedViewService.features.map((f, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        <span>{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 mt-auto">
                                    <Button
                                        className="w-full md:w-auto min-w-[200px]"
                                        size="lg"
                                        onClick={() => {
                                            handleAddToCart(selectedViewService);
                                            setViewDialogOpen(false);
                                        }}
                                    >
                                        Add to Cart
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
