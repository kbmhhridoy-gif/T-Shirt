'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const adminNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Insights', href: '/dashboard/insights', icon: TrendingUp },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Site Editor', href: '/dashboard/site', icon: ImageIcon },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const editorNav = [
  { label: 'Products', href: '/editor/products', icon: Package },
  { label: 'Orders', href: '/editor/orders', icon: ShoppingBag },
];

interface AdminSidebarProps {
  role?: 'ADMIN' | 'EDITOR';
  /** When set, sidebar becomes a mobile drawer; open/onClose control visibility on small screens */
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ role = 'ADMIN', open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const nav = role === 'ADMIN' ? adminNav : editorNav;

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const asideContent = (
    <>
      {/* Logo + close on mobile */}
      <div className="p-4 sm:p-6 border-b border-border flex items-start justify-between">
        <div>
          <Link href="/" onClick={handleNavClick}>
            <h1
              className="font-display text-2xl tracking-widest"
              style={{ fontFamily: 'Bebas Neue, serif' }}
            >
              THREAD<span className="text-primary">HAUS</span>
            </h1>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            {role === 'ADMIN' ? 'Admin Panel' : 'Editor Panel'}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <div
                className={cn('admin-sidebar-item', isActive && 'active')}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Theme</span>
          <ThemeToggle />
        </div>
        <Link href="/" onClick={handleNavClick}>
          <div className="admin-sidebar-item text-xs">
            ← Back to Store
          </div>
        </Link>
        <button onClick={handleLogout} className="admin-sidebar-item w-full text-left text-destructive hover:bg-destructive/10 mt-1">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  if (onClose) {
    return (
      <>
        {/* Backdrop on mobile when open */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden
        />
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 w-64 min-h-screen bg-card border-r border-border flex flex-col transition-transform duration-200 ease-out lg:relative lg:z-auto lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {asideContent}
        </aside>
      </>
    );
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col flex-shrink-0">
      {asideContent}
    </aside>
  );
}
