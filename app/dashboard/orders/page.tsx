'use client';

import { useEffect, useState } from 'react';
import { Clock, Package, Truck, CheckCircle, XCircle, FileDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_CONFIG = {
  PENDING: { color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  PROCESSING: { color: 'text-blue-400 bg-blue-400/10', icon: Package },
  SHIPPED: { color: 'text-orange-400 bg-orange-400/10', icon: Truck },
  DELIVERED: { color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
  CANCELLED: { color: 'text-red-400 bg-red-400/10', icon: XCircle },
};

export default function AdminOrdersPage() {
  const { token } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [editors, setEditors] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await axios.get(`/api/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const fetchEditors = async () => {
      try {
        const { data } = await axios.get('/api/users?role=EDITOR&limit=50', { headers: { Authorization: `Bearer ${token}` } });
        setEditors((data.users || []).filter((u: any) => u.isActive !== false));
      } catch {
        // ignore
      }
    };
    fetchEditors();
  }, [token]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await axios.patch(
        `/api/orders/${orderId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Order status updated' });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const updateOrderEditor = async (orderId: string, editorId: string) => {
    try {
      await axios.patch(`/api/orders/${orderId}`, { editorId: editorId || null }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Order reassigned' });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Reassign failed', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/invoice/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1
          className="font-display text-3xl sm:text-4xl tracking-wider"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          Orders
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{orders.length} orders</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 sm:mb-6 flex-wrap">
        {['', ...STATUS_OPTIONS].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="text-xs"
          >
            {status || 'All'}
          </Button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {orders.map((order) => {
          const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
          const StatusIcon = config.icon;
          const customerName = order.user?.name || order.guestName || 'Guest';
          const customerEmail = order.user?.email || order.guestEmail || '—';

          return (
            <div key={order.id} className="border border-border rounded-sm bg-card">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-border">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="font-medium mt-0.5">{customerName}</p>
                  <p className="text-xs text-muted-foreground">{customerEmail}</p>
                  {order.editor && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" /> {order.editor.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold">৳{order.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
                  </div>

                  <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-medium', config.color)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {order.status}
                  </div>

                  {order.invoicePath && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => downloadInvoice(order.id)}>
                      <FileDown className="h-3.5 w-3.5" /> Invoice
                    </Button>
                  )}
                  <select
                    className="text-xs bg-secondary border border-border rounded-sm px-2 py-1.5 text-foreground"
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <select
                      className="text-xs bg-secondary border border-border rounded-sm px-2 py-1.5 text-foreground min-w-0 flex-1 sm:min-w-[140px] sm:flex-initial"
                      value={order.editorId || ''}
                      onChange={(e) => updateOrderEditor(order.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {editors.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-wrap gap-3">
                {order.orderItems?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{item.product?.title}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {item.selectedCut} {item.selectedSize} ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-4 sm:px-5 pb-4 text-xs text-muted-foreground break-words">
                {new Date(order.createdAt).toLocaleString()}
                {order.shippingAddr && ` · ${order.shippingAddr}`}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No orders found</div>
      )}
    </div>
  );
}
