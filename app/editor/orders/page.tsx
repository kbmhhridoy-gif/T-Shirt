'use client';

import { useEffect, useState } from 'react';
import { Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  PROCESSING: { color: 'text-blue-400 bg-blue-400/10', icon: Package },
  SHIPPED: { color: 'text-orange-400 bg-orange-400/10', icon: Truck },
  DELIVERED: { color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
  CANCELLED: { color: 'text-red-400 bg-red-400/10', icon: XCircle },
};

export default function EditorOrdersPage() {
  const { token } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/editor/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data.orders || []);
    } catch {
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await axios.patch(`/api/orders/${orderId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Order status updated' });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider" style={{ fontFamily: 'Bebas Neue, serif' }}>
          My Assigned Orders
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{orders.length} orders assigned to you</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
          const StatusIcon = config.icon;
          return (
            <div key={order.id} className="border border-border rounded-sm bg-card">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-border">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="font-medium mt-0.5">{order.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">৳{order.totalAmount.toLocaleString()}</p>
                  <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-medium', config.color)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {order.status}
                  </div>
                  <select
                    className="text-xs bg-secondary border border-border rounded-sm px-2 py-1.5 text-foreground"
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-5 flex flex-wrap gap-3">
                {order.orderItems?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{item.product?.title}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{item.selectedCut} {item.selectedSize} ×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4 text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
                {order.shippingAddr && ` · ${order.shippingAddr}`}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No orders assigned to you yet</div>
      )}
    </div>
  );
}
