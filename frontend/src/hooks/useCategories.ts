'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type { Category, CategoryTree, CreateCategoryRequest, UpdateCategoryRequest } from '@/types';

const CATEGORIES_QUERY_KEY = 'categories';

export function useCategories() {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, 'list'],
    queryFn: async () => {
      const response = await api.get<Category[]>('/categories');
      return response.data;
    },
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, 'tree'],
    queryFn: async () => {
      const response = await api.get<CategoryTree[]>('/categories/tree');
      return response.data;
    },
  });
}

export function useCategory(categoryId: number) {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, categoryId],
    queryFn: async () => {
      const response = await api.get<Category>(`/categories/${categoryId}`);
      return response.data;
    },
    enabled: !!categoryId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryRequest) => {
      const response = await api.post<Category>('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: number; data: UpdateCategoryRequest }) => {
      const response = await api.put<Category>(`/categories/${categoryId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: number) => {
      await api.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    },
  });
}
