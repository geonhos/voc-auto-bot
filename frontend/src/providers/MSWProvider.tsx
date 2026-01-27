'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface MSWProviderProps {
  children: ReactNode;
}

export function MSWProvider({ children }: MSWProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initMSW() {
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        // Only import browser worker, not the node server
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: {
            url: '/mockServiceWorker.js',
          },
        });
      }
      setIsReady(true);
    }

    initMSW();
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
