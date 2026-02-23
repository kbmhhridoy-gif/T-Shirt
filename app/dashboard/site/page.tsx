'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

export default function SiteEditorPage() {
  const { token } = useAppSelector((s) => s.auth);
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    bannerTitle: 'Thread Haus',
    bannerSubtitle: 'Premium T-Shirts Crafted for the Bold',
    announcementBar: '',
    featuredSection: 'Featured Collection',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.patch('/api/admin/settings', settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'Site settings saved' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6 sm:mb-8">
        <h1
          className="font-display text-3xl sm:text-4xl tracking-wider"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          Site Editor
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Customize homepage content and banners</p>
      </div>

      <div className="space-y-6 border border-border rounded-sm p-4 sm:p-6 bg-card">
        <div>
          <Label>Hero Banner Title</Label>
          <Input
            value={settings.bannerTitle}
            onChange={(e) => setSettings({ ...settings, bannerTitle: e.target.value })}
            className="mt-1"
            placeholder="Thread Haus"
          />
        </div>

        <div>
          <Label>Hero Banner Subtitle</Label>
          <Input
            value={settings.bannerSubtitle}
            onChange={(e) => setSettings({ ...settings, bannerSubtitle: e.target.value })}
            className="mt-1"
            placeholder="Premium T-Shirts Crafted for the Bold"
          />
        </div>

        <div>
          <Label>Announcement Bar (optional)</Label>
          <Input
            value={settings.announcementBar}
            onChange={(e) => setSettings({ ...settings, announcementBar: e.target.value })}
            className="mt-1"
            placeholder="Free shipping on orders over ৳2000 🎉"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shows as a banner at the top of the page
          </p>
        </div>

        <div>
          <Label>Featured Section Title</Label>
          <Input
            value={settings.featuredSection}
            onChange={(e) => setSettings({ ...settings, featuredSection: e.target.value })}
            className="mt-1"
            placeholder="Featured Collection"
          />
        </div>

        <Button
          className="btn-primary gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
