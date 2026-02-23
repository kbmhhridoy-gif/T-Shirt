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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-48 sm:h-64 shimmer-bg rounded-sm" />
      </div>
    );
  }

  const { stats, salesData } = data || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1
          className="font-display text-3xl sm:text-4xl tracking-wider flex items-center gap-2 sm:gap-3"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Revenue and order trends (last 7 days)
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="border border-border rounded-sm p-3 sm:p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Revenue</p>
          <p className="font-display text-xl sm:text-2xl text-green-400 mt-1 break-all" style={{ fontFamily: 'Bebas Neue, serif' }}>
            ৳{(stats?.totalRevenue ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm p-3 sm:p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Orders</p>
          <p className="font-display text-xl sm:text-2xl text-blue-400 mt-1" style={{ fontFamily: 'Bebas Neue, serif' }}>
            {stats?.totalOrders ?? 0}
          </p>
        </div>
        <div className="border border-border rounded-sm p-3 sm:p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">This Month</p>
          <p className="font-display text-xl sm:text-2xl text-orange-400 mt-1 break-all" style={{ fontFamily: 'Bebas Neue, serif' }}>
            ৳{(stats?.monthlyRevenue ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm p-3 sm:p-4 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">This Week</p>
          <p className="font-display text-xl sm:text-2xl text-purple-400 mt-1" style={{ fontFamily: 'Bebas Neue, serif' }}>
            {stats?.weeklyOrders ?? 0} orders
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="border border-border rounded-sm p-4 sm:p-6 bg-card min-h-0">
          <h3 className="font-medium mb-4 sm:mb-6 text-sm sm:text-base">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
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

        <div className="border border-border rounded-sm p-4 sm:p-6 bg-card min-h-0">
          <h3 className="font-medium mb-4 sm:mb-6 text-sm sm:text-base">Orders (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
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
