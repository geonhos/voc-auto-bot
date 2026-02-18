import { COLORS, RADIUS } from './utils/constants';
import { solidPaint, createAutoLayoutFrame, createText, finalize } from './utils/helpers';

// ── Annotation Data ─────────────────────────────────────────────────

type Tag = '기능' | 'UX' | 'API' | '기술' | 'AI';

const TAG_COLORS: Record<Tag, { bg: string; text: string }> = {
  '기능': { bg: '#dde8f0', text: '#3a5068' },
  'UX':   { bg: '#e8e0f0', text: '#5a3d7a' },
  'API':  { bg: '#e0ece0', text: '#3d6b3d' },
  '기술': { bg: '#f0e8d9', text: '#7d6333' },
  'AI':   { bg: '#e0e8f0', text: '#2d5a8e' },
};

interface Note {
  tag: Tag;
  text: string;
}

interface ScreenAnnotation {
  title: string;
  notes: Note[];
}

const ANNOTATIONS: Record<string, ScreenAnnotation> = {
  'login': {
    title: 'Login',
    notes: [
      { tag: 'API', text: 'JWT 토큰 기반 인증 (Access + Refresh)' },
      { tag: '기능', text: '로그인 상태 유지: Refresh Token 7일' },
      { tag: '기능', text: '비밀번호 찾기 → 이메일 재설정 링크 발송' },
      { tag: 'UX', text: '입력 필드 실시간 유효성 검사' },
      { tag: '기술', text: '인증 실패 5회 → 계정 일시 잠금 (30분)' },
    ],
  },
  'dashboard': {
    title: 'Dashboard',
    notes: [
      { tag: '기능', text: 'KPI 카드: 총 접수/처리 중/완료율/평균 처리시간' },
      { tag: 'UX', text: '차트 클릭 → 해당 필터 적용된 VOC 목록으로 이동' },
      { tag: '기능', text: '상태별 도넛 차트 + 우선순위별 바 차트' },
      { tag: '기능', text: '일별 VOC 추이 라인 차트 (최근 30일)' },
      { tag: '기능', text: '카테고리별 VOC 분포 차트' },
      { tag: 'AI', text: 'AI 분석 완료율 표시: 전체 VOC 중 AI 자동 분류가 완료된 비율' },
      { tag: 'UX', text: '최근 VOC 5건 표시, "전체 보기" → VOC 목록' },
      { tag: 'API', text: 'GET /api/dashboard/stats (기간 파라미터)' },
    ],
  },
  'voc-input': {
    title: 'VOC Input',
    notes: [
      { tag: 'UX', text: 'Email-First 게이트: 이메일을 최상단에 배치, 입력 즉시 고객 VOC 이력 자동 조회' },
      { tag: 'UX', text: '미해결 VOC 경고 배너: 동일 고객의 NEW/IN_PROGRESS/PENDING 상태 VOC가 있으면 amber 배너로 중복 접수 경고' },
      { tag: 'UX', text: '카테고리 카드 선택: 5대 대분류를 시각적 카드 그리드로 표시 (아이콘+설명), 선택 후 중분류 드롭다운 표시' },
      { tag: 'AI', text: '실시간 AI 카테고리 추천: 제목+내용 입력 시 1초 디바운스 후 LLM(EXAONE 3.5)이 카테고리 자동 분류 → 카드 자동 하이라이트' },
      { tag: 'AI', text: '우선순위 자동 추천: 카테고리 기반 기본값 + ERROR+긴급키워드(결제,장애,접속불가) → URGENT 에스컬레이션' },
      { tag: 'AI', text: '저장 즉시 @Async 분석 트리거: Fallback Chain (① RAG 벡터검색 → ② Rule-Based → ③ Direct LLM) + 감성 분석' },
      { tag: 'AI', text: 'VOC 텍스트 → BGE-M3 임베딩(1024차원) → pgvector 코사인 유사도 검색' },
      { tag: 'UX', text: '임시저장: PII 제외(이메일,이름)로 localStorage 자동 저장 (2초 디바운스, 24시간 TTL)' },
      { tag: 'API', text: 'POST /api/vocs → 201 Created, GET /vocs?customerEmail= → 고객 이력 조회 (SHA-256 해시 비교)' },
    ],
  },
  'voc-list': {
    title: 'VOC List',
    notes: [
      { tag: '기능', text: '다중 필터: 상태, 우선순위, 카테고리, 기간' },
      { tag: '기능', text: '키워드 검색: ID, 제목 대상 (debounce 300ms)' },
      { tag: 'AI', text: '검색 시 LLM 역할: 키워드 검색은 DB LIKE 쿼리, "유사 VOC"는 pgvector 코사인 유사도 기반 시맨틱 검색' },
      { tag: 'UX', text: '체크박스 선택 → 일괄 상태 변경 가능' },
      { tag: 'UX', text: 'VOC ID 클릭 → 상세 페이지 이동' },
      { tag: 'UX', text: '상태/우선순위 컬러 뱃지로 시각적 구분' },
      { tag: '기능', text: '페이지네이션 20건/페이지, 정렬 기능' },
      { tag: 'API', text: 'GET /api/vocs?status=&priority=&page=&size=' },
    ],
  },
  'voc-kanban': {
    title: 'VOC Kanban',
    notes: [
      { tag: '기능', text: '6컬럼: 접수→분석중→처리중→완료/실패/반려' },
      { tag: 'UX', text: '드래그앤드롭으로 상태 변경 (권한 체크)' },
      { tag: 'UX', text: '카드 클릭 → VOC 상세 페이지 이동' },
      { tag: 'UX', text: '컬럼 헤더에 카운트 뱃지 표시' },
      { tag: '기능', text: '카드: ID, 제목, 우선순위, 담당자, 날짜' },
      { tag: 'UX', text: '목록/칸반 뷰 토글 (상태 유지)' },
      { tag: 'API', text: 'PATCH /api/vocs/{id}/status (상태 변경)' },
    ],
  },
  'voc-detail': {
    title: 'VOC Detail',
    notes: [
      { tag: '기능', text: 'VOC 원문 내용 + 접수 메타정보 표시' },
      { tag: 'AI', text: 'AI 분석 결과: LLM이 추천한 카테고리/우선순위 + 신뢰도(%) 표시' },
      { tag: 'AI', text: '분석 방법 3단계: ① RAG — pgvector에서 유사 VOC 검색 후 해당 분류 참조 ② Rule-Based — 키워드 매칭 규칙 ③ Direct LLM — GPT가 직접 판단' },
      { tag: 'AI', text: '유사 VOC 검색: VOC 텍스트의 임베딩 벡터를 pgvector에서 코사인 유사도로 비교, 상위 5건 반환' },
      { tag: '기능', text: '처리 이력 타임라인 (상태 변경, 담당자 배정)' },
      { tag: '기능', text: '담당자 배정/변경 (매니저 이상 권한)' },
      { tag: '기능', text: '내부 메모 기능 (팀 소통용)' },
      { tag: 'UX', text: '"이메일 작성" 버튼 → 이메일 폼으로 VOC 컨텍스트 전달' },
      { tag: 'API', text: 'GET /api/vocs/{id}, GET /api/vocs/{id}/similar' },
    ],
  },
  'email-compose': {
    title: 'Email Compose',
    notes: [
      { tag: 'AI', text: 'AI 초안 생성: LLM이 VOC 원문 + AI 분석 결과를 읽고 고객 응대 이메일 초안을 자동 작성' },
      { tag: 'AI', text: 'LLM 프롬프트에 VOC 카테고리, 우선순위, 유사 VOC 처리 이력을 컨텍스트로 포함' },
      { tag: '기능', text: '템플릿 선택 (사전 정의 이메일 양식)' },
      { tag: '기능', text: '우측 패널: 관련 VOC 정보 + AI 분석 요약' },
      { tag: '기능', text: '첨부파일 업로드 (드래그앤드롭)' },
      { tag: 'UX', text: '임시저장 → 나중에 이어 작성 가능' },
      { tag: 'UX', text: '미리보기 → 발송 전 최종 확인' },
      { tag: 'API', text: 'POST /api/emails/draft, POST /api/emails/send' },
    ],
  },
  'admin-users': {
    title: 'Admin Users',
    notes: [
      { tag: '기능', text: '역할: ADMIN, MANAGER, ANALYST, OPERATOR' },
      { tag: '기능', text: '사용자 활성/비활성 토글' },
      { tag: 'UX', text: '모달을 통한 사용자 정보 편집' },
      { tag: '기능', text: '최근 로그인 일시 표시' },
      { tag: '기술', text: 'ADMIN만 사용자 관리 접근 가능' },
      { tag: 'API', text: 'GET/POST/PUT/DELETE /api/admin/users' },
    ],
  },
  'admin-categories': {
    title: 'Admin Categories',
    notes: [
      { tag: '기능', text: '계층형 카테고리 트리 (상위/하위 관계)' },
      { tag: '기능', text: '카테고리별 VOC 건수 실시간 표시' },
      { tag: 'AI', text: 'AI 자동 분류 키워드 설정: 관리자가 카테고리별 키워드를 등록하면 Rule-Based 분석에서 매칭에 활용' },
      { tag: 'AI', text: 'RAG 분석 시 이 카테고리 키워드가 유사 VOC 검색 결과의 가중치에 영향' },
      { tag: '기능', text: '통계: 총 VOC, 이번 달, 처리율, 평균 처리시간' },
      { tag: 'UX', text: '좌측 트리 선택 → 우측 편집 폼 연동' },
      { tag: 'API', text: 'GET/POST/PUT/DELETE /api/admin/categories' },
    ],
  },
  'public-status': {
    title: 'Public Status',
    notes: [
      { tag: '기능', text: '인증 불필요 — 외부 고객 접근용 공개 페이지' },
      { tag: '기능', text: '접수번호 입력 → VOC 처리 상태 조회' },
      { tag: 'UX', text: '진행 단계 시각화 (접수→분석→처리중→완료)' },
      { tag: '기능', text: '예상 완료일 표시' },
      { tag: '기술', text: '접수번호 형식 검증 (VOC-XXXX-XXXX)' },
      { tag: 'API', text: 'GET /api/public/vocs/{trackingId}/status' },
    ],
  },
};

