'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Package, Clock, CheckCircle, XCircle, Truck, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyOrders } from '@/store/slices/orderSlice';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  PENDING: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
  PROCESSING: { icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Processing' },
  SHIPPED: { icon: Truck, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Cancelled' },
};

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, isLoading } = useAppSelector((s) => s.orders);
  const { token } = useAppSelector((s) => s.auth);
  const downloadInvoice = async (orderId: string) => {
    const res = await fetch(`/api/orders/invoice/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${orderId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1
        className="font-display text-5xl tracking-wider mb-10"
        style={{ fontFamily: 'Bebas Neue, serif' }}
      >
        My Orders
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 shimmer-bg rounded-sm" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">You haven't placed any orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig.icon;

            return (
              <div key={order.id} className="border border-border rounded-sm bg-card overflow-hidden">
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString('en-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold">৳{order.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment</p>
                      <p className="text-sm">{order.paymentMethod}</p>
                    </div>
                    {order.invoicePath && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadInvoice(order.id)}>
                        <FileDown className="h-3.5 w-3.5" /> Invoice
                      </Button>
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium',
                        statusConfig.bg,
                        statusConfig.color
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-3">
                    {order.orderItems.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-14 overflow-hidden rounded-sm flex-shrink-0">
                          <Image
                            src={item.product.image}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{item.product.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.selectedCut} · {item.selectedSize} · ×{item.quantity}
                          </p>
                          <p className="text-xs font-medium mt-1">
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
