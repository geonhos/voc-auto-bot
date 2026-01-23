# SC-11: 통계 대시보드

## 1. 화면 개요

### 1.1 화면 설명
관리자가 VOC 처리 현황을 한눈에 파악할 수 있는 통계 대시보드 화면입니다. 기간별 접수 추이, 카테고리별 분포, 상태별 현황, 평균 처리 시간 등의 주요 지표를 시각적으로 제공합니다.

### 1.2 관련 요구사항
- FR-1101: 기간별 VOC 접수 건수
- FR-1102: 카테고리별 VOC 현황
- FR-1103: 평균 처리 시간
- FR-1104: 상태별 VOC 현황

### 1.3 접근 권한
- **관리자 전용**

### 1.4 우선순위
- 선택 (모든 통계 관련 기능은 선택 요구사항)

---

## 2. 레이아웃 구조

### 2.1 화면 레이아웃
```
┌─────────────────────────────────────────────────────────────────┐
│  [로고]  통계 대시보드                         [관리자명] [로그아웃] │
├─────────────────────────────────────────────────────────────────┤
│  [기간 필터]  [오늘] [7일] [30일] [사용자 지정]  [새로고침]        │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│   KPI 카드 영역           │   KPI 카드 영역                       │
│   총 접수 건수            │   평균 처리 시간                      │
│   ┌───────────────┐      │   ┌───────────────┐                 │
│   │    1,234건    │      │   │    2.3시간    │                 │
│   │  (+12% ↑)    │      │   │  (-5% ↓)     │                 │
│   └───────────────┘      │   └───────────────┘                 │
│                          │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│                                                                 │
│   기간별 VOC 접수 추이 (라인 차트)                                │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                                  ╱╲                    │    │
│   │                        ╱╲      ╱  ╲                   │    │
│   │              ╱╲      ╱  ╲    ╱    ╲                  │    │
│   │    ────────╱  ╲────╱    ╲──╱      ╲───────          │    │
│   │   01/01  01/07  01/14  01/21  01/28                  │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│ 카테고리별 VOC 현황       │   상태별 VOC 현황                     │
│ (세로 바 차트)            │   (도넛 차트)                         │
│ ┌───────────────┐        │   ┌───────────────┐                 │
│ │     ███       │        │   │      ╱──╲      │                 │
│ │     ███       │        │   │    ╱ 완료 ╲    │                 │
│ │     ███  ██   │        │   │   │ 처리중 │   │                 │
│ │ ██  ███  ██   │        │   │    ╲ 분석 ╱    │                 │
│ │ ██  ███  ██ █ │        │   │      ╲──╱      │                 │
│ │오류 문의 개선불│        │   │                 │                 │
│ └───────────────┘        │   └───────────────┘                 │
│                          │                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

### 2.2 반응형 레이아웃
- **Desktop (>1200px)**: 2열 그리드 레이아웃
- **Tablet (768px-1200px)**: 1열 레이아웃, 차트 크기 조정
- **Mobile (<768px)**: 스크롤 가능한 단일 컬럼

---

## 3. UI 요소 상세

### 3.1 기간 필터
| 요소명 | 타입 | 설명 |
|--------|------|------|
| 오늘 | Button | 오늘 날짜의 데이터만 조회 |
| 7일 | Button | 최근 7일간의 데이터 조회 (기본 선택) |
| 30일 | Button | 최근 30일간의 데이터 조회 |
| 사용자 지정 | DateRangePicker | 시작일~종료일 직접 선택 (최대 90일) |
| 새로고침 | Button | 현재 선택된 기간으로 데이터 갱신 |

**기본값**: 최근 7일

**제약사항**:
- 최대 조회 기간: 90일
- 미래 날짜 선택 불가
- 시작일은 종료일보다 이전이어야 함

### 3.2 KPI 카드

#### 3.2.1 총 접수 건수
```typescript
interface TotalVocCountCard {
  count: number;              // 총 VOC 접수 건수
  percentageChange: number;   // 전 기간 대비 증감률 (%)
  trend: 'up' | 'down' | 'stable';
}
```

**표시 형식**:
- 숫자: 천 단위 콤마 구분 (예: 1,234건)
- 증감률: +12% ↑, -5% ↓, 0%
- 색상: 증가(파란색), 감소(회색), 동일(회색)

#### 3.2.2 평균 처리 시간
```typescript
interface AverageProcessingTimeCard {
  averageHours: number;       // 평균 처리 시간 (시간 단위)
  percentageChange: number;   // 전 기간 대비 증감률 (%)
  trend: 'up' | 'down' | 'stable';
}
```

**표시 형식**:
- 시간: 소수점 1자리 (예: 2.3시간)
- 처리 시간 기준: '접수' 상태 → '완료' 또는 '반려' 상태까지의 평균 시간
- 색상: 감소(초록색), 증가(빨간색), 동일(회색)

### 3.3 기간별 VOC 접수 추이 (라인 차트)

**차트 타입**: Line Chart

**데이터 구조**:
```typescript
interface VocTrendData {
  date: string;        // YYYY-MM-DD
  count: number;       // 해당 일자 접수 건수
}

