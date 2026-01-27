'use client';

import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, FormEvent } from 'react';
import { vocFormSchema, VocFormSchemaType } from '@/types/vocForm';
import { useVocCreation } from './useVocMutation';
import type { Voc } from '@/types';

/**
 * @description Manages VOC form state and submission
 */
interface UseVocFormViewModelProps {
  onSuccess: (voc: Voc) => void;
}

interface UseVocFormViewModelReturn {
  form: UseFormReturn<VocFormSchemaType & { parentCategoryId?: number | null; files?: File[] }>;
  isSubmitting: boolean;
  error: Error | null;
  handleSubmit: (e: FormEvent) => Promise<void>;
  reset: () => void;
}

export function useVocFormViewModel({
  onSuccess,
}: UseVocFormViewModelProps): UseVocFormViewModelReturn {
  const [error, setError] = useState<Error | null>(null);

  const form = useForm<VocFormSchemaType & { parentCategoryId?: number | null; files?: File[] }>({
    resolver: zodResolver(vocFormSchema),
    defaultValues: {
      title: '',
      content: '',
      categoryId: null,
      parentCategoryId: null,
      priority: 'MEDIUM',
      customerName: '',
      customerEmail: '',
      files: [],
    },
  });

  const { createWithFiles, isPending } = useVocCreation({
    onSuccess: (voc) => {
      setError(null);
      onSuccess(voc);
      reset();
    },
    onError: (err) => {
      setError(err);
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const values = form.getValues();

    // API 요청 데이터 구성
    const requestData = {
      title: values.title,
      content: values.content,
      categoryId: values.categoryId!,
      priority: values.priority,
      channel: 'WEB' as const,
      status: 'RECEIVED' as const,
      customerName: values.customerName || 'Anonymous',
      customerEmail: values.customerEmail || 'customer@example.com',
      files: values.files || [],
    };

    await createWithFiles(requestData);
  };

  const reset = () => {
    form.reset({
      title: '',
      content: '',
      categoryId: null,
      parentCategoryId: null,
      priority: 'MEDIUM',
      customerName: '',
      customerEmail: '',
      files: [],
    });
  };

  return {
    form,
    isSubmitting: isPending,
    error,
    handleSubmit,
    reset,
  };
}
