'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { token } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: 'Thread Haus',
    adminEmail: '',
    bkashNumber: '',
    nagadNumber: '',
    paymentBkashOn: true,
    paymentNagadOn: true,
    paymentCardOn: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const d = res.data;
        if (d.siteName !== undefined) setSettings((s) => ({ ...s, ...d }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.patch('/api/admin/settings', settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'Settings saved' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl tracking-wider" style={{ fontFamily: 'Bebas Neue, serif' }}>Settings</h1>
        <p className="text-muted-foreground mt-1">Website name, email, and payment options</p>
      </div>

      <div className="space-y-6 border border-border rounded-sm p-6 bg-card">
        <div>
          <Label>Website Name</Label>
          <Input
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            className="mt-1"
            placeholder="Thread Haus"
          />
        </div>
        <div>
          <Label>Admin Email</Label>
          <Input
            type="email"
            value={settings.adminEmail}
            onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
            className="mt-1"
            placeholder="admin@example.com"
          />
          <p className="text-xs text-muted-foreground mt-1">Order notifications and reports are sent here</p>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="font-medium mb-3">Payment Numbers (shown to customers)</h3>
          <div className="space-y-3">
            <div>
              <Label>bKash Number</Label>
              <Input
                value={settings.bkashNumber}
                onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                className="mt-1"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <Label>Nagad Number</Label>
              <Input
                value={settings.nagadNumber}
                onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                className="mt-1"
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="font-medium mb-3">Payment Methods (ON/OFF)</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Enable bKash</Label>
              <Switch checked={settings.paymentBkashOn} onCheckedChange={(v) => setSettings({ ...settings, paymentBkashOn: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable Nagad</Label>
              <Switch checked={settings.paymentNagadOn} onCheckedChange={(v) => setSettings({ ...settings, paymentNagadOn: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable Card (Stripe)</Label>
              <Switch checked={settings.paymentCardOn} onCheckedChange={(v) => setSettings({ ...settings, paymentCardOn: v })} />
            </div>
          </div>
        </div>
        <Button className="btn-primary gap-2" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
