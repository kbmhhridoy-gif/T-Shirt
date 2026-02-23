'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, LogIn, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, clearError, logout } from '@/store/slices/authSlice';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isLoading, error, isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const redirect = searchParams.get('redirect') || null;
  const isBlocked = searchParams.get('blocked') === '1';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') router.push('/dashboard');
      else if (user.role === 'EDITOR') router.push('/editor/products');
      else router.push(redirect || '/');
    }
  }, [isAuthenticated, user, router, redirect]);

  useEffect(() => {
    if (isBlocked) {
      dispatch(logout());
    }
  }, [isBlocked, dispatch]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Login Failed', description: error, variant: 'destructive' });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const onSubmit = (data: FormData) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card border-r border-border p-12">
        <Link href="/">
          <h1
            className="font-display text-3xl tracking-widest"
            style={{ fontFamily: 'Bebas Neue, serif' }}
          >
            THREAD<span className="text-primary">HAUS</span>
          </h1>
        </Link>

        <div>
          <p className="font-display text-6xl tracking-wider text-foreground mb-4" style={{ fontFamily: 'Bebas Neue, serif' }}>
            Welcome
            <br />
            Back.
          </p>
          <p className="text-muted-foreground">
            Premium pieces await. Sign in to continue.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="mb-1">Demo Admin: admin@threadhaus.com / admin123</p>
          <p>Demo Editor: editor@threadhaus.com / editor123</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <h1
                className="font-display text-2xl tracking-widest mb-2"
                style={{ fontFamily: 'Bebas Neue, serif' }}
              >
                THREAD<span className="text-primary">HAUS</span>
              </h1>
            </Link>
          </div>

          <h2 className="text-2xl font-semibold mb-2">Sign In</h2>
          {isBlocked && (
            <div className="mb-6 p-4 rounded-md bg-destructive/15 border border-destructive/30 text-destructive flex items-start gap-3">
              <Ban className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Account blocked</p>
                <p className="text-sm mt-1">Your account has been blocked by admin. Contact support.</p>
              </div>
            </div>
          )}
          <p className="text-muted-foreground text-sm mb-8">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="mt-1"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-primary gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
