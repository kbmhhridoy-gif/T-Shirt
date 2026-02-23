'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Package } from 'lucide-react';
import axios from 'axios';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, token } = useAppSelector((s) => s.auth);
  const { itemCount } = useAppSelector((s) => s.cart);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      if (token) {
        await axios.post(
          '/api/auth/logout',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      // ignore logout API errors
    } finally {
      dispatch(logout());
      router.push('/');
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'ADMIN') return '/dashboard';
    if (user?.role === 'EDITOR') return '/editor/products';
    return '/orders';
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className="font-display text-2xl tracking-widest text-foreground"
              style={{ fontFamily: 'Bebas Neue, serif' }}
            >
              THREAD
              <span className="text-primary">HAUS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="nav-link text-sm tracking-widest uppercase">
              Shop
            </Link>
            <Link href="/products?featured=true" className="nav-link text-sm tracking-widest uppercase">
              Featured
            </Link>
            <Link href="/products?new=true" className="nav-link text-sm tracking-widest uppercase">
              New In
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-mono">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="relative w-7 h-7">
                      {user.avatar || user.image ? (
                        <img
                          src={(user.avatar as string) || (user.image as string)}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover border border-primary/40 bg-background"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background ${
                          user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                    </div>
                    <span className="hidden sm:block text-sm">{user.name.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  {['ADMIN', 'EDITOR'].includes(user.role) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={getDashboardLink()} className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          {user.role === 'ADMIN' ? 'Dashboard' : 'Editor Panel'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm tracking-wider">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="btn-primary py-2 px-5 text-xs">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            <Link href="/products" className="block px-2 py-2 text-sm tracking-widest uppercase">
              Shop
            </Link>
            <Link href="/products?featured=true" className="block px-2 py-2 text-sm tracking-widest uppercase">
              Featured
            </Link>
            <Link href="/products?new=true" className="block px-2 py-2 text-sm tracking-widest uppercase">
              New In
            </Link>
            {!isAuthenticated && (
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
