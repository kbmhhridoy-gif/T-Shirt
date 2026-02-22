'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Package, ArrowRight, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import axios from 'axios';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { token } = useAppSelector((s) => s.auth);
  const [order, setOrder] = useState<any>(null);
  const payment = searchParams.get('payment');
  const isFailed = payment === 'failed';

  useEffect(() => {
    if (id && token) {
      axios
        .get(`/api/orders/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const found = res.data.orders.find((o: any) => o.id === id);
          setOrder(found);
        });
    }
  }, [id, token]);

  if (isFailed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <XCircle className="h-20 w-20 text-destructive mx-auto mb-6" />
        <h1
          className="font-display text-5xl tracking-wider mb-4"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          Payment Failed
        </h1>
        <p className="text-muted-foreground mb-8">
          Something went wrong with your payment. Please try again.
        </p>
        <Link href="/cart">
          <Button className="btn-primary">Return to Cart</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 text-center max-w-lg">
      <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-400" />
      </div>

      <h1
        className="font-display text-5xl tracking-wider mb-4"
        style={{ fontFamily: 'Bebas Neue, serif' }}
      >
        Order Confirmed!
      </h1>

      <p className="text-muted-foreground mb-8">
        Thank you! Your order has been placed successfully. We'll send you updates as it's processed.
      </p>

      {order && (
        <div className="border border-border rounded-sm p-6 text-left mb-8 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Order #{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="text-foreground font-medium">৳{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment</span>
              <span className="text-foreground">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-green-400 capitalize">{order.status}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        {order?.invoicePath && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              const res = await fetch(`/api/orders/invoice/${order.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) return;
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `invoice-${order.id}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <FileDown className="h-4 w-4" /> Download Invoice
          </Button>
        )}
        <Link href="/orders">
          <Button variant="outline" className="gap-2">Track Order</Button>
        </Link>
        <Link href="/products">
          <Button className="btn-primary gap-2">Continue Shopping <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    </div>
  );
}