interface VocTrendChartData {
  labels: string[];                // 날짜 배열
  datasets: [{
    label: 'VOC 접수 건수';
    data: number[];               // 건수 배열
    borderColor: string;
    backgroundColor: string;
  }];
}
```

**기능**:
- X축: 날짜 (일 단위)
- Y축: 접수 건수
- 툴팁: 날짜 + 건수 표시
- 반응형: 모바일에서는 날짜 라벨 축소

**데이터 집계 규칙**:
- 오늘/7일: 일별 집계
- 30일: 일별 집계
- 31일~90일: 주별 집계

### 3.4 카테고리별 VOC 현황 (세로 바 차트)

**차트 타입**: Vertical Bar Chart

**데이터 구조**:
```typescript
interface CategoryStatistics {
  categoryName: string;    // 카테고리명 (대분류)
  count: number;           // 건수
  percentage: number;      // 전체 대비 비율 (%)
}

interface CategoryChartData {
  labels: string[];                // 카테고리명 배열
  datasets: [{
    label: 'VOC 건수';
    data: number[];               // 건수 배열
    backgroundColor: string[];    // 카테고리별 색상
  }];
}
```

**표시 규칙**:
- 상위 10개 카테고리만 표시
- 정렬: 건수 내림차순
- 색상: 카테고리별 고유 색상 지정
- 툴팁: 카테고리명, 건수, 비율 표시

### 3.5 상태별 VOC 현황 (도넛 차트)

**차트 타입**: Doughnut Chart

**데이터 구조**:
```typescript
interface StatusStatistics {
  status: VocStatus;       // 접수|분석중|분석실패|처리중|완료|반려
  count: number;           // 건수
  percentage: number;      // 전체 대비 비율 (%)
  color: string;           // 상태별 색상
}

