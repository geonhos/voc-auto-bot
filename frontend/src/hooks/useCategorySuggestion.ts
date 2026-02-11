'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';

export interface CategorySuggestion {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  confidence: number;
  reason: string;
}

const CATEGORY_SUGGESTION_QUERY_KEY = 'category-suggestion';
const DEBOUNCE_MS = 1000;
const MIN_TITLE_LENGTH = 5;
const MIN_CONTENT_LENGTH = 10;

export function useCategorySuggestion(title: string, content: string) {
  const [debouncedTitle, setDebouncedTitle] = useState(title);
  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(title);
      setDebouncedContent(content);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [title, content]);

  const enabled =
    debouncedTitle.length >= MIN_TITLE_LENGTH &&
    debouncedContent.length >= MIN_CONTENT_LENGTH;

  const { data, isLoading, error } = useQuery({
    queryKey: [CATEGORY_SUGGESTION_QUERY_KEY, debouncedTitle, debouncedContent],
    queryFn: async () => {
      const response = await api.post<CategorySuggestion[]>('/vocs/suggest-category', {
        title: debouncedTitle,
        content: debouncedContent,
      });
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    suggestions: data ?? [],
    isLoading: enabled && isLoading,
    error,
  };
}
