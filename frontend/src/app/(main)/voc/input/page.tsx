import { VocForm } from '@/components/voc/VocForm';

export const metadata = {
  title: 'VOC 등록 | VOC Auto Bot',
  description: '새로운 고객의 소리(VOC)를 등록합니다',
};

/**
 * @description VOC 입력 페이지 (SC-02)
 */
export default function VocInputPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">VOC 등록</h1>
          <p className="mt-2 text-sm text-gray-600">
            고객의 소리(Voice of Customer)를 등록해주세요. 담당자가 신속하게 처리하겠습니다.
          </p>
        </div>

        {/* VOC 입력 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <VocForm />
        </div>

        {/* 안내 사항 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">안내 사항</h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• 등록된 VOC는 담당자 배정 후 처리가 진행됩니다</li>
            <li>• 티켓 번호를 통해 언제든지 처리 현황을 조회하실 수 있습니다</li>
            <li>• 긴급한 사항은 우선순위를 '긴급'으로 설정해주세요</li>
            <li>• 첨부파일은 최대 5개, 각 파일당 10MB까지 업로드 가능합니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
