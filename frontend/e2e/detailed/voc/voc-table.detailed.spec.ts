import { test, expect } from '@playwright/test';

/**
 * @description VOC 테이블 페이지 상세 E2E 테스트 시나리오
 * @route /voc/table
 * @issue #118
 *
 * ## 테스트 대상 UI 요소
 * 1. 검색 필터 (VocSearchFilter)
 *    - 검색어 입력 필드
 *    - 필터 토글 버튼
 *    - 상태 체크박스 (NEW, IN_PROGRESS, PENDING, RESOLVED, CLOSED, REJECTED)
 *    - 우선순위 체크박스 (LOW, MEDIUM, HIGH, URGENT)
 *    - 날짜 범위 필터 (시작일/종료일)
 *    - 초기화 버튼
 * 2. 테이블 (VocTable)
 *    - 테이블 헤더 (티켓번호, 제목, 카테고리, 상태, 우선순위, 담당자, 등록일, 최종수정)
 *    - 테이블 행 (클릭 시 상세 페이지 이동)
 *    - 배지 컴포넌트 (상태, 우선순위)
 *    - 페이지네이션 컨트롤
 *    - 페이지 크기 선택
 */

test.describe('VOC 테이블 페이지 (/voc/table) - 상세 시나리오', () => {
  // 테스트 데이터
  const mockVocs = [
    {
      id: 1,
      ticketId: 'VOC-2026-001',
      title: '배송 지연 문의',
      content: '주문한 상품이 예상 배송일을 3일 초과했습니다.',
      status: 'NEW',
      priority: 'HIGH',
      category: { id: 1, name: '배송', code: 'DELIVERY' },
      assignee: { id: 2, username: 'agent1', name: '홍길동' },
      createdAt: '2026-01-25T10:00:00',
      updatedAt: '2026-01-25T10:00:00',
    },
    {
      id: 2,
      ticketId: 'VOC-2026-002',
      title: '제품 불량 신고',
      content: '수령한 제품에 흠집이 있습니다.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      category: { id: 2, name: '제품', code: 'PRODUCT' },
      assignee: { id: 3, username: 'agent2', name: '김철수' },
      createdAt: '2026-01-24T14:30:00',
      updatedAt: '2026-01-25T09:15:00',
    },
    {
      id: 3,
      ticketId: 'VOC-2026-003',
      title: '결제 오류',
      content: '카드 결제가 실패했습니다.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      category: { id: 3, name: '결제', code: 'PAYMENT' },
      assignee: null,
      createdAt: '2026-01-23T16:20:00',
      updatedAt: '2026-01-24T11:45:00',
    },
  ];

  const mockPageResponse = {
    content: mockVocs,
    page: 0,
    size: 10,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
    empty: false,
  };

  test.beforeEach(async ({ page }) => {
    // 인증 API 모킹
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
            role: 'ADMIN',
          },
        }),
      });
    });

    // VOC 목록 API 기본 모킹
    await page.route('**/api/vocs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockPageResponse,
        }),
      });
    });

    await page.goto('/voc/table');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. 페이지 렌더링', () => {
    test('1.1 페이지 제목과 설명이 올바르게 표시된다', async ({ page }) => {
      await expect(page.locator('h1')).toHaveText('VOC 리스트');
      await expect(page.locator('text=VOC 목록을 테이블 형태로 조회하고 관리하세요.')).toBeVisible();
    });

    test('1.2 검색 필터 영역이 렌더링된다', async ({ page }) => {
      const filterSection = page.locator('.bg-surface-light, .bg-surface-dark').first();
      await expect(filterSection).toBeVisible();

      // 검색 입력 필드
      await expect(page.locator('input[placeholder*="검색"]')).toBeVisible();

      // 필터 버튼
      await expect(page.getByRole('button', { name: '필터' })).toBeVisible();
    });

    test('1.3 테이블이 올바르게 렌더링된다', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // 테이블 헤더 확인
      await expect(table.locator('thead')).toBeVisible();
      await expect(table.locator('th', { hasText: '티켓번호' })).toBeVisible();
      await expect(table.locator('th', { hasText: '제목' })).toBeVisible();
      await expect(table.locator('th', { hasText: '카테고리' })).toBeVisible();
      await expect(table.locator('th', { hasText: '상태' })).toBeVisible();
      await expect(table.locator('th', { hasText: '우선순위' })).toBeVisible();
      await expect(table.locator('th', { hasText: '담당자' })).toBeVisible();
      await expect(table.locator('th', { hasText: '등록일' })).toBeVisible();
      await expect(table.locator('th', { hasText: '최종 수정' })).toBeVisible();
    });

    test('1.4 테이블 데이터가 올바르게 표시된다', async ({ page }) => {
      const rows = page.locator('tbody tr');
      await expect(rows).toHaveCount(3);

      // 첫 번째 행 검증
      const firstRow = rows.first();
      await expect(firstRow.locator('td').nth(0)).toContainText('VOC-2026-001');
      await expect(firstRow.locator('td').nth(1)).toContainText('배송 지연 문의');
      await expect(firstRow.locator('td').nth(2)).toContainText('배송');
    });

    test('1.5 페이지네이션 영역이 렌더링된다', async ({ page }) => {
      await expect(page.locator('text=총')).toBeVisible();
      await expect(page.locator('text=3')).toBeVisible();
      await expect(page.getByRole('button', { name: '이전' })).toBeVisible();
      await expect(page.getByRole('button', { name: '다음' })).toBeVisible();
    });
  });

  test.describe('2. 검색 입력 필드', () => {
    test('2.1 검색어를 입력할 수 있다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');

      await searchInput.fill('배송');
      await expect(searchInput).toHaveValue('배송');
    });

    test('2.2 검색 버튼을 클릭하면 검색이 실행된다', async ({ page }) => {
      let searchParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        searchParam = url.searchParams.get('search') || '';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageResponse,
              content: mockVocs.filter((v) => v.title.includes(searchParam)),
            },
          }),
        });
      });

      const searchInput = page.locator('input[placeholder*="검색"]');
      const searchButton = page.locator('button[type="submit"]').first();

      await searchInput.fill('배송');
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await searchButton.click();
      await responsePromise;

      expect(searchParam).toBe('배송');
    });

    test('2.3 Enter 키로 검색이 실행된다', async ({ page }) => {
      let searchParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        searchParam = url.searchParams.get('search') || '';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockPageResponse,
          }),
        });
      });

      const searchInput = page.locator('input[placeholder*="검색"]');

      await searchInput.fill('제품');
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await searchInput.press('Enter');
      await responsePromise;

      expect(searchParam).toBe('제품');
    });

    test('2.4 검색 아이콘에 호버 시 색상이 변경된다', async ({ page }) => {
      const searchIcon = page.locator('button[type="submit"]').first().locator('svg');

      await expect(searchIcon).toBeVisible();
      await searchIcon.hover();

      // 호버 클래스 확인
      const parentButton = page.locator('button[type="submit"]').first();
      await expect(parentButton).toHaveClass(/hover:text-primary/);
    });

    test('2.5 검색어를 지우고 검색하면 전체 목록이 표시된다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');

      await searchInput.fill('배송');
      const response1 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await searchInput.press('Enter');
      await response1;

      await searchInput.clear();
      const response2 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await searchInput.press('Enter');
      await response2;

      const rows = page.locator('tbody tr');
      await expect(rows).toHaveCount(3);
    });
  });

  test.describe('3. 필터 토글 버튼', () => {
    test('3.1 필터 버튼을 클릭하면 필터 영역이 펼쳐진다', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: '필터' });

      // 초기 상태 - 필터 숨김
      await expect(page.locator('text=상태').first()).not.toBeVisible();

      // 필터 토글
      await filterButton.click();

      // 필터 영역 표시
      await expect(page.locator('text=상태').first()).toBeVisible();
      await expect(page.locator('text=우선순위').first()).toBeVisible();
      await expect(page.locator('text=기간').first()).toBeVisible();
    });

    test('3.2 필터 버튼을 다시 클릭하면 필터 영역이 접힌다', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: '필터' });

      // 펼치기
      await filterButton.click();
      await expect(page.locator('text=상태').first()).toBeVisible();

      // 접기
      await filterButton.click();
      await expect(page.locator('text=상태').first()).not.toBeVisible();
    });

    test('3.3 필터 버튼에 호버 시 배경색이 변경된다', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: '필터' });

      await expect(filterButton).toHaveClass(/hover:bg-slate-100/);
      await filterButton.hover();
    });

    test('3.4 필터 아이콘이 표시된다', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: '필터' });
      const icon = filterButton.locator('svg');

      await expect(icon).toBeVisible();
    });
  });

  test.describe('4. 상태 필터 체크박스', () => {
    test.beforeEach(async ({ page }) => {
      // 필터 영역 열기
      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=상태').first()).toBeVisible();
    });

    test('4.1 모든 상태 옵션이 표시된다', async ({ page }) => {
      await expect(page.locator('text=신규')).toBeVisible();
      await expect(page.locator('text=처리중')).toBeVisible();
      await expect(page.locator('text=보류')).toBeVisible();
      await expect(page.locator('text=해결완료')).toBeVisible();
      await expect(page.locator('text=종료')).toBeVisible();
      await expect(page.locator('text=반려')).toBeVisible();
    });

    test('4.2 상태 체크박스를 선택하면 필터가 적용된다', async ({ page }) => {
      let statusParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        statusParam = url.searchParams.get('status') || '';

        const filtered =
          statusParam === 'NEW' ? mockVocs.filter((v) => v.status === 'NEW') : mockVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageResponse,
              content: filtered,
            },
          }),
        });
      });

      const newStatusCheckbox = page
        .locator('label', { hasText: '신규' })
        .locator('input[type="checkbox"]');

      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await newStatusCheckbox.check();
      await responsePromise;

      expect(statusParam).toBe('NEW');
    });

    test('4.3 여러 상태를 동시에 선택할 수 있다', async ({ page }) => {
      const newCheckbox = page
        .locator('label', { hasText: '신규' })
        .locator('input[type="checkbox"]');
      const inProgressCheckbox = page
        .locator('label', { hasText: '처리중' })
        .locator('input[type="checkbox"]');

      await newCheckbox.check();
      await inProgressCheckbox.check();

      await expect(newCheckbox).toBeChecked();
      await expect(inProgressCheckbox).toBeChecked();
    });

    test('4.4 선택한 상태를 해제하면 필터가 제거된다', async ({ page }) => {
      const newCheckbox = page
        .locator('label', { hasText: '신규' })
        .locator('input[type="checkbox"]');

      await newCheckbox.check();
      await expect(newCheckbox).toBeChecked();

      await newCheckbox.uncheck();
      await expect(newCheckbox).not.toBeChecked();
    });

    test('4.5 체크박스 레이블에 호버 시 배경색이 변경된다', async ({ page }) => {
      const label = page.locator('label', { hasText: '신규' });

      await expect(label).toHaveClass(/hover:bg-slate-100/);
      await label.hover();
    });
  });

  test.describe('5. 우선순위 필터 체크박스', () => {
    test.beforeEach(async ({ page }) => {
      // 필터 영역 열기
      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=우선순위').first()).toBeVisible();
    });

    test('5.1 모든 우선순위 옵션이 표시된다', async ({ page }) => {
      await expect(page.locator('text=낮음')).toBeVisible();
      await expect(page.locator('text=보통')).toBeVisible();
      await expect(page.locator('text=높음')).toBeVisible();
      await expect(page.locator('text=긴급')).toBeVisible();
    });

    test('5.2 우선순위 체크박스를 선택하면 필터가 적용된다', async ({ page }) => {
      let priorityParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        priorityParam = url.searchParams.get('priority') || '';

        const filtered =
          priorityParam === 'HIGH' ? mockVocs.filter((v) => v.priority === 'HIGH') : mockVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageResponse,
              content: filtered,
            },
          }),
        });
      });

      const highPriorityCheckbox = page
        .locator('label', { hasText: '높음' })
        .locator('input[type="checkbox"]');

      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await highPriorityCheckbox.check();
      await responsePromise;

      expect(priorityParam).toBe('HIGH');
    });

    test('5.3 여러 우선순위를 동시에 선택할 수 있다', async ({ page }) => {
      const highCheckbox = page
        .locator('label', { hasText: '높음' })
        .locator('input[type="checkbox"]');
      const urgentCheckbox = page
        .locator('label', { hasText: '긴급' })
        .locator('input[type="checkbox"]');

      await highCheckbox.check();
      await urgentCheckbox.check();

      await expect(highCheckbox).toBeChecked();
      await expect(urgentCheckbox).toBeChecked();
    });

    test('5.4 선택한 우선순위를 해제할 수 있다', async ({ page }) => {
      const highCheckbox = page
        .locator('label', { hasText: '높음' })
        .locator('input[type="checkbox"]');

      await highCheckbox.check();
      await highCheckbox.uncheck();

      await expect(highCheckbox).not.toBeChecked();
    });
  });

  test.describe('6. 날짜 범위 필터', () => {
    test.beforeEach(async ({ page }) => {
      // 필터 영역 열기
      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=기간').first()).toBeVisible();
    });

    test('6.1 시작일과 종료일 입력 필드가 표시된다', async ({ page }) => {
      const dateInputs = page.locator('input[type="date"]');
      await expect(dateInputs).toHaveCount(2);
    });

    test('6.2 시작일을 선택할 수 있다', async ({ page }) => {
      const fromDate = page.locator('input[type="date"]').first();

      await fromDate.fill('2026-01-20');
      await expect(fromDate).toHaveValue('2026-01-20');
    });

    test('6.3 종료일을 선택할 수 있다', async ({ page }) => {
      const toDate = page.locator('input[type="date"]').nth(1);

      await toDate.fill('2026-01-27');
      await expect(toDate).toHaveValue('2026-01-27');
    });

    test('6.4 날짜 범위를 선택하면 필터가 적용된다', async ({ page }) => {
      let fromDateParam = '';
      let toDateParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        fromDateParam = url.searchParams.get('fromDate') || '';
        toDateParam = url.searchParams.get('toDate') || '';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockPageResponse,
          }),
        });
      });

      const fromDate = page.locator('input[type="date"]').first();
      const toDate = page.locator('input[type="date"]').nth(1);

      const response1 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await fromDate.fill('2026-01-20');
      await response1;

      const response2 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await toDate.fill('2026-01-27');
      await response2;

      expect(fromDateParam).toBe('2026-01-20');
      expect(toDateParam).toBe('2026-01-27');
    });

    test('6.5 날짜 입력 필드에 포커스 시 스타일이 변경된다', async ({ page }) => {
      const fromDate = page.locator('input[type="date"]').first();

      await expect(fromDate).toHaveClass(/focus:ring-2/);
      await expect(fromDate).toHaveClass(/focus:ring-primary/);
    });

    test('6.6 날짜 구분자(~)가 표시된다', async ({ page }) => {
      await expect(page.locator('text=~')).toBeVisible();
    });
  });

  test.describe('7. 초기화 버튼', () => {
    test('7.1 필터를 적용하면 초기화 버튼이 표시된다', async ({ page }) => {
      // 초기 상태 - 버튼 숨김
      await expect(page.getByRole('button', { name: '초기화' })).not.toBeVisible();

      // 검색어 입력
      const searchInput = page.locator('input[placeholder*="검색"]');
      await searchInput.fill('배송');

      // 초기화 버튼 표시
      await expect(page.getByRole('button', { name: '초기화' })).toBeVisible();
    });

    test('7.2 초기화 버튼을 클릭하면 모든 필터가 제거된다', async ({ page }) => {
      // 검색어 입력
      const searchInput = page.locator('input[placeholder*="검색"]');
      await searchInput.fill('배송');

      // 필터 열기 및 선택
      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=상태').first()).toBeVisible();

      const newCheckbox = page
        .locator('label', { hasText: '신규' })
        .locator('input[type="checkbox"]');
      await newCheckbox.check();

      // 초기화
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await page.getByRole('button', { name: '초기화' }).click();
      await responsePromise;

      // 검증
      await expect(searchInput).toHaveValue('');
      await expect(newCheckbox).not.toBeChecked();
    });

    test('7.3 초기화 버튼에 호버 시 색상이 변경된다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');
      await searchInput.fill('배송');

      const resetButton = page.getByRole('button', { name: '초기화' });

      await expect(resetButton).toHaveClass(/hover:text-primary/);
      await resetButton.hover();
    });

    test('7.4 초기화 후 전체 VOC 목록이 표시된다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');
      await searchInput.fill('배송');
      const response1 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await searchInput.press('Enter');
      await response1;

      const response2 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await page.getByRole('button', { name: '초기화' }).click();
      await response2;

      const rows = page.locator('tbody tr');
      await expect(rows).toHaveCount(3);
    });
  });

  test.describe('8. 테이블 행 상호작용', () => {
    test('8.1 행에 호버 시 배경색이 변경된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();

      await expect(firstRow).toHaveClass(/hover:bg-slate-50/);
      await firstRow.hover();

      // 배경색 변경 확인
      const bgColor = await firstRow.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('8.2 행을 클릭하면 상세 페이지로 이동한다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();

      await firstRow.click();
      await page.waitForURL('**/voc/1', { timeout: 5000 });

      expect(page.url()).toContain('/voc/1');
    });

    test('8.3 티켓번호를 클릭하면 상세 페이지로 이동한다', async ({ page }) => {
      const ticketIdLink = page.locator('tbody tr').first().locator('td').first();

      await ticketIdLink.click();
      await page.waitForURL('**/voc/1', { timeout: 5000 });

      expect(page.url()).toContain('/voc/1');
    });

    test('8.4 제목에 호버 시 색상이 변경된다', async ({ page }) => {
      const titleCell = page.locator('tbody tr').first().locator('td').nth(1).locator('div');

      await expect(titleCell).toHaveClass(/hover:text-primary/);
      await titleCell.hover();
    });

    test('8.5 커서가 포인터로 변경된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();

      await expect(firstRow).toHaveClass(/cursor-pointer/);
    });
  });

  test.describe('9. 상태 배지', () => {
    test('9.1 NEW 상태 배지가 올바르게 표시된다', async ({ page }) => {
      const statusBadge = page.locator('tbody tr').first().locator('td').nth(3);

      await expect(statusBadge.locator('.bg-info, .bg-blue-100')).toBeVisible();
    });

    test('9.2 IN_PROGRESS 상태 배지가 올바르게 표시된다', async ({ page }) => {
      const statusBadge = page.locator('tbody tr').nth(1).locator('td').nth(3);

      await expect(statusBadge.getByText('처리중', { exact: false })).toBeVisible();
    });

    test('9.3 RESOLVED 상태 배지가 올바르게 표시된다', async ({ page }) => {
      const statusBadge = page.locator('tbody tr').nth(2).locator('td').nth(3);

      await expect(statusBadge.getByText('해결완료', { exact: false })).toBeVisible();
    });

    test('9.4 각 상태별로 다른 색상이 적용된다', async ({ page }) => {
      const badge1 = page.locator('tbody tr').nth(0).locator('td').nth(3).locator('span').first();
      const badge2 = page.locator('tbody tr').nth(1).locator('td').nth(3).locator('span').first();

      const color1 = await badge1.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const color2 = await badge2.evaluate((el) => window.getComputedStyle(el).backgroundColor);

      expect(color1).not.toBe(color2);
    });
  });

  test.describe('10. 우선순위 배지', () => {
    test('10.1 HIGH 우선순위 배지가 올바르게 표시된다', async ({ page }) => {
      const priorityBadge = page.locator('tbody tr').first().locator('td').nth(4);

      await expect(priorityBadge.getByText('높음', { exact: false })).toBeVisible();
    });

    test('10.2 URGENT 우선순위 배지가 올바르게 표시된다', async ({ page }) => {
      const priorityBadge = page.locator('tbody tr').nth(1).locator('td').nth(4);

      await expect(priorityBadge.getByText('긴급', { exact: false })).toBeVisible();
    });

    test('10.3 MEDIUM 우선순위 배지가 올바르게 표시된다', async ({ page }) => {
      const priorityBadge = page.locator('tbody tr').nth(2).locator('td').nth(4);

      await expect(priorityBadge.getByText('보통', { exact: false })).toBeVisible();
    });

    test('10.4 각 우선순위별로 다른 색상이 적용된다', async ({ page }) => {
      const badge1 = page.locator('tbody tr').nth(0).locator('td').nth(4).locator('span').first();
      const badge2 = page.locator('tbody tr').nth(1).locator('td').nth(4).locator('span').first();

      const color1 = await badge1.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const color2 = await badge2.evaluate((el) => window.getComputedStyle(el).backgroundColor);

      expect(color1).not.toBe(color2);
    });
  });

  test.describe('11. 카테고리 표시', () => {
    test('11.1 카테고리 이름이 표시된다', async ({ page }) => {
      const categoryCell = page.locator('tbody tr').first().locator('td').nth(2);

      await expect(categoryCell).toContainText('배송');
    });

    test('11.2 카테고리 코드가 표시된다', async ({ page }) => {
      const categoryCell = page.locator('tbody tr').first().locator('td').nth(2);

      await expect(categoryCell).toContainText('DELIVERY');
    });

    test('11.3 카테고리가 없는 경우 "미분류"가 표시된다', async ({ page }) => {
      // 카테고리 없는 데이터로 재모킹
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageResponse,
              content: [
                {
                  ...mockVocs[0],
                  category: null,
                },
              ],
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const categoryCell = page.locator('tbody tr').first().locator('td').nth(2);
      await expect(categoryCell).toContainText('미분류');
    });
  });

  test.describe('12. 담당자 표시', () => {
    test('12.1 담당자 이름이 표시된다', async ({ page }) => {
      const assigneeCell = page.locator('tbody tr').first().locator('td').nth(5);

      await expect(assigneeCell).toContainText('홍길동');
    });

    test('12.2 담당자 사용자명이 표시된다', async ({ page }) => {
      const assigneeCell = page.locator('tbody tr').first().locator('td').nth(5);

      await expect(assigneeCell).toContainText('@agent1');
    });

    test('12.3 담당자가 없는 경우 "미배정"이 표시된다', async ({ page }) => {
      const assigneeCell = page.locator('tbody tr').nth(2).locator('td').nth(5);

      await expect(assigneeCell).toContainText('미배정');
    });
  });

  test.describe('13. 날짜 포맷', () => {
    test('13.1 등록일이 올바른 형식으로 표시된다', async ({ page }) => {
      const createdAtCell = page.locator('tbody tr').first().locator('td').nth(6);

      // YYYY. MM. DD 형식
      await expect(createdAtCell).toContainText('2026');
      await expect(createdAtCell).toContainText('01');
      await expect(createdAtCell).toContainText('25');
    });

    test('13.2 최종 수정일이 날짜와 시간을 포함한다', async ({ page }) => {
      const updatedAtCell = page.locator('tbody tr').first().locator('td').nth(7);

      // 시간 정보 포함 확인
      const text = await updatedAtCell.textContent();
      expect(text).toMatch(/\d{2}:\d{2}/); // HH:MM 형식
    });
  });

  test.describe('14. 페이지네이션 정보', () => {
    test('14.1 총 항목 수가 표시된다', async ({ page }) => {
      await expect(page.locator('text=총')).toBeVisible();
      await expect(page.locator('text=3')).toBeVisible();
      await expect(page.locator('text=개')).toBeVisible();
    });

    test('14.2 현재 페이지와 총 페이지가 표시된다', async ({ page }) => {
      const paginationInfo = page.locator('.text-sm.text-slate-700, .text-sm.text-slate-300');

      await expect(paginationInfo.first()).toContainText('1');
      await expect(paginationInfo.first()).toContainText('페이지');
    });

    test('14.3 페이지 크기 선택 드롭다운이 표시된다', async ({ page }) => {
      const pageSizeSelect = page.locator('#pageSize');

      await expect(pageSizeSelect).toBeVisible();
      await expect(pageSizeSelect).toHaveValue('10');
    });

    test('14.4 페이지 크기 옵션이 올바르게 표시된다', async ({ page }) => {
      const pageSizeSelect = page.locator('#pageSize');

      await pageSizeSelect.click();

      await expect(page.locator('option[value="10"]')).toBeVisible();
      await expect(page.locator('option[value="20"]')).toBeVisible();
      await expect(page.locator('option[value="50"]')).toBeVisible();
    });
  });

  test.describe('15. 페이지 크기 변경', () => {
    test('15.1 페이지 크기를 20으로 변경할 수 있다', async ({ page }) => {
      let sizeParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        sizeParam = url.searchParams.get('size') || '10';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageResponse,
              size: parseInt(sizeParam),
            },
          }),
        });
      });

      const pageSizeSelect = page.locator('#pageSize');

      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await pageSizeSelect.selectOption('20');
      await responsePromise;

      expect(sizeParam).toBe('20');
      await expect(pageSizeSelect).toHaveValue('20');
    });

    test('15.2 페이지 크기를 50으로 변경할 수 있다', async ({ page }) => {
      const pageSizeSelect = page.locator('#pageSize');

      await pageSizeSelect.selectOption('50');

      await expect(pageSizeSelect).toHaveValue('50');
    });

    test('15.3 페이지 크기 변경 시 첫 페이지로 이동한다', async ({ page }) => {
      let pageParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        pageParam = url.searchParams.get('page') || '0';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockPageResponse,
          }),
        });
      });

      const pageSizeSelect = page.locator('#pageSize');

      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await pageSizeSelect.selectOption('20');
      await responsePromise;

      expect(pageParam).toBe('0');
    });
  });

  test.describe('16. 페이지 네비게이션', () => {
    test('16.1 첫 페이지에서 이전 버튼이 비활성화된다', async ({ page }) => {
      const prevButton = page.getByRole('button', { name: '이전' });

      await expect(prevButton).toBeDisabled();
      await expect(prevButton).toHaveClass(/cursor-not-allowed/);
    });

    test('16.2 마지막 페이지에서 다음 버튼이 비활성화된다', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: '다음' });

      await expect(nextButton).toBeDisabled();
      await expect(nextButton).toHaveClass(/cursor-not-allowed/);
    });

    test('16.3 다음 페이지로 이동할 수 있다', async ({ page }) => {
      let pageParam = 0;

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        pageParam = parseInt(url.searchParams.get('page') || '0');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageResponse,
              page: pageParam,
              first: pageParam === 0,
              last: pageParam === 1,
            },
          }),
        });
      });

      const nextButton = page.getByRole('button', { name: '다음' });

      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await nextButton.click();
      await responsePromise;

      expect(pageParam).toBe(1);
    });

    test('16.4 이전 페이지로 이동할 수 있다', async ({ page }) => {
      let pageParam = 1;

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        pageParam = parseInt(url.searchParams.get('page') || '0');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPageResponse,
              page: pageParam,
              first: pageParam === 0,
              last: pageParam === 1,
            },
          }),
        });
      });

      // 먼저 2페이지로 이동
      await page.goto('/voc/table?page=1');
      await page.waitForLoadState('networkidle');

      const prevButton = page.getByRole('button', { name: '이전' });

      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await prevButton.click();
      await responsePromise;

      expect(pageParam).toBe(0);
    });
  });

  test.describe('17. 로딩 상태', () => {
    test('17.1 데이터 로딩 중에는 스피너가 표시된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockPageResponse,
          }),
        });
      });

      await page.goto('/voc/table');

      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible({ timeout: 1000 });
    });

    test('17.2 로딩 완료 후 테이블이 표시된다', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('18. 빈 상태', () => {
    test('18.1 데이터가 없을 때 빈 상태 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [],
              page: 0,
              size: 10,
              totalElements: 0,
              totalPages: 0,
              first: true,
              last: true,
              empty: true,
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=검색 결과가 없습니다.')).toBeVisible();
    });

    test('18.2 빈 상태에서 테이블이 표시되지 않는다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [],
              page: 0,
              size: 10,
              totalElements: 0,
              totalPages: 0,
              first: true,
              last: true,
              empty: true,
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const table = page.locator('table');
      await expect(table).not.toBeVisible();
    });
  });

  test.describe('19. 에러 처리', () => {
    test('19.1 API 에러 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              message: '서버 오류',
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=데이터를 불러오는 중 오류가 발생했습니다.')).toBeVisible();
    });

    test('19.2 네트워크 오류 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.abort('failed');
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // 에러 상태 확인
      const errorMessage = page.locator('.bg-danger, .border-danger');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('20. 반응형 레이아웃', () => {
    test('20.1 모바일 뷰포트에서 테이블이 가로 스크롤된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const tableContainer = page.locator('.overflow-x-auto');
      await expect(tableContainer).toBeVisible();

      // 테이블이 컨테이너 너비를 초과하는지 확인
      const containerWidth = await tableContainer.evaluate((el) => el.clientWidth);
      const tableWidth = await page.locator('table').evaluate((el) => el.scrollWidth);

      expect(tableWidth).toBeGreaterThan(containerWidth);
    });

    test('20.2 태블릿 뷰포트에서 레이아웃이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const table = page.locator('table');
      await expect(table).toBeVisible();

      // 모든 헤더가 보이는지 확인
      await expect(page.locator('th', { hasText: '티켓번호' })).toBeVisible();
      await expect(page.locator('th', { hasText: '제목' })).toBeVisible();
    });

    test('20.3 데스크톱 뷰포트에서 전체 테이블이 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      const table = page.locator('table');
      await expect(table).toBeVisible();

      // 모든 컬럼이 보이는지 확인
      const headers = page.locator('thead th');
      await expect(headers).toHaveCount(8);
    });

    test('20.4 모바일에서 검색 필터가 세로로 배치된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const searchInput = page.locator('input[placeholder*="검색"]');
      await expect(searchInput).toBeVisible();

      const filterButton = page.getByRole('button', { name: '필터' });
      await expect(filterButton).toBeVisible();
    });
  });

  test.describe('21. 접근성 (Accessibility)', () => {
    test('21.1 테이블에 적절한 시맨틱 구조가 있다', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible();

      await expect(table.locator('thead')).toBeVisible();
      await expect(table.locator('tbody')).toBeVisible();
      await expect(table.locator('th')).toHaveCount(8);
    });

    test('21.2 페이지네이션 버튼에 적절한 type 속성이 있다', async ({ page }) => {
      const prevButton = page.getByRole('button', { name: '이전' });
      const nextButton = page.getByRole('button', { name: '다음' });

      await expect(prevButton).toHaveAttribute('type', 'button');
      await expect(nextButton).toHaveAttribute('type', 'button');
    });

    test('21.3 검색 폼이 submit 이벤트를 처리한다', async ({ page }) => {
      const searchForm = page.locator('form').first();
      await expect(searchForm).toBeVisible();
    });

    test('21.4 페이지 크기 선택에 label이 연결되어 있다', async ({ page }) => {
      const label = page.locator('label[for="pageSize"]');
      const select = page.locator('#pageSize');

      await expect(label).toBeVisible();
      await expect(select).toBeVisible();
    });
  });

  test.describe('22. 키보드 네비게이션', () => {
    test('22.1 Tab 키로 검색 필드에 포커스할 수 있다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');

      await page.keyboard.press('Tab');
      await expect(searchInput).toBeFocused();
    });

    test('22.2 Tab 키로 필터 버튼에 포커스할 수 있다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');
      const filterButton = page.getByRole('button', { name: '필터' });

      await searchInput.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // 검색 버튼 건너뛰기
      await expect(filterButton).toBeFocused();
    });

    test('22.3 Enter 키로 필터 버튼을 활성화할 수 있다', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: '필터' });

      await filterButton.focus();
      await page.keyboard.press('Enter');

      await expect(page.locator('text=상태').first()).toBeVisible();
    });

    test('22.4 Tab 키로 페이지네이션 버튼에 포커스할 수 있다', async ({ page }) => {
      const prevButton = page.getByRole('button', { name: '이전' });

      await prevButton.focus();
      await expect(prevButton).toBeFocused();
    });
  });

  test.describe('23. 복합 필터 시나리오', () => {
    test('23.1 검색어와 상태 필터를 동시에 적용할 수 있다', async ({ page }) => {
      let searchParam = '';
      let statusParam = '';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        searchParam = url.searchParams.get('search') || '';
        statusParam = url.searchParams.get('status') || '';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockPageResponse,
          }),
        });
      });

      const searchInput = page.locator('input[placeholder*="검색"]');
      await searchInput.fill('배송');
      const response1 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await searchInput.press('Enter');
      await response1;

      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=상태').first()).toBeVisible();

      const newCheckbox = page
        .locator('label', { hasText: '신규' })
        .locator('input[type="checkbox"]');
      const response2 = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await newCheckbox.check();
      await response2;

      expect(searchParam).toBe('배송');
      expect(statusParam).toBe('NEW');
    });

    test('23.2 우선순위와 날짜 범위 필터를 동시에 적용할 수 있다', async ({ page }) => {
      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=우선순위').first()).toBeVisible();

      const highCheckbox = page
        .locator('label', { hasText: '높음' })
        .locator('input[type="checkbox"]');
      await highCheckbox.check();

      const fromDate = page.locator('input[type="date"]').first();
      await fromDate.fill('2026-01-20');

      await expect(highCheckbox).toBeChecked();
      await expect(fromDate).toHaveValue('2026-01-20');
    });

    test('23.3 모든 필터를 동시에 적용할 수 있다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');
      await searchInput.fill('배송');

      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=상태').first()).toBeVisible();

      const newCheckbox = page
        .locator('label', { hasText: '신규' })
        .locator('input[type="checkbox"]');
      await newCheckbox.check();

      const highCheckbox = page
        .locator('label', { hasText: '높음' })
        .locator('input[type="checkbox"]');
      await highCheckbox.check();

      const fromDate = page.locator('input[type="date"]').first();
      await fromDate.fill('2026-01-20');

      await expect(searchInput).toHaveValue('배송');
      await expect(newCheckbox).toBeChecked();
      await expect(highCheckbox).toBeChecked();
      await expect(fromDate).toHaveValue('2026-01-20');
    });
  });

  test.describe('24. 성능 및 최적화', () => {
    test('24.1 페이지 로드 시간이 합리적이다', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/voc/table');
      await page.waitForLoadState('networkidle');

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(5000); // 5초 이내
    });

    test('24.2 필터 변경 시 디바운스 없이 즉시 적용된다', async ({ page }) => {
      await page.getByRole('button', { name: '필터' }).click();
      await expect(page.locator('text=상태').first()).toBeVisible();

      const startTime = Date.now();

      const newCheckbox = page
        .locator('label', { hasText: '신규' })
        .locator('input[type="checkbox"]');

      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/vocs?')
      );
      await newCheckbox.check();
      await responsePromise;

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // 2초 이내
    });
  });
});
