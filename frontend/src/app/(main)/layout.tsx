'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useRefreshToken, useTokenStatus } from '@/hooks/useAuth';
import { Sidebar, Header } from '@/components/layout';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, accessToken } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const { isExpired, isExpiring } = useTokenStatus();
  const refreshToken = useRefreshToken();

  // Check authentication on mount and route change
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }

    // If token is expired, try to refresh
    if (isExpired) {
      refreshToken.mutate(undefined, {
        onError: () => {
          router.replace('/login');
        },
      });
    }
    // If token is expiring soon, refresh proactively
    else if (isExpiring) {
      refreshToken.mutate(undefined, {
        onError: (error) => {
          console.error('Failed to refresh token on route change:', error);
        },
      });
    }
  }, [isAuthenticated, accessToken, pathname, isExpired, isExpiring, router, refreshToken]);

  if (!isAuthenticated || !accessToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <Header />
      <main className={`pt-16 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
}
