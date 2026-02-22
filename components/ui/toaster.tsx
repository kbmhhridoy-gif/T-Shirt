'use client';

import { useToast } from './use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-sm border p-4 shadow-lg backdrop-blur-sm transition-all animate-fade-in',
            toast.variant === 'destructive'
              ? 'bg-destructive/90 border-destructive text-destructive-foreground'
              : 'bg-card/95 border-border text-foreground'
          )}
        >
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-sm font-semibold">{toast.title}</p>
            )}
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
