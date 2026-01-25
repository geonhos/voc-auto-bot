import { VocStatusLookup } from '@/components/voc/VocStatusLookup';

export const metadata = {
  title: 'VOC 상태 조회 - VOC Auto Bot',
  description: 'Ticket ID로 VOC의 현재 처리 상태를 조회합니다',
};

/**
 * @description Public VOC status lookup page (SC-03)
 * No authentication required
 */
export default function VocStatusPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">VOC 상태 조회</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Ticket ID로 VOC의 현재 처리 상태를 빠르게 조회하세요.
          </p>
        </div>

        <VocStatusLookup />
      </div>
    </div>
  );
}
