'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Edit3 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import axios from 'axios';
import { cn } from '@/lib/utils';

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  _count?: { orders: number };
  totalSpent?: number;
  productsPurchased?: number;
};

type EditorRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  creates: number;
  updates: number;
  deletes: number;
  total: number;
};

export default function InsightsPage() {
  const { token } = useAppSelector((s) => s.auth);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [editors, setEditors] = useState<EditorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCustomerBy, setSortCustomerBy] = useState<'orders' | 'totalSpent' | 'products'>('totalSpent');
  const [sortEditorBy, setSortEditorBy] = useState<'total' | 'creates' | 'updates' | 'deletes'>('total');

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [usersRes, editorsRes] = await Promise.all([
          axios.get('/api/users?limit=100&role=CUSTOMER', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/contributions/editors', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setCustomers(usersRes.data?.users ?? []);
        setEditors(editorsRes.data?.editors ?? []);
      } catch {
        setCustomers([]);
        setEditors([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const sortedCustomers = [...customers].sort((a, b) => {
    const va = sortCustomerBy === 'orders' ? (a._count?.orders ?? 0) : sortCustomerBy === 'totalSpent' ? (a.totalSpent ?? 0) : (a.productsPurchased ?? 0);
    const vb = sortCustomerBy === 'orders' ? (b._count?.orders ?? 0) : sortCustomerBy === 'totalSpent' ? (b.totalSpent ?? 0) : (b.productsPurchased ?? 0);
    return vb - va;
  });

  const sortedEditors = [...editors].sort((a, b) => {
    const key = sortEditorBy;
    return (b[key] ?? 0) - (a[key] ?? 0);
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-48 sm:h-64 shimmer-bg rounded-sm" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1
        className="font-display text-3xl sm:text-4xl tracking-wider mb-2"
        style={{ fontFamily: 'Bebas Neue, serif' }}
      >
        Insights
      </h1>
      <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
        Customer and editor contributions. Sort by column to see top contributors.
      </p>

      {/* Top customers */}
      <div className="border border-border rounded-sm bg-card overflow-hidden mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Customer contribution
          </h2>
          <div className="flex gap-2">
            {(['totalSpent', 'orders', 'products'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortCustomerBy(key)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-sm border transition-colors',
                  sortCustomerBy === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 border-border hover:bg-secondary'
                )}
              >
                {key === 'totalSpent' ? 'Total spent' : key === 'orders' ? 'Orders' : 'Products'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">Customer</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Phone</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Orders</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Total spent</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Products</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.slice(0, 20).map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{c.phone || '—'}</td>
                  <td className="px-6 py-4">{c._count?.orders ?? 0}</td>
                  <td className="px-6 py-4 font-medium">৳{(c.totalSpent ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-4">{c.productsPurchased ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor contribution */}
      <div className="border border-border rounded-sm bg-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="font-medium flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Editor contribution
          </h2>
          <div className="flex gap-2">
            {(['total', 'creates', 'updates', 'deletes'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortEditorBy(key)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-sm border transition-colors',
                  sortEditorBy === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 border-border hover:bg-secondary'
                )}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Editor</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Role</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Creates</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Updates</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Deletes</th>
                <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedEditors.map((e) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.email}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{e.role}</td>
                  <td className="px-6 py-4">{e.creates}</td>
                  <td className="px-6 py-4">{e.updates}</td>
                  <td className="px-6 py-4">{e.deletes}</td>
                  <td className="px-6 py-4 font-medium">{e.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editors.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No editor activity yet.</div>
        )}
      </div>
    </div>
  );
}
