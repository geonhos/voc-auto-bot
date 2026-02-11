'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import type { Voc } from '@/types';
import { vocFormSchema, VocFormSchemaType } from '@/types/vocForm';

import { useVocCreation } from './useVocMutation';

const DRAFT_STORAGE_KEY = 'voc-form-draft';
const DRAFT_DEBOUNCE_MS = 2000;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type DraftData = Pick<VocFormSchemaType, 'title' | 'content' | 'categoryId' | 'priority'> & {
  parentCategoryId?: number | null;
  channel?: string;
  savedAt: string;
};

/** SSR guard: returns true only when running in a browser environment */
function isClient(): boolean {
  return typeof window !== 'undefined';
}

function saveDraft(data: Omit<DraftData, 'savedAt'>): string | null {
  if (!isClient()) return null;
  try {
    const savedAt = new Date().toISOString();
    const draft: DraftData = { ...data, savedAt };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return savedAt;
  } catch {
    // QuotaExceededError or other storage failures
    return null;
  }
}

function loadDraft(): DraftData | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed.savedAt !== 'string') return null;
    const draft = parsed as unknown as DraftData;
    // Check TTL expiration
    if (Date.now() - new Date(draft.savedAt).getTime() > DRAFT_TTL_MS) {
      removeDraft();
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function removeDraft(): void {
  if (!isClient()) return;
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
  const [initialDraft] = useState(() => loadDraft());
  const [hasDraft, setHasDraft] = useState(initialDraft !== null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(initialDraft?.savedAt ?? null);
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
    form.reset({ ...values, customerName: '', customerEmail: '', files: [] });
  }, [form]);

  // Debounced auto-save (PII excluded: customerEmail, customerName)
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        const { files: _files, customerEmail: _email, customerName: _name, ...rest } = values as VocFormSchemaType & { parentCategoryId?: number | null; files?: File[] };
        const draftValues: Omit<DraftData, 'savedAt'> = {
          title: rest.title ?? '',
          content: rest.content ?? '',
          categoryId: rest.categoryId ?? null,
          parentCategoryId: rest.parentCategoryId ?? null,
          priority: rest.priority ?? 'NORMAL',
        };
        const hasContent = draftValues.title || draftValues.content;
        if (hasContent) {
          const savedAt = saveDraft(draftValues);
          if (savedAt) {
            setHasDraft(true);
            setDraftSavedAt(savedAt);
          }
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
