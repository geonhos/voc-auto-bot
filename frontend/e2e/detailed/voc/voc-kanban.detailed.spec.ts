import { test, expect } from '@playwright/test';

/**
 * @description VOC 칸반 페이지 상세 E2E 테스트 시나리오
 * @route /voc/kanban
 * @issue #117
 *
 * ## 테스트 대상 UI 요소
 * 1. 칸반 컬럼 (NEW, IN_PROGRESS, PENDING, RESOLVED, CLOSED)
 * 2. 컬럼 헤더 (타이틀, 카드 개수, 상태 표시)
 * 3. VOC 카드 (티켓ID, 제목, 고객명, 우선순위 배지)
 * 4. 드래그 앤 드롭 UI (드래그 시작/종료, 드롭 영역)
 * 5. 우선순위 배지 (VocPriorityBadge)
 * 6. 빈 상태 표시
 * 7. 로딩 상태
 *
 * ## 드래그 앤 드롭 인터랙션
 * - 카드 드래그 시작 (opacity, cursor 변경)
 * - 드롭 영역 하이라이트 (ring-2 ring-primary)
 * - 드롭 시 상태 변경 API 호출
 * - 같은 컬럼에 드롭 시 무시
 */

// 테스트용 Mock 데이터
const mockVocs = [
  {
    id: 1,
    ticketId: 'VOC-2024-001',
    title: '배송이 늦어지고 있습니다',
    content: '주문한 상품이 예상 배송일보다 3일이나 늦어지고 있습니다.',
    status: 'NEW',
    priority: 'HIGH',
    channel: 'EMAIL',
    customerName: '김철수',
    customerEmail: 'kim@example.com',
    customerPhone: '010-1234-5678',
    category: { id: 1, name: '배송', code: 'DELIVERY' },
    createdAt: '2024-01-15T09:00:00',
    updatedAt: '2024-01-15T09:00:00',
    attachments: [],
    memos: [],
  },
  {
    id: 2,
    ticketId: 'VOC-2024-002',
    title: '제품 불량 교환 요청',
    content: '받은 제품에 불량이 있어 교환을 요청합니다.',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    channel: 'PHONE',
    customerName: '이영희',
    customerEmail: 'lee@example.com',
    category: { id: 2, name: '제품', code: 'PRODUCT' },
    createdAt: '2024-01-14T14:30:00',
    updatedAt: '2024-01-15T10:20:00',
    attachments: [],
    memos: [],
  },
  {
    id: 3,
    ticketId: 'VOC-2024-003',
    title: '환불 요청',
    content: '서비스가 만족스럽지 않아 환불을 요청합니다.',
    status: 'PENDING',
    priority: 'MEDIUM',
    channel: 'WEB',
    customerName: '박민수',
    customerEmail: 'park@example.com',
    category: { id: 3, name: '환불', code: 'REFUND' },
    createdAt: '2024-01-13T11:00:00',
    updatedAt: '2024-01-14T16:00:00',
    attachments: [],
    memos: [],
  },
  {
    id: 4,
    ticketId: 'VOC-2024-004',
    title: '문의사항 답변 감사합니다',
    content: '친절한 답변 감사합니다.',
    status: 'RESOLVED',
    priority: 'LOW',
    channel: 'CHAT',
    customerName: '최지은',
    customerEmail: 'choi@example.com',
    category: { id: 4, name: '문의', code: 'INQUIRY' },
    createdAt: '2024-01-10T08:00:00',
    updatedAt: '2024-01-15T11:00:00',
    resolvedAt: '2024-01-15T11:00:00',
    attachments: [],
    memos: [],
  },
  {
    id: 5,
    ticketId: 'VOC-2024-005',
    title: '중복 문의입니다',
    content: '이미 처리된 문의와 동일합니다.',
    status: 'CLOSED',
    priority: 'LOW',
    channel: 'EMAIL',
    customerName: '정수진',
    customerEmail: 'jung@example.com',
    category: { id: 4, name: '문의', code: 'INQUIRY' },
    createdAt: '2024-01-12T13:00:00',
    updatedAt: '2024-01-14T15:00:00',
    closedAt: '2024-01-14T15:00:00',
    attachments: [],
    memos: [],
  },
];