interface StatusChartData {
  labels: string[];                // 상태명 배열
  datasets: [{
    data: number[];               // 건수 배열
    backgroundColor: string[];    // 상태별 색상
  }];
}
```

**상태별 색상**:
- 접수: #E3F2FD (연한 파랑)
- 분석중: #FFF3E0 (연한 주황)
- 분석실패: #FFEBEE (연한 빨강)
- 처리중: #E8F5E9 (연한 초록)
- 완료: #4CAF50 (초록)
- 반려: #F44336 (빨강)

**표시 규칙**:
- 중앙: 총 건수 표시
- 툴팁: 상태명, 건수, 비율 표시
- 범례: 차트 하단에 표시

---

## 4. 사용자 액션 및 이벤트

### 4.1 기간 선택
| 액션 | 이벤트 | 결과 |
|------|--------|------|
| 오늘 버튼 클릭 | onClick | 오늘 날짜로 필터링, 모든 차트 갱신 |
| 7일 버튼 클릭 | onClick | 최근 7일로 필터링, 모든 차트 갱신 |
| 30일 버튼 클릭 | onClick | 최근 30일로 필터링, 모든 차트 갱신 |
| 사용자 지정 선택 | onChange | DateRangePicker 열림 |
| 날짜 범위 적용 | onApply | 선택한 기간으로 필터링, 모든 차트 갱신 |
| 새로고침 버튼 클릭 | onClick | 현재 기간으로 데이터 재조회 |

**유효성 검증**:
```typescript
function validateDateRange(startDate: Date, endDate: Date): ValidationResult {
  const today = new Date();
  const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  if (endDate > today) {
    return { valid: false, message: '미래 날짜는 선택할 수 없습니다.' };
  }

  if (startDate > endDate) {
    return { valid: false, message: '시작일은 종료일보다 이전이어야 합니다.' };
  }

  if (diffDays > 90) {
    return { valid: false, message: '최대 90일까지 조회 가능합니다.' };
  }

  return { valid: true };
}
```

### 4.2 차트 상호작용
| 액션 | 이벤트 | 결과 |
|------|--------|------|
| 차트 데이터 포인트 호버 | onHover | 툴팁 표시 (날짜/카테고리/상태, 건수, 비율) |
| 카테고리 바 클릭 | onClick | 해당 카테고리로 필터링된 VOC 리스트 화면으로 이동 |
| 상태 세그먼트 클릭 | onClick | 해당 상태로 필터링된 VOC 리스트 화면으로 이동 |
| 범례 항목 클릭 | onClick | 해당 데이터 시리즈 표시/숨김 토글 |

### 4.3 로딩 및 에러 처리
| 상태 | 표시 내용 |
|------|----------|
| 로딩 중 | 각 차트 영역에 Skeleton UI 표시 |
| 데이터 없음 | "선택한 기간에 데이터가 없습니다" 메시지 표시 |
| API 에러 | "데이터를 불러오는 중 오류가 발생했습니다. [재시도]" 버튼 표시 |
| 네트워크 에러 | "네트워크 연결을 확인해주세요. [재시도]" 버튼 표시 |

---

## 5. 연관 API

### 5.1 통계 데이터 조회 API

#### 5.1.1 기간별 VOC 접수 추이
```typescript
GET /api/statistics/voc-trend
Query Parameters:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)
  - aggregation: 'day' | 'week' (선택, 기본값: day)

Response:
{
  "success": true,
  "data": [
    {
      "date": "2025-01-17",
      "count": 45
    },
    {
      "date": "2025-01-18",
      "count": 52
    }
  ]
}
```

#### 5.1.2 KPI 요약 정보
```typescript
GET /api/statistics/kpi-summary
Query Parameters:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)

Response:
{
  "success": true,
  "data": {
    "totalCount": {
      "current": 1234,
      "previous": 1102,
      "percentageChange": 11.98,
      "trend": "up"
    },
    "averageProcessingTime": {
      "current": 2.3,           // 시간 단위
      "previous": 2.42,
      "percentageChange": -4.96,
      "trend": "down"
    }
  }
}
```

**처리 시간 계산 로직**:
```sql
SELECT AVG(
  EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600
) as average_hours
FROM voc
WHERE status IN ('완료', '반려')
  AND updated_at BETWEEN :startDate AND :endDate
  AND created_at >= :startDate;
```

#### 5.1.3 카테고리별 통계
```typescript
GET /api/statistics/by-category
Query Parameters:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)
  - limit: number (선택, 기본값: 10)

Response:
{
  "success": true,
  "data": [
    {
      "categoryId": "CAT-001",
      "categoryName": "오류/버그",
      "count": 456,
      "percentage": 36.92
    },
    {
      "categoryId": "CAT-002",
      "categoryName": "문의",
      "count": 389,
      "percentage": 31.51
    }
  ],
  "total": 1234
}
```

#### 5.1.4 상태별 통계
```typescript
GET /api/statistics/by-status
Query Parameters:
  - startDate: string (YYYY-MM-DD)
  - endDate: string (YYYY-MM-DD)

