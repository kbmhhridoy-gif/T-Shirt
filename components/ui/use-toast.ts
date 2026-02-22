// components/ui/use-toast.ts
'use client';

import * as React from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

type ToastState = { toasts: Toast[] };
type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, 5) };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
};

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

interface ToastInput {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

function toast({ title, description, variant = 'default' }: ToastInput) {
  const id = Math.random().toString(36).slice(2);
  dispatch({ type: 'ADD', toast: { id, title, description, variant } });
  setTimeout(() => dispatch({ type: 'REMOVE', id }), 4000);
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return { toasts: state.toasts, toast };
}

export { useToast, toast };
