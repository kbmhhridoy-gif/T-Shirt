'use client';

import { useEffect, useState } from 'react';
import {
  Users, Package, ShoppingBag, DollarSign,
  TrendingUp, AlertCircle, Clock, CheckCircle, FileDown, FileSpreadsheet
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useAppSelector } from '@/store/hooks';
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
  const { token } = useAppSelector((s) => s.auth);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const downloadReport = async (format: 'pdf' | 'xlsx') => {
    try {
      const res = await fetch(`/api/admin/reports/orders?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? 'orders-report.pdf' : 'orders-report.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
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
      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 shimmer-bg rounded-sm" />
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="font-display text-4xl tracking-wider"
            style={{ fontFamily: 'Bebas Neue, serif' }}
          >
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, Admin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadReport('pdf')}>
            <FileDown className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadReport('xlsx')}>
            <FileSpreadsheet className="h-4 w-4" /> Download Excel
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                {card.label}
              </span>
              <div className={cn('w-8 h-8 rounded-sm flex items-center justify-center', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
            <div className={cn('font-display text-3xl tracking-wider', card.color)} style={{ fontFamily: 'Bebas Neue, serif' }}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="border border-border rounded-sm p-6 bg-card">
          <h3 className="font-medium mb-6">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesData || []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-border rounded-sm p-6 bg-card">
          <h3 className="font-medium mb-6">Orders (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesData || []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="border border-border rounded-sm bg-card">
        <div className="p-6 border-b border-border">
          <h3 className="font-medium">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Order ID', 'Customer', 'Amount', 'Payment', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map((order: any) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{order.user.name}</p>
                      <p className="text-xs text-muted-foreground">{order.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">৳{order.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-muted-foreground">{order.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2 py-1 rounded-sm text-xs font-medium', STATUS_COLORS[order.status] || '')}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