Response:
{
  "success": true,
  "data": [
    {
      "status": "완료",
      "count": 678,
      "percentage": 54.94,
      "color": "#4CAF50"
    },
    {
      "status": "처리중",
      "count": 234,
      "percentage": 18.96,
      "color": "#E8F5E9"
    },
    {
      "status": "분석중",
      "count": 156,
      "percentage": 12.64,
      "color": "#FFF3E0"
    },
    {
      "status": "접수",
      "count": 89,
      "percentage": 7.21,
      "color": "#E3F2FD"
    },
    {
      "status": "반려",
      "count": 45,
      "percentage": 3.65,
      "color": "#F44336"
    },
    {
      "status": "분석실패",
      "count": 32,
      "percentage": 2.59,
      "color": "#FFEBEE"
    }
  ],
  "total": 1234
}
```

### 5.2 에러 응답
```typescript
Response (400 Bad Request):
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "최대 90일까지 조회 가능합니다."
  }
}

Response (403 Forbidden):
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "관리자 권한이 필요합니다."
  }
}

Response (500 Internal Server Error):
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "서버 오류가 발생했습니다."
  }
}
```

---

## 6. 화면 전환

### 6.1 진입 경로
```
[메인 메뉴] → [통계 대시보드] (관리자 전용 메뉴)
```

### 6.2 이탈 경로
| 액션 | 목적지 화면 | 전달 파라미터 |
|------|------------|--------------|
| 카테고리 바 차트 클릭 | SC-04/SC-05 VOC 리스트 | `categoryId`, `startDate`, `endDate` |
| 상태 도넛 차트 클릭 | SC-04/SC-05 VOC 리스트 | `status`, `startDate`, `endDate` |
| 메뉴 이동 | 다른 화면 | - |
| 로그아웃 | SC-01 로그인 화면 | - |

**예시 URL**:
```
/voc/list?category=CAT-001&startDate=2025-01-17&endDate=2025-01-23
/voc/list?status=처리중&startDate=2025-01-17&endDate=2025-01-23
```

---

## 7. 기술 스택

### 7.1 차트 라이브러리
**권장**: Chart.js 또는 Recharts

**선정 이유**:
- React 환경에 최적화
- 반응형 지원
- 접근성 지원 (ARIA)
- 커스터마이징 용이

### 7.2 날짜 선택 라이브러리
**권장**: react-datepicker 또는 @mui/x-date-pickers

### 7.3 상태 관리
- TanStack Query (서버 상태)
- Zustand (기간 필터 상태)

---

## 8. 접근성 (Accessibility)

### 8.1 ARIA 속성
```html
<!-- 기간 필터 -->
<div role="group" aria-label="기간 선택">
  <button aria-pressed="true" aria-label="최근 7일">7일</button>
  <button aria-pressed="false" aria-label="최근 30일">30일</button>
</div>

<!-- KPI 카드 -->
<div role="region" aria-label="총 VOC 접수 건수">
  <p aria-label="1,234건, 전 기간 대비 12% 증가">
    1,234건 <span aria-hidden="true">+12% ↑</span>
  </p>
</div>

<!-- 차트 -->
<div role="img" aria-label="기간별 VOC 접수 추이 라인 차트">
  <!-- Chart.js 캔버스 -->
  <canvas aria-describedby="chart-description"></canvas>
  <div id="chart-description" class="sr-only">
    1월 17일부터 1월 23일까지의 VOC 접수 추이를 보여주는 차트입니다.
  </div>
</div>
```

### 8.2 키보드 네비게이션
- Tab: 기간 필터 버튼 간 이동
- Enter/Space: 버튼 선택
- Esc: DateRangePicker 닫기

### 8.3 스크린 리더 지원
- 차트 데이터는 대체 텍스트로 제공
- 변경률은 "증가" 또는 "감소"로 명시적 표현

---

## 9. 성능 고려사항

### 9.1 데이터 캐싱
```typescript
// TanStack Query 캐싱 전략
const CACHE_TIME = 5 * 60 * 1000; // 5분
const STALE_TIME = 1 * 60 * 1000; // 1분

