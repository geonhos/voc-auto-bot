'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import type { Voc } from '@/types';
import { vocFormSchema, VocFormSchemaType } from '@/types/vocForm';

import { useVocCreation } from './useVocMutation';

const DRAFT_STORAGE_KEY = 'voc-form-draft';
const DRAFT_DEBOUNCE_MS = 2000;

type DraftData = Omit<VocFormSchemaType & { parentCategoryId?: number | null }, 'files'> & {
  savedAt: string;
};

function saveDraft(data: Omit<DraftData, 'savedAt'>): string {
  const savedAt = new Date().toISOString();
  const draft: DraftData = { ...data, savedAt };
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  return savedAt;
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

function removeDraft(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

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
  hasDraft: boolean;
  draftSavedAt: string | null;
  restoreDraft: () => void;
  clearDraft: () => void;
}

export function useVocFormViewModel({
  onSuccess,
}: UseVocFormViewModelProps): UseVocFormViewModelReturn {
  const [error, setError] = useState<Error | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean>(() => loadDraft() !== null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(() => loadDraft()?.savedAt ?? null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<VocFormSchemaType & { parentCategoryId?: number | null; files?: File[] }>({
    resolver: zodResolver(vocFormSchema),
    defaultValues: {
      title: '',
      content: '',
      categoryId: null,
      parentCategoryId: null,
      priority: 'NORMAL',
      customerName: '',
      customerEmail: '',
      files: [],
    },
  });

  const clearDraft = useCallback(() => {
    removeDraft();
    setHasDraft(false);
    setDraftSavedAt(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (!draft) return;
    const { savedAt: _, ...values } = draft;
    form.reset({ ...values, files: [] });
  }, [form]);

  // Debounced auto-save
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        const { files: _files, ...draftValues } = values as VocFormSchemaType & { parentCategoryId?: number | null; files?: File[] };
        const hasContent = draftValues.title || draftValues.content || draftValues.customerName || draftValues.customerEmail;
        if (hasContent) {
          const savedAt = saveDraft(draftValues);
          setHasDraft(true);
          setDraftSavedAt(savedAt);
        }
      }, DRAFT_DEBOUNCE_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [form]);

  const { createWithFiles, isPending } = useVocCreation({
    onSuccess: (voc) => {
      setError(null);
      clearDraft();
      onSuccess(voc);
      resetForm();
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
      customerName: values.customerName || 'Anonymous',
      customerEmail: values.customerEmail!,
      files: values.files || [],
    };

    await createWithFiles(requestData);
  };

  const resetForm = () => {
    form.reset({
      title: '',
      content: '',
      categoryId: null,
      parentCategoryId: null,
      priority: 'NORMAL',
      customerName: '',
      customerEmail: '',
      files: [],
    });
  };

  const reset = () => {
    clearDraft();
    resetForm();
  };

  return {
    form,
    isSubmitting: isPending,
    error,
    handleSubmit,
    reset,
    hasDraft,
    draftSavedAt,
    restoreDraft,
    clearDraft,
  };
}
