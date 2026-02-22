'use client';

import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle, MoreVertical, Shield, VolumeX, Volume2, UserX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { token, user: currentUser } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);

      const { data } = await axios.get(`/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data.users);
    } catch (err) {
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [search, roleFilter]);

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await axios.patch('/api/users/block', { userId, isBlocked: !isBlocked }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: isBlocked ? 'User Unblocked' : 'User Blocked' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Failed', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleEditorAction = async (editorId: string, action: 'mute' | 'disable' | 'delete') => {
    try {
      if (action === 'delete') {
        await axios.delete(`/api/users/${editorId}`, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: 'Editor deleted' });
      } else {
        const target = users.find((u) => u.id === editorId);
        if (!target) return;
        const isMuted = action === 'mute' ? !target.isMuted : undefined;
        const isActive = action === 'disable' ? !target.isActive : undefined;
        await axios.patch(`/api/users/${editorId}`, { isMuted, isActive }, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: action === 'mute' ? (target.isMuted ? 'Editor unmuted' : 'Editor muted') : (target.isActive ? 'Editor disabled' : 'Editor enabled') });
      }
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Failed', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="font-display text-4xl tracking-wider"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          Customers
        </h1>
        <p className="text-muted-foreground mt-1">{users.length} users found</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['', 'CUSTOMER', 'EDITOR', 'ADMIN'].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className="text-xs"
            >
              {role || 'All'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-sm bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {['User', 'Phone', 'Role', 'Orders', 'Total spent', 'Products', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs text-muted-foreground uppercase tracking-wider px-6 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={cn(
                  'border-b border-border/50 hover:bg-secondary/30 transition-colors',
                  user.isBlocked && 'opacity-60'
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-sm font-mono">
                  {user.phone || '—'}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs rounded-sm',
                      user.role === 'ADMIN' && 'bg-primary/20 text-primary border-primary/30',
                      user.role === 'EDITOR' && 'bg-blue-400/20 text-blue-400',
                    )}
                  >
                    {user.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                    {user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {user._count?.orders || 0}
                </td>
                <td className="px-6 py-4 font-medium">
                  ৳{(user.totalSpent ?? 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {user.productsPurchased ?? 0}
                </td>
                <td className="px-6 py-4">
                  {user.role === 'EDITOR' ? (
                    <span className="flex items-center gap-2 text-xs">
                      {user.isBlocked ? (
                        <span className="text-red-400"><Ban className="h-3 w-3 inline" /> Blocked</span>
                      ) : !user.isActive ? (
                        <span className="text-orange-400"><UserX className="h-3 w-3 inline" /> Disabled</span>
                      ) : user.isMuted ? (
                        <span className="text-amber-400"><VolumeX className="h-3 w-3 inline" /> Muted</span>
                      ) : (
                        <span className="text-green-400"><CheckCircle className="h-3 w-3 inline" /> Active</span>
                      )}
                    </span>
                  ) : user.isBlocked ? (
                    <span className="text-red-400"><Ban className="h-3 w-3" /> Blocked</span>
                  ) : (
                    <span className="text-green-400"><CheckCircle className="h-3 w-3" /> Active</span>
                  )}
                </td>
                <td className="px-6 py-4 text-muted-foreground text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {currentUser?.id === user.id ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.role !== 'EDITOR' && (
                          <DropdownMenuItem
                            className={user.isBlocked ? 'text-green-400' : 'text-destructive'}
                            onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                          >
                            {user.isBlocked ? <><CheckCircle className="h-4 w-4 mr-2" /> Unblock</> : <><Ban className="h-4 w-4 mr-2" /> Block</>}
                          </DropdownMenuItem>
                        )}
                        {user.role === 'EDITOR' && (
                          <>
                            <DropdownMenuItem
                              className={user.isBlocked ? 'text-green-400' : 'text-destructive'}
                              onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                            >
                              {user.isBlocked ? <><CheckCircle className="h-4 w-4 mr-2" /> Unblock</> : <><Ban className="h-4 w-4 mr-2" /> Block</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={user.isMuted ? 'text-green-400' : ''}
                              onClick={() => handleEditorAction(user.id, 'mute')}
                            >
                              {user.isMuted ? <><Volume2 className="h-4 w-4 mr-2" /> Unmute</> : <><VolumeX className="h-4 w-4 mr-2" /> Mute</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={user.isActive ? 'text-amber-400' : 'text-green-400'}
                              onClick={() => handleEditorAction(user.id, 'disable')}
                            >
                              {user.isActive ? <><UserX className="h-4 w-4 mr-2" /> Disable</> : <><CheckCircle className="h-4 w-4 mr-2" /> Enable</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleEditorAction(user.id, 'delete')}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Editor
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        )}
        {!loading && users.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        )}
      </div>
    </div>
  );
}
