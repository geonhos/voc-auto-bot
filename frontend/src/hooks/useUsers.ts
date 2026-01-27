'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { User, CreateUserRequest, UpdateUserRequest, UserListParams, PageResponse } from '@/types';

const USERS_QUERY_KEY = 'users';

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await api.get<PageResponse<User>>('/users', params as Record<string, unknown>);
      return response;
    },
  });
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, userId],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await api.post<User>('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: UpdateUserRequest }) => {
      const response = await api.put<User>(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post<{ temporaryPassword: string }>(
        `/users/${userId}/reset-password`
      );
      return response.data;
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await api.patch<User>(`/users/${userId}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post<User>(`/users/${userId}/unlock`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}
