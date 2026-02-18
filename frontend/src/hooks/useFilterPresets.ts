'use client';

import { useState, useCallback } from 'react';

import type { VocFilterState } from '@/types';

export interface FilterPreset {
  id: string;
  name: string;
  filters: VocFilterState;
  createdAt: string;
}

const STORAGE_KEY = 'voc-filter-presets';

function loadPresets(): FilterPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistPresets(presets: FilterPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function useFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>(loadPresets);

  const savePreset = useCallback((name: string, filters: VocFilterState) => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    setPresets((prev) => {
      const updated = [...prev, newPreset];
      persistPresets(updated);
      return updated;
    });
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistPresets(updated);
      return updated;
    });
  }, []);

  return { presets, savePreset, deletePreset };
}
