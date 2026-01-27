'use client';

import { useRouter } from 'next/navigation';
import { useSimilarVocs } from './useSimilarVocs';

export interface UseSimilarVocModalViewModelProps {
  vocId: number;
  isOpen: boolean;
  onClose: () => void;
}

export interface UseSimilarVocModalViewModelReturn {
  similarVocs: ReturnType<typeof useSimilarVocs>['data'];
  isLoading: boolean;
  handleViewAll: () => void;
  handleVocClick: (similarVocId: number) => void;
  handleClose: () => void;
}

/**
 * @description ViewModel for SimilarVocModal
 * Manages modal state and navigation for similar VOC feature
 */
export function useSimilarVocModalViewModel({
  vocId,
  isOpen,
  onClose,
}: UseSimilarVocModalViewModelProps): UseSimilarVocModalViewModelReturn {
  const router = useRouter();

  const { data: similarVocs, isLoading } = useSimilarVocs(vocId, {
    limit: 5,
    enabled: isOpen,
  });

  const handleViewAll = () => {
    router.push(`/voc/${vocId}/similar`);
    onClose();
  };

  const handleVocClick = (similarVocId: number) => {
    router.push(`/voc/${similarVocId}`);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return {
    similarVocs,
    isLoading,
    handleViewAll,
    handleVocClick,
    handleClose,
  };
}