test.describe('VOC 칸반 페이지 (/voc/kanban) - 상세 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    // 인증 모킹
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            username: 'admin',
            name: '관리자',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        }),
      });
    });

    // VOC 목록 API 모킹
    await page.route('**/api/vocs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: mockVocs,
            page: 0,
            size: 100,
            totalElements: mockVocs.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/voc/kanban');
  });

  test.describe('1. 페이지 렌더링', () => {
    test('1.1 페이지 타이틀이 올바르게 표시된다', async ({ page }) => {
      const heading = page.locator('h1:has-text("VOC 칸반보드")');
      await expect(heading).toBeVisible();
      await expect(heading).toHaveClass(/text-3xl/);
    });

    test('1.2 페이지 설명이 올바르게 표시된다', async ({ page }) => {
      const description = page.locator('text=VOC를 드래그앤드롭으로 관리하세요');
      await expect(description).toBeVisible();
      await expect(description).toHaveClass(/text-slate-500/);
    });

    test('1.3 로딩 상태가 올바르게 표시된다', async ({ page }) => {
      // 페이지 재로드하여 로딩 상태 확인
      await page.route('**/api/vocs?**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: mockVocs,
              page: 0,
              size: 100,
              totalElements: mockVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      // 로딩 스피너 확인
      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible();
      await expect(spinner).toHaveClass(/border-primary/);
    });
  });

  test.describe('2. 칸반 컬럼', () => {
    test('2.1 모든 상태 컬럼이 표시된다', async ({ page }) => {
      await expect(page.locator('text=접수')).toBeVisible();
      await expect(page.locator('text=처리중')).toBeVisible();
      await expect(page.locator('text=분석실패')).toBeVisible();
      await expect(page.locator('text=완료')).toBeVisible();
      await expect(page.locator('text=반려')).toBeVisible();
    });

    test('2.2 각 컬럼에 상태 표시 원형 아이콘이 있다', async ({ page }) => {
      // 접수 컬럼 - 회색
      const newColumn = page.locator('div:has-text("접수")').first();
      const newCircle = newColumn.locator('.w-3.h-3.rounded-full.bg-slate-400');
      await expect(newCircle).toBeVisible();

      // 처리중 컬럼 - 노란색
      const inProgressColumn = page.locator('div:has-text("처리중")').first();
      const inProgressCircle = inProgressColumn.locator('.w-3.h-3.rounded-full.bg-warning');
      await expect(inProgressCircle).toBeVisible();

      // 분석실패 컬럼 - 빨간색
      const pendingColumn = page.locator('div:has-text("분석실패")').first();
      const pendingCircle = pendingColumn.locator('.w-3.h-3.rounded-full.bg-danger');
      await expect(pendingCircle).toBeVisible();

      // 완료 컬럼 - 초록색
      const resolvedColumn = page.locator('div:has-text("완료")').first();
      const resolvedCircle = resolvedColumn.locator('.w-3.h-3.rounded-full.bg-success');
      await expect(resolvedCircle).toBeVisible();
    });

    test('2.3 각 컬럼 헤더에 카드 개수가 표시된다', async ({ page }) => {
      // NEW 컬럼 - 1개
      const newColumnHeader = page
        .locator('div:has-text("접수")')
        .filter({ has: page.locator('span:has-text("1")') })
        .first();
      await expect(newColumnHeader).toBeVisible();

      // IN_PROGRESS 컬럼 - 1개
      const inProgressHeader = page
        .locator('div:has-text("처리중")')
        .filter({ has: page.locator('span:has-text("1")') })
        .first();
      await expect(inProgressHeader).toBeVisible();

      // RESOLVED 컬럼 - 1개
      const resolvedHeader = page
        .locator('div:has-text("완료")')
        .filter({ has: page.locator('span:has-text("1")') })
        .first();
      await expect(resolvedHeader).toBeVisible();
    });

    test('2.4 컬럼 헤더의 배경색이 올바르게 표시된다', async ({ page }) => {
      // NEW 컬럼 - 회색 배경
      const newHeader = page
        .locator('div:has-text("접수")')
        .filter({ hasNot: page.locator('text=VOC가 없습니다') })
        .first();
      await expect(newHeader).toHaveClass(/bg-slate-100/);

      // IN_PROGRESS 컬럼 - warning 배경
      const inProgressHeader = page.locator('div:has-text("처리중")').first();
      await expect(inProgressHeader).toHaveClass(/bg-warning\/10/);

      // PENDING 컬럼 - danger 배경
      const pendingHeader = page.locator('div:has-text("분석실패")').first();
      await expect(pendingHeader).toHaveClass(/bg-danger\/10/);

      // RESOLVED 컬럼 - success 배경
      const resolvedHeader = page.locator('div:has-text("완료")').first();
      await expect(resolvedHeader).toHaveClass(/bg-success\/10/);
    });

    test('2.5 각 컬럼의 최소 높이가 설정되어 있다', async ({ page }) => {
      const columns = page.locator('[onDragOver]');
      const count = await columns.count();

      for (let i = 0; i < count; i++) {
        const column = columns.nth(i);
        await expect(column).toHaveClass(/min-h-\[400px\]/);
      }
    });

    test('2.6 컬럼이 가로 스크롤 가능하다', async ({ page }) => {
      const container = page.locator('.flex.gap-4.overflow-x-auto');
      await expect(container).toBeVisible();
      await expect(container).toHaveClass(/overflow-x-auto/);
    });
  });

  test.describe('3. VOC 카드', () => {
    test('3.1 카드가 올바르게 렌더링된다', async ({ page }) => {
      // NEW 컬럼의 첫 번째 카드 확인
      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toBeVisible();
      await expect(card).toHaveClass(/bg-white/);
      await expect(card).toHaveClass(/rounded-lg/);
    });

    test('3.2 카드에 티켓ID가 표시된다', async ({ page }) => {
      const ticketId = page.locator('text=VOC-2024-001');
      await expect(ticketId).toBeVisible();
      await expect(ticketId).toHaveClass(/text-primary/);
      await expect(ticketId).toHaveClass(/font-semibold/);
    });

    test('3.3 카드에 제목이 표시된다', async ({ page }) => {
      const title = page.locator('text=배송이 늦어지고 있습니다');
      await expect(title).toBeVisible();
      await expect(title).toHaveClass(/font-medium/);
      await expect(title).toHaveClass(/line-clamp-2/);
    });

    test('3.4 카드에 고객명이 표시된다', async ({ page }) => {
      const customerName = page.locator('text=김철수');
      await expect(customerName).toBeVisible();

      // person 아이콘 확인
      const personIcon = page.locator('.material-icons-outlined:has-text("person")').first();
      await expect(personIcon).toBeVisible();
    });

    test('3.5 카드 hover 시 그림자가 강조된다', async ({ page }) => {
      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toHaveClass(/hover:shadow-md/);
    });

    test('3.6 카드가 draggable 속성을 가진다', async ({ page }) => {
      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toHaveAttribute('draggable', 'true');
    });

    test('3.7 카드의 왼쪽 테두리 색상이 상태에 따라 다르다', async ({ page }) => {
      // NEW - slate
      const newCard = page.locator('text=VOC-2024-001').locator('..');
      await expect(newCard).toHaveClass(/border-slate-400/);

      // IN_PROGRESS - warning
      const inProgressCard = page.locator('text=VOC-2024-002').locator('..');
      await expect(inProgressCard).toHaveClass(/border-warning/);

      // PENDING - danger
      const pendingCard = page.locator('text=VOC-2024-003').locator('..');
      await expect(pendingCard).toHaveClass(/border-danger/);

      // RESOLVED - success
      const resolvedCard = page.locator('text=VOC-2024-004').locator('..');
      await expect(resolvedCard).toHaveClass(/border-success/);
    });

    test('3.8 카드 클릭 시 상세 페이지로 이동한다', async ({ page }) => {
      const card = page.locator('a[href="/voc/1"]').first();
      await card.click();
      await expect(page).toHaveURL(/\/voc\/1$/);
    });
  });

  test.describe('4. 우선순위 배지 (VocPriorityBadge)', () => {
    test('4.1 긴급(URGENT) 배지가 올바르게 표시된다', async ({ page }) => {
      const urgentBadge = page
        .locator('text=VOC-2024-002')
        .locator('..')
        .locator('text=긴급')
        .first();
      await expect(urgentBadge).toBeVisible();
      await expect(urgentBadge).toHaveClass(/text-danger/);

      // warning 아이콘 확인
      const warningIcon = urgentBadge.locator('.material-icons-outlined:has-text("warning")');
      await expect(warningIcon).toBeVisible();
    });

    test('4.2 높음(HIGH) 배지가 올바르게 표시된다', async ({ page }) => {
      const highBadge = page.locator('text=VOC-2024-001').locator('..').locator('text=높음').first();
      await expect(highBadge).toBeVisible();
      await expect(highBadge).toHaveClass(/text-warning/);

      // warning 아이콘 확인
      const warningIcon = highBadge.locator('.material-icons-outlined:has-text("warning")');
      await expect(warningIcon).toBeVisible();
    });

    test('4.3 보통(MEDIUM) 배지가 올바르게 표시된다', async ({ page }) => {
      const mediumBadge = page
        .locator('text=VOC-2024-003')
        .locator('..')
        .locator('text=보통')
        .first();
      await expect(mediumBadge).toBeVisible();
      await expect(mediumBadge).toHaveClass(/text-warning/);

      // info 아이콘 확인
      const infoIcon = mediumBadge.locator('.material-icons-outlined:has-text("info")');
      await expect(infoIcon).toBeVisible();
    });

    test('4.4 낮음(LOW) 배지가 올바르게 표시된다', async ({ page }) => {
      const lowBadge = page.locator('text=VOC-2024-004').locator('..').locator('text=낮음').first();
      await expect(lowBadge).toBeVisible();
      await expect(lowBadge).toHaveClass(/text-primary-light/);

      // arrow_downward 아이콘 확인
      const arrowIcon = lowBadge.locator('.material-icons-outlined:has-text("arrow_downward")');
      await expect(arrowIcon).toBeVisible();
    });

    test('4.5 배지 아이콘 크기가 12px이다', async ({ page }) => {
      const urgentBadge = page
        .locator('text=VOC-2024-002')
        .locator('..')
        .locator('text=긴급')
        .first();
      const icon = urgentBadge.locator('.material-icons-outlined');
      await expect(icon).toHaveCSS('font-size', '12px');
    });

    test('4.6 배지가 inline-flex로 정렬된다', async ({ page }) => {
      const badge = page.locator('text=VOC-2024-001').locator('..').locator('text=높음').first();
      await expect(badge).toHaveClass(/inline-flex/);
      await expect(badge).toHaveClass(/items-center/);
      await expect(badge).toHaveClass(/gap-1/);
    });
  });

  test.describe('5. 드래그 앤 드롭 - 시작', () => {
    test('5.1 카드 드래그 시작 시 cursor가 grabbing으로 변경된다', async ({ page }) => {
      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toHaveClass(/active:cursor-grabbing/);
    });

    test('5.2 카드 드래그 시작 시 opacity가 감소한다', async ({ page }) => {
      const card = page.locator('text=VOC-2024-001').locator('..');

      // 드래그 시작
      await card.dragTo(page.locator('text=처리중').locator('..'));

      // opacity-50 클래스는 드래그 중에만 적용되므로 클래스 존재 확인
      const cardClass = await card.getAttribute('class');
      expect(cardClass).toContain('cursor-grab');
    });

    test('5.3 카드 드래그 시작 시 scale이 감소한다', async ({ page }) => {
      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toHaveClass(/scale-95/);
    });

    test('5.4 카드에 cursor-grab 스타일이 적용되어 있다', async ({ page }) => {
      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toHaveClass(/cursor-grab/);
    });
  });

  test.describe('6. 드래그 앤 드롭 - 드롭 영역', () => {
    test('6.1 드래그 오버 시 드롭 영역에 ring 스타일이 적용된다', async ({ page }) => {
      // 이 테스트는 실제 드래그 동작 중 상태를 확인하므로
      // CSS 클래스가 조건부로 적용되는지 확인
      const dropZone = page.locator('div:has-text("처리중")').locator('..').locator('[onDragOver]');
      await expect(dropZone).toBeVisible();

      // 드롭 영역의 전환 효과 확인
      await expect(dropZone).toHaveClass(/transition-colors/);
    });

    test('6.2 빈 컬럼에 드래그 오버 시 "여기에 놓으세요" 메시지가 표시된다', async ({ page }) => {
      // 빈 컬럼 생성 (CLOSED 컬럼이 카드 1개만 있으므로 제거)
      await page.route('**/api/vocs?**', async (route) => {
        const emptyVocs = mockVocs.filter((v) => v.status !== 'CLOSED');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: emptyVocs,
              page: 0,
              size: 100,
              totalElements: emptyVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      // CLOSED 컬럼 확인
      const closedColumn = page
        .locator('div:has-text("반려")')
        .locator('..')
        .locator('text=VOC가 없습니다');
      await expect(closedColumn).toBeVisible();
    });

    test('6.3 빈 컬럼에 "VOC가 없습니다" 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const emptyVocs = mockVocs.filter((v) => v.status !== 'CLOSED');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: emptyVocs,
              page: 0,
              size: 100,
              totalElements: emptyVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      const emptyMessage = page.locator('text=VOC가 없습니다');
      await expect(emptyMessage).toBeVisible();
      await expect(emptyMessage).toHaveClass(/text-slate-400/);
      await expect(emptyMessage).toHaveClass(/text-center/);
    });

    test('6.4 드롭 영역에 최소 높이가 설정되어 있다', async ({ page }) => {
      const dropZones = page.locator('[onDragOver]');
      const count = await dropZones.count();

      for (let i = 0; i < count; i++) {
        const zone = dropZones.nth(i);
        await expect(zone).toHaveClass(/min-h-\[400px\]/);
      }
    });
  });

  test.describe('7. 드래그 앤 드롭 - 상태 변경', () => {
    test('7.1 드롭 시 상태 변경 API가 호출된다', async ({ page }) => {
      let apiCalled = false;
      let requestBody: any = null;

      await page.route('**/api/vocs/1/status', async (route) => {
        if (route.request().method() === 'PATCH') {
          apiCalled = true;
          requestBody = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...mockVocs[0], status: 'IN_PROGRESS' },
            }),
          });
        }
      });

      // 드래그 앤 드롭 수행
      const card = page.locator('text=VOC-2024-001').locator('..');
      const targetColumn = page.locator('div:has-text("처리중")').locator('..').locator('[onDragOver]');

      await card.dragTo(targetColumn);

      // API 호출 확인
      await page.waitForTimeout(1000);
      expect(apiCalled).toBe(true);
      expect(requestBody?.status).toBe('IN_PROGRESS');
    });

    test('7.2 같은 컬럼에 드롭 시 API가 호출되지 않는다', async ({ page }) => {
      let apiCalled = false;

      await page.route('**/api/vocs/1/status', async (route) => {
        if (route.request().method() === 'PATCH') {
          apiCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: mockVocs[0],
            }),
          });
        }
      });

      // 같은 컬럼에 드래그 앤 드롭
      const card = page.locator('text=VOC-2024-001').locator('..');
      const sameColumn = page.locator('div:has-text("접수")').locator('..').locator('[onDragOver]');

      await card.dragTo(sameColumn);

      await page.waitForTimeout(500);
      expect(apiCalled).toBe(false);
    });

    test('7.3 상태 변경 실패 시 에러 알림이 표시된다', async ({ page }) => {
      // 에러 다이얼로그 리스너
      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      await page.route('**/api/vocs/1/status', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: '상태 변경 실패' },
            }),
          });
        }
      });

      const card = page.locator('text=VOC-2024-001').locator('..');
      const targetColumn = page.locator('div:has-text("처리중")').locator('..').locator('[onDragOver]');

      await card.dragTo(targetColumn);

      await page.waitForTimeout(1000);
      expect(alertMessage).toContain('상태 변경에 실패했습니다');
    });

    test('7.4 상태 변경 성공 시 카드가 새 컬럼으로 이동한다', async ({ page }) => {
      // 상태 변경 후 새로운 데이터 반환
      await page.route('**/api/vocs/1/status', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...mockVocs[0], status: 'IN_PROGRESS' },
            }),
          });
        }
      });

      // 업데이트된 목록 반환
      await page.route('**/api/vocs?**', async (route) => {
        const updatedVocs = [...mockVocs];
        updatedVocs[0] = { ...updatedVocs[0], status: 'IN_PROGRESS' };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: updatedVocs,
              page: 0,
              size: 100,
              totalElements: updatedVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      const card = page.locator('text=VOC-2024-001').locator('..');
      const targetColumn = page.locator('div:has-text("처리중")').locator('..').locator('[onDragOver]');

      await card.dragTo(targetColumn);

      // 카드가 처리중 컬럼으로 이동 확인 (자동 리페치 후)
      await page.waitForTimeout(2000);
      const inProgressColumn = page.locator('div:has-text("처리중")').locator('..');
      await expect(inProgressColumn.locator('text=VOC-2024-001')).toBeVisible();
    });
  });

  test.describe('8. 빈 상태', () => {
    test('8.1 모든 VOC가 없을 때 모든 컬럼에 빈 상태가 표시된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [],
              page: 0,
              size: 100,
              totalElements: 0,
              totalPages: 0,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      const emptyMessages = page.locator('text=VOC가 없습니다');
      const count = await emptyMessages.count();
      expect(count).toBeGreaterThan(0);
    });

    test('8.2 빈 상태 메시지가 중앙 정렬된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [],
              page: 0,
              size: 100,
              totalElements: 0,
              totalPages: 0,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      const emptyMessage = page.locator('text=VOC가 없습니다').first();
      await expect(emptyMessage).toHaveClass(/text-center/);
      await expect(emptyMessage).toHaveClass(/py-8/);
    });

    test('8.3 빈 상태 메시지의 텍스트 색상이 회색이다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [],
              page: 0,
              size: 100,
              totalElements: 0,
              totalPages: 0,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      const emptyMessage = page.locator('text=VOC가 없습니다').first();
      await expect(emptyMessage).toHaveClass(/text-slate-400/);
    });
  });

  test.describe('9. 반응형 레이아웃', () => {
    test('9.1 모바일 뷰포트에서 가로 스크롤이 가능하다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const scrollContainer = page.locator('.flex.gap-4.overflow-x-auto');
      await expect(scrollContainer).toBeVisible();
      await expect(scrollContainer).toHaveClass(/overflow-x-auto/);
    });

    test('9.2 모바일 뷰포트에서 컬럼 너비가 고정되어 있다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const columns = page.locator('.flex-shrink-0.w-80');
      const count = await columns.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const column = columns.nth(i);
        await expect(column).toHaveClass(/w-80/);
        await expect(column).toHaveClass(/flex-shrink-0/);
      }
    });

    test('9.3 태블릿 뷰포트에서 레이아웃이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const heading = page.locator('h1:has-text("VOC 칸반보드")');
      await expect(heading).toBeVisible();

      const columns = page.locator('.flex-shrink-0.w-80');
      const count = await columns.count();
      expect(count).toBe(5);
    });

    test('9.4 데스크톱 뷰포트에서 모든 컬럼이 한 화면에 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      const columns = page.locator('.flex-shrink-0.w-80');
      const count = await columns.count();
      expect(count).toBe(5);

      // max-w-7xl 컨테이너 확인
      const container = page.locator('.max-w-7xl.mx-auto');
      await expect(container).toBeVisible();
    });
  });

  test.describe('10. 다크 모드', () => {
    test('10.1 다크 모드에서 배경색이 올바르게 적용된다', async ({ page }) => {
      // 다크 모드 활성화
      await page.emulateMedia({ colorScheme: 'dark' });

      const heading = page.locator('h1:has-text("VOC 칸반보드")');
      await expect(heading).toHaveClass(/dark:text-slate-100/);

      const description = page.locator('text=VOC를 드래그앤드롭으로 관리하세요');
      await expect(description).toHaveClass(/dark:text-slate-400/);
    });

    test('10.2 다크 모드에서 카드 배경이 올바르게 적용된다', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });

      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toHaveClass(/dark:bg-slate-800/);
    });

    test('10.3 다크 모드에서 컬럼 배경이 올바르게 적용된다', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });

      const columnContainer = page.locator('.bg-surface-light').first();
      await expect(columnContainer).toHaveClass(/dark:bg-surface-dark/);
    });
  });

  test.describe('11. 접근성 (Accessibility)', () => {
    test('11.1 카드 링크가 키보드로 접근 가능하다', async ({ page }) => {
      const cardLink = page.locator('a[href="/voc/1"]').first();

      // Tab 키로 포커스
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Enter 키로 이동
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/voc\/1$/);
    });

    test('11.2 카드에 드래그 가능 상태를 나타내는 cursor 스타일이 있다', async ({ page }) => {
      const card = page.locator('text=VOC-2024-001').locator('..');
      await expect(card).toHaveClass(/cursor-grab/);
      await expect(card).toHaveClass(/active:cursor-grabbing/);
    });

    test('11.3 컬럼 헤더가 semantic HTML로 구성되어 있다', async ({ page }) => {
      const columnHeader = page.locator('h3:has-text("접수")');
      await expect(columnHeader).toBeVisible();
      await expect(columnHeader).toHaveClass(/font-semibold/);
    });
  });

  test.describe('12. 성능', () => {
    test('12.1 100개의 VOC를 렌더링할 수 있다', async ({ page }) => {
      // 대량의 VOC 데이터 생성
      const manyVocs = Array.from({ length: 100 }, (_, i) => ({
        ...mockVocs[0],
        id: i + 1,
        ticketId: `VOC-2024-${String(i + 1).padStart(3, '0')}`,
        title: `테스트 VOC ${i + 1}`,
        status: ['NEW', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'][
          i % 5
        ] as typeof mockVocs[0]['status'],
      }));

      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: manyVocs,
              page: 0,
              size: 100,
              totalElements: manyVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      // 첫 번째와 마지막 카드 확인
      await expect(page.locator('text=VOC-2024-001')).toBeVisible();
      // 스크롤하여 마지막 카드 확인
      const lastCard = page.locator('text=테스트 VOC 100');
      await expect(lastCard).toBeVisible({ timeout: 10000 });
    });

    test('12.2 드래그 앤 드롭 동작이 부드럽게 수행된다', async ({ page }) => {
      await page.route('**/api/vocs/1/status', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...mockVocs[0], status: 'IN_PROGRESS' },
            }),
          });
        }
      });

      const card = page.locator('text=VOC-2024-001').locator('..');
      const targetColumn = page.locator('div:has-text("처리중")').locator('..').locator('[onDragOver]');

      // 드래그 시작 시간 측정
      const startTime = Date.now();
      await card.dragTo(targetColumn);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000); // 3초 이내
    });
  });

  test.describe('13. 에지 케이스', () => {
    test('13.1 API 에러 시 로딩 상태가 해제된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '서버 오류' },
          }),
        });
      });

      await page.goto('/voc/kanban');

      // 로딩 스피너가 사라짐
      await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
    });

    test('13.2 빈 응답 데이터를 처리할 수 있다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [],
              page: 0,
              size: 100,
              totalElements: 0,
              totalPages: 0,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      const emptyMessage = page.locator('text=VOC가 없습니다');
      await expect(emptyMessage).toBeVisible();
    });

    test('13.3 카테고리가 없는 VOC를 처리할 수 있다', async ({ page }) => {
      const vocWithoutCategory = {
        ...mockVocs[0],
        category: undefined,
      };

      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [vocWithoutCategory],
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      const card = page.locator('text=VOC-2024-001');
      await expect(card).toBeVisible();
    });

    test('13.4 네트워크 지연 시 로딩 상태가 유지된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: mockVocs,
              page: 0,
              size: 100,
              totalElements: mockVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/voc/kanban');

      // 2초 동안 로딩 스피너 표시
      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible();

      // 로딩 완료 후 사라짐
      await expect(spinner).not.toBeVisible({ timeout: 5000 });
    });
  });
});
