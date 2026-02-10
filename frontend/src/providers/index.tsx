'use client';

import { type ReactNode } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';
import { ToastContextProvider } from '@/hooks/useToast';

import { MSWProvider } from './MSWProvider';
import { QueryProvider } from './QueryProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MSWProvider>
      <QueryProvider>
        <ErrorBoundary>
          <ToastContextProvider>
            {children}
            <Toaster />
          </ToastContextProvider>
        </ErrorBoundary>
      </QueryProvider>
    </MSWProvider>
  );
}
