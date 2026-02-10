'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest, LoginResponse } from '@/types';

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
      login(data.user);

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
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      logout();
      router.push('/login');
    },
  });
}

// Refresh token mutation (cookie-based, no client-side token handling)
export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/refresh');
    },
  });
}
