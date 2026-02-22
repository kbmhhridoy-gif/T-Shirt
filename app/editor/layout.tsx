// app/editor/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { useAppSelector } from '@/store/hooks';

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && !['ADMIN', 'EDITOR'].includes(user.role)) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!user || !['ADMIN', 'EDITOR'].includes(user.role)) return null;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role="EDITOR" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
