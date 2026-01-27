'use client';

import * as React from 'react';

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toasts: ToastProps[];
  toast: (props: Omit<ToastProps, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      id,
      duration: 5000,
      ...props,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastContextProvider');
  }

  return {
    toast: context.toast,
    success: (description: string, title?: string) => {
      context.toast({
        title: title || '성공',
        description,
        variant: 'success',
      });
    },
    error: (description: string, title?: string) => {
      context.toast({
        title: title || '오류',
        description,
        variant: 'error',
      });
    },
    warning: (description: string, title?: string) => {
      context.toast({
        title: title || '경고',
        description,
        variant: 'warning',
      });
    },
    dismiss: context.dismiss,
    toasts: context.toasts,
  };
}