// ── Builder ─────────────────────────────────────────────────────────

/**
 * Build an annotation panel for a screen.
 * Returns null if no annotations defined for the screen.
 */
export function buildAnnotationPanel(screenId: string): FrameNode | null {
  const data = ANNOTATIONS[screenId];
  if (!data) return null;

  const panel = createAutoLayoutFrame({
    name: `Notes — ${data.title}`,
    direction: 'VERTICAL',
    width: 280,
    padding: 16,
    gap: 10,
    fill: '#FAFAF9',
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  // Header
  const header = createAutoLayoutFrame({
    name: 'Header',
    direction: 'HORIZONTAL',
    gap: 8,
    width: 'FILL',
  });
  header.counterAxisAlignItems = 'CENTER';
  header.appendChild(createText({ text: '📋', size: 14 }));
  header.appendChild(createText({ text: '기능 메모', size: 14, weight: 700, color: COLORS.textPrimary }));
  panel.appendChild(header);

  // Divider
  const divider = createAutoLayoutFrame({
    name: 'Divider',
    direction: 'HORIZONTAL',
    width: 'FILL',
    height: 1,
    fill: COLORS.borderLight,
  });
  panel.appendChild(divider);

  // Notes
  for (let i = 0; i < data.notes.length; i++) {
    const note = data.notes[i];
    const tc = TAG_COLORS[note.tag];

    const row = createAutoLayoutFrame({
      name: `Note ${i + 1}`,
      direction: 'HORIZONTAL',
      gap: 8,
      width: 'FILL',
    });

    // Number
    const num = createAutoLayoutFrame({
      name: 'Num',
      direction: 'HORIZONTAL',
      width: 20,
      height: 20,
      fill: COLORS.primary,
      cornerRadius: 9999,
    });
    num.primaryAxisAlignItems = 'CENTER';
    num.counterAxisAlignItems = 'CENTER';
    num.appendChild(createText({ text: String(i + 1), size: 10, weight: 700, color: '#ffffff' }));
    row.appendChild(num);

    // Content column
    const content = createAutoLayoutFrame({
      name: 'Content',
      direction: 'VERTICAL',
      gap: 3,
      width: 'FILL',
    });

    // Tag badge
    const tag = createAutoLayoutFrame({
      name: 'Tag',
      direction: 'HORIZONTAL',
      padding: { top: 1, right: 6, bottom: 1, left: 6 },
      fill: tc.bg,
      cornerRadius: 3,
    });
    tag.appendChild(createText({ text: note.tag, size: 10, weight: 600, color: tc.text }));
    content.appendChild(tag);

    // Text
    content.appendChild(createText({ text: note.text, size: 12, color: COLORS.textPrimary, width: 'FILL' }));

    row.appendChild(content);
    panel.appendChild(row);
  }

  finalize(panel);
  return panel;
}
