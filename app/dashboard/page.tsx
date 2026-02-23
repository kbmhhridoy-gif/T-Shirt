'use client';

import { useEffect, useState } from 'react';
import {
  Users, Package, ShoppingBag, DollarSign,
  FileDown, FileSpreadsheet,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-400/10 text-yellow-400',
  PROCESSING: 'bg-blue-400/10 text-blue-400',
  SHIPPED: 'bg-orange-400/10 text-orange-400',
  DELIVERED: 'bg-green-400/10 text-green-400',
  CANCELLED: 'bg-red-400/10 text-red-400',
};

export default function DashboardPage() {
  const { token, user: authUser } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const downloadReport = async (format: 'pdf' | 'xlsx') => {
    if (!token) {
      toast({ title: 'Please log in to download', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`/api/admin/reports/orders?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? 'orders-report.pdf' : 'orders-report.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `${format.toUpperCase()} downloaded successfully` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  useEffect(() => {
    axios
      .get('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setAnalytics(res.data);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 sm:h-32 shimmer-bg rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, recentOrders, salesData } = analytics || {};

  const statCards = [
    {
      label: 'Total Revenue',
      value: `৳${(stats?.totalRevenue || 0).toLocaleString()}`,
      sub: `৳${(stats?.monthlyRevenue || 0).toLocaleString()} this month`,
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      sub: `${stats?.weeklyOrders || 0} this week`,
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Customers',
      value: stats?.totalUsers || 0,
      sub: `${stats?.blockedUsers || 0} blocked`,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Active Products',
      value: stats?.totalProducts || 0,
      sub: `${stats?.pendingOrders || 0} pending orders`,
      icon: Package,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="font-display text-3xl sm:text-4xl tracking-wider"
            style={{ fontFamily: 'Bebas Neue, serif' }}
          >
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Welcome back, Admin</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
          {authUser && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground pr-1">
              <div className="relative w-8 h-8 flex-shrink-0">
                {authUser.avatar || authUser.image ? (
                  <img
                    src={(authUser.avatar as string) || (authUser.image as string)}
                    alt={authUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-primary/40 bg-background"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-medium text-primary">
                    {authUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${
                    authUser.isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-foreground">{authUser.name}</span>
                <span className="text-[11px] uppercase tracking-wide">{authUser.role}</span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => downloadReport('pdf')}>
              <FileDown className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => downloadReport('xlsx')}>
              <FileSpreadsheet className="h-4 w-4" /> Download Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs text-muted-foreground uppercase tracking-widest truncate pr-2">
                {card.label}
              </span>
              <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center flex-shrink-0', card.bg)}>
                <card.icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', card.color)} />
              </div>
            </div>
            <div className={cn('font-display text-2xl sm:text-3xl tracking-wider break-all', card.color)} style={{ fontFamily: 'Bebas Neue, serif' }}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="border border-border rounded-sm bg-card">
        <div className="p-4 sm:p-6 border-b border-border">
          <h3 className="font-medium text-sm sm:text-base">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                {['Order ID', 'Customer', 'Amount', 'Payment', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 sm:px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map((order: any) => {
                const customerName = order.user?.name || order.guestName || 'Guest';
                const email = order.user?.email || order.guestEmail || '—';
                return (
                <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-xs text-muted-foreground">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{email}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">৳{order.totalAmount.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-muted-foreground text-xs sm:text-sm">{order.paymentMethod}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={cn('px-2 py-1 rounded-sm text-xs font-medium', STATUS_COLORS[order.status] || '')}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
