'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAppSelector } from '@/store/hooks';
import axios from 'axios';

export default function AnalyticsPage() {
  const { token } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<{ stats?: any; salesData?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios
      .get('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-64 shimmer-bg rounded-sm" />
      </div>
    );
  }

  const { stats, salesData } = data || {};

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="font-display text-4xl tracking-wider flex items-center gap-3"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          <BarChart3 className="h-10 w-10 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Revenue and order trends (last 7 days)
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-border rounded-sm p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Revenue</p>
          <p className="font-display text-2xl text-green-400 mt-1" style={{ fontFamily: 'Bebas Neue, serif' }}>
            ৳{(stats?.totalRevenue ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Orders</p>
          <p className="font-display text-2xl text-blue-400 mt-1" style={{ fontFamily: 'Bebas Neue, serif' }}>
            {stats?.totalOrders ?? 0}
          </p>
        </div>
        <div className="border border-border rounded-sm p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">This Month</p>
          <p className="font-display text-2xl text-orange-400 mt-1" style={{ fontFamily: 'Bebas Neue, serif' }}>
            ৳{(stats?.monthlyRevenue ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">This Week</p>
          <p className="font-display text-2xl text-purple-400 mt-1" style={{ fontFamily: 'Bebas Neue, serif' }}>
            {stats?.weeklyOrders ?? 0} orders
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-border rounded-sm p-6 bg-card">
          <h3 className="font-medium mb-6">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData || []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-border rounded-sm p-6 bg-card">
          <h3 className="font-medium mb-6">Orders (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData || []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                }}
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
    </div>
  );
}
