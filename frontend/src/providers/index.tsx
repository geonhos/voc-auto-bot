'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { MSWProvider } from './MSWProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MSWProvider>
      <QueryProvider>{children}</QueryProvider>
    </MSWProvider>
  );
}
