'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '@/types';

// Login mutation
export function useLogin() {
  const router = useRouter();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<LoginResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);

      // Redirect based on role
      switch (data.user.role) {
        case 'ADMIN':
          router.push('/dashboard');
          break;
        case 'MANAGER':
          router.push('/voc/kanban');
          break;
        case 'OPERATOR':
        default:
          router.push('/voc/kanban');
          break;
      }
    },
  });
}

// Logout mutation
export function useLogout() {
  const router = useRouter();
  const { logout, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    },
    onSettled: () => {
      logout();
      router.push('/login');
    },
  });
}

// Refresh token mutation
export function useRefreshToken() {
  const { setTokens, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      const data: RefreshTokenRequest = { refreshToken };
      const response = await api.post<RefreshTokenResponse>('/auth/refresh', data);
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
  });
}
