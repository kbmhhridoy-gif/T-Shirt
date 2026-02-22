'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import { logout, getMe } from '@/store/slices/authSlice';
import axios from 'axios';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, user: authUser } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login?redirect=/profile');
      return;
    }
    axios
      .get('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const u = res.data?.user;
        if (u) setProfile({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '' });
      })
      .catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [token, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: profile.name, phone: profile.phone, address: profile.address };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await axios.patch('/api/profile', payload, { headers: { Authorization: `Bearer ${token}` } });
      dispatch(getMe());
      toast({ title: 'Profile updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword.trim()) {
      toast({ title: 'Enter your password to delete account', variant: 'destructive' });
      return;
    }
    setDeleting(true);
    try {
      await axios.delete('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword },
      });
      dispatch(logout());
      toast({ title: 'Account deleted successfully' });
      router.push('/');
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="font-display text-4xl tracking-wider mb-8" style={{ fontFamily: 'Bebas Neue, serif' }}>
        My Profile
      </h1>

      <form onSubmit={handleSave} className="space-y-6 border border-border rounded-sm p-6 bg-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-medium">{authUser?.name || profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled className="mt-1 bg-muted" />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
            placeholder="01XXXXXXXXX"
            maxLength={11}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={profile.address}
            onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
            placeholder="Your address"
            className="mt-1"
          />
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <h3 className="font-medium">Change Password</h3>
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Only if changing password"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="mt-1"
            />
          </div>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </form>

      <div className="mt-8 border border-destructive/50 rounded-sm p-6 bg-destructive/5">
        <h3 className="font-medium text-destructive mb-2">Delete Account</h3>
        <p className="text-sm text-muted-foreground mb-4">This action cannot be undone. All your data will be permanently removed.</p>
        {!showDeleteConfirm ? (
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete Account
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password to confirm"
              className="max-w-xs"
            />
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDelete} disabled={deleting || !deletePassword.trim()}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Delete'}
              </Button>
              <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