const { data, isLoading } = useQuery({
  queryKey: ['statistics', 'kpi', startDate, endDate],
  queryFn: () => fetchKpiSummary(startDate, endDate),
  staleTime: STALE_TIME,
  cacheTime: CACHE_TIME
});
```

### 9.2 차트 렌더링 최적화
- Lazy Loading: 차트는 뷰포트에 진입 시 렌더링
- Debounce: 기간 변경 시 300ms 디바운스 적용
- 메모이제이션: 차트 데이터는 `useMemo`로 메모이제이션

### 9.3 대용량 데이터 처리
- 서버 사이드 집계 (DB 레벨 GROUP BY)
- 프론트엔드는 이미 집계된 데이터만 렌더링
- 90일 이상 조회 시 주별 집계로 자동 전환

---

## 10. 테스트 시나리오

### 10.1 기능 테스트
```typescript
describe('SC-11 통계 대시보드', () => {
  it('기본 7일 기간으로 초기 로드된다', async () => {
    render(<DashboardScreen />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /7일/, pressed: true })).toBeInTheDocument();
    });
  });

  it('기간 변경 시 모든 차트가 갱신된다', async () => {
    const { rerender } = render(<DashboardScreen />);

    await userEvent.click(screen.getByRole('button', { name: /30일/ }));

    await waitFor(() => {
      expect(mockFetchStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String)
        })
      );
    });
  });

  it('카테고리 차트 클릭 시 필터링된 리스트로 이동한다', async () => {
    render(<DashboardScreen />);

    const categoryBar = screen.getByRole('button', { name: /오류\/버그/ });
    await userEvent.click(categoryBar);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/voc/list',
      expect.objectContaining({
        state: { categoryId: 'CAT-001' }
      })
    );
  });

  it('데이터가 없을 때 안내 메시지를 표시한다', async () => {
    mockFetchStatistics.mockResolvedValue({ data: [] });

    render(<DashboardScreen />);

    await waitFor(() => {
      expect(screen.getByText(/선택한 기간에 데이터가 없습니다/)).toBeInTheDocument();
    });
  });
});
```

### 10.2 접근성 테스트
```typescript
it('키보드로 기간 필터를 조작할 수 있다', async () => {
  render(<DashboardScreen />);

  const todayButton = screen.getByRole('button', { name: /오늘/ });
  todayButton.focus();

  await userEvent.keyboard('{Enter}');

  expect(todayButton).toHaveAttribute('aria-pressed', 'true');
});

it('차트에 대체 텍스트가 제공된다', () => {
  render(<DashboardScreen />);

  const chartRegion = screen.getByRole('img', { name: /기간별 VOC 접수 추이/ });
  expect(chartRegion).toBeInTheDocument();
});
```

### 10.3 에러 처리 테스트
```typescript
it('API 에러 시 재시도 버튼을 표시한다', async () => {
  mockFetchStatistics.mockRejectedValue(new Error('Network Error'));

  render(<DashboardScreen />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /재시도/ })).toBeInTheDocument();
  });
});
```

---

## 11. 이슈 연결
- GitHub Issue: #12 (SC-11 통계 대시보드 화면 개발)

---

## 12. 참고사항

### 12.1 차트 색상 팔레트
```typescript
// 카테고리별 색상 (Material Design 기반)
const CATEGORY_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63'  // Pink
];
```

### 12.2 반응형 브레이크포인트
```typescript
const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1199px)',
  desktop: '(min-width: 1200px)'
};
```

### 12.3 차트 애니메이션
- 초기 로드: 800ms fade-in
- 데이터 업데이트: 400ms transition
- 호버 효과: 150ms scale

---

## 변경 이력
| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-01-23 | Claude Code | 최초 작성 |
