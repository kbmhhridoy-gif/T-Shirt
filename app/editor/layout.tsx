// app/editor/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { AdminSidebar } from '@/components/admin-sidebar';
import { useAppSelector } from '@/store/hooks';

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !['ADMIN', 'EDITOR'].includes(user.role)) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!user || !['ADMIN', 'EDITOR'].includes(user.role)) return null;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role="EDITOR" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-sm text-foreground hover:bg-secondary"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display text-xl tracking-wider" style={{ fontFamily: 'Bebas Neue, serif' }}>
            Editor
          </span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
