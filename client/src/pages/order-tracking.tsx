import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    MapPin,
    Phone,
    User,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Home,
    Factory,
    Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Order status steps
const ORDER_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'processing', label: 'Processing', icon: Factory },
    { key: 'in_transit', label: 'In Transit', icon: Truck },
    { key: 'ready', label: 'Ready for Pickup', icon: Store },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export default function OrderTracking() {
    const params = useParams();
    const orderId = params.id;

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order-tracking', orderId],
        queryFn: async () => {
            const token = localStorage.getItem('employee_token');
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Order not found');
                }
                throw new Error('Failed to fetch order');
            }
            return response.json();
        },
        enabled: !!orderId
    });

    const getStatusIndex = (status: string) => {
        const index = ORDER_STEPS.findIndex(step => step.key === status);
        return index >= 0 ? index : 0;
    };

    const currentStepIndex = order ? getStatusIndex(order.status) : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
                <Card className="max-w-md w-full mx-4">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
                            <p className="text-muted-foreground mb-6">
                                We couldn't find the order you're looking for. Please check the order ID and try again.
                            </p>
                            <Button onClick={() => window.history.back()} variant="outline" className="mr-2">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go Back
                            </Button>
                            <Button onClick={() => window.location.href = '/orders'}>
                                View All Orders
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => window.history.back()}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Order Tracking</h1>
                            <p className="text-muted-foreground">
                                Order #{order.orderNumber}
                            </p>
                        </div>
                        <Badge
                            className={`text-lg px-4 py-2 ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                }`}
                        >
                            {order.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>
                </div>

                {/* Progress Tracker */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Order Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            {/* Progress Line */}
                            <div className="absolute top-6 left-0 right-0 h-1 bg-muted mx-8">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
                                />
                            </div>

                            {/* Steps */}
                            <div className="relative flex justify-between">
                                {ORDER_STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    const StepIcon = step.icon;

                                    return (
                                        <div key={step.key} className="flex flex-col items-center z-10">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                                        ? 'bg-primary text-primary-foreground shadow-lg'
                                                        : 'bg-muted text-muted-foreground'
                                                    } ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}`}
                                            >
                                                <StepIcon className="w-5 h-5" />
                                            </div>
                                            <span className={`mt-2 text-xs text-center font-medium ${isCompleted ? 'text-primary' : 'text-muted-foreground'
                                                }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{order.customerName || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground">{order.customerEmail || 'No email'}</p>
                                </div>
                            </div>
                            {order.customerPhone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{order.customerPhone}</p>
                                    </div>
                                </div>
                            )}
                            {order.customerAddress && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Address</p>
                                        <p className="font-medium">{order.customerAddress}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Order Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order Date</p>
                                    <p className="font-medium">
                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="font-medium text-lg">₹{order.totalAmount || '0.00'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Status</p>
                                    <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                        {order.paymentStatus || 'Pending'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Items</p>
                                    <p className="font-medium">{order.items?.length || 0} items</p>
                                </div>
                            </div>

                            {order.pickupDate && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pickup Date</p>
                                        <p className="font-medium">
                                            {new Date(order.pickupDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Items List */}
                {order.items && order.items.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {order.items.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.serviceName || item.name || 'Service'}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                                        </div>
                                        <p className="font-medium">₹{item.price || '0.00'}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
