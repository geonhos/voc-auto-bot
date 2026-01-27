'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { MSWProvider } from './MSWProvider';
import { ToastContextProvider } from '@/hooks/useToast';
import { Toaster } from '@/components/ui/Toaster';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MSWProvider>
      <QueryProvider>
        <ToastContextProvider>
          {children}
          <Toaster />
        </ToastContextProvider>
      </QueryProvider>
    </MSWProvider>
  );
}
