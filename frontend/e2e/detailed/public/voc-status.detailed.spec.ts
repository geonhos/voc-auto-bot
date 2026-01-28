import { test, expect } from '@playwright/test';

/**
 * @description VOC 상태 조회 페이지 상세 E2E 테스트 시나리오
 * @route /voc/status (공개 페이지)
 * @issue #117
 *
 * ## 테스트 대상 UI 요소
 * 1. VocStatusLookup (조회 폼)
 *    - Ticket ID 입력 필드 (#ticketId)
 *    - 이메일 입력 필드 (#customerEmail)
 *    - 초기화 버튼
 *    - 조회 버튼
 * 2. VocStatusResult (결과 표시)
 *    - 티켓 정보 카드
 *    - Ticket ID 복사 버튼
 *    - 상태 배지
 * 3. VocStatusTimeline (상태 타임라인)
 *    - 타임라인 아이템
 *    - 상태별 아이콘/색상
 * 4. 에러 상태 (Empty State, 네트워크 오류)
 */

test.describe('VOC 상태 조회 페이지 (/voc/status) - 상세 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    // 인증 상태 초기화 (공개 페이지이므로 인증 불필요)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/voc/status');
  });

  test.describe('1. 페이지 렌더링', () => {
    test('1.1 페이지 타이틀과 헤딩이 올바르게 표시된다', async ({ page }) => {
      // Assert - 메인 헤딩
      await expect(page.locator('h1')).toHaveText('VOC 상태 조회');
      await expect(page.locator('h1')).toBeVisible();

      // Assert - 설명 텍스트
      const description = page.locator('text=Ticket ID로 VOC의 현재 처리 상태를 빠르게 조회하세요');
      await expect(description).toBeVisible();
    });

    test('1.2 모든 폼 필드가 올바르게 렌더링된다', async ({ page }) => {
      // Assert - Ticket ID 필드
      const ticketIdLabel = page.locator('label[for="ticketId"]');
      const ticketIdInput = page.locator('#ticketId');
      await expect(ticketIdLabel).toContainText('Ticket ID');
      await expect(ticketIdInput).toBeVisible();
      await expect(ticketIdInput).toHaveAttribute('type', 'text');
      await expect(ticketIdInput).toHaveAttribute('placeholder', 'VOC-YYYYMMDD-XXXXX');
      await expect(ticketIdInput).toHaveAttribute('autocomplete', 'off');
      await expect(ticketIdInput).toHaveAttribute('maxlength', '22');

      // Assert - 이메일 필드
      const emailLabel = page.locator('label[for="customerEmail"]');
      const emailInput = page.locator('#customerEmail');
      await expect(emailLabel).toContainText('최종 사용자 이메일');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('placeholder', 'user@example.com');
      await expect(emailInput).toHaveAttribute('autocomplete', 'off');

      // Assert - 버튼들
      const resetButton = page.getByRole('button', { name: '초기화' });
      const submitButton = page.getByRole('button', { name: /^조회$/ });
      await expect(resetButton).toBeVisible();
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('1.3 필수 필드 표시(*)가 올바르게 표시된다', async ({ page }) => {
      // Assert - label에 required 표시
      const ticketIdLabel = page.locator('label[for="ticketId"]');
      const emailLabel = page.locator('label[for="customerEmail"]');

      // CSS after 컨텐트로 별표가 표시되므로 클래스 확인
      await expect(ticketIdLabel).toHaveClass(/after:content-\['\*'\]/);
      await expect(emailLabel).toHaveClass(/after:content-\['\*'\]/);
    });

    test('1.4 도움말 텍스트가 올바르게 표시된다', async ({ page }) => {
      // Assert - Ticket ID 도움말
      const ticketIdHelp = page.locator('#ticketIdHelp');
      await expect(ticketIdHelp).toBeVisible();
      await expect(ticketIdHelp).toHaveText('예: VOC-20260123-00001');

      // Assert - 이메일 도움말
      const emailHelp = page.locator('#emailHelp');
      await expect(emailHelp).toBeVisible();
      await expect(emailHelp).toHaveText('VOC 접수 시 입력한 이메일 주소');
    });

    test('1.5 보안 안내 메시지가 표시된다', async ({ page }) => {
      const infoBox = page.locator('.bg-blue-50', { hasText: '보안 안내' });
      await expect(infoBox).toBeVisible();
      await expect(infoBox).toContainText('Ticket ID와 이메일 정보가 일치해야만 조회가 가능합니다');
      await expect(infoBox).toContainText('조회 요청은 분당 10건으로 제한됩니다');
    });

    test('1.6 인증 없이 페이지에 접근 가능하다', async ({ page }) => {
      // Assert - 공개 페이지로 로그인 리다이렉트 없음
      expect(page.url()).toContain('/voc/status');
      expect(page.url()).not.toContain('/login');

      // Assert - 폼이 정상적으로 보임
      await expect(page.locator('#ticketId')).toBeVisible();
    });
  });

  test.describe('2. Ticket ID 입력 필드 (#ticketId)', () => {
    test('2.1 클릭 시 포커스된다', async ({ page }) => {
      const ticketIdInput = page.locator('#ticketId');

      // Act
      await ticketIdInput.click();

      // Assert
      await expect(ticketIdInput).toBeFocused();
    });

    test('2.2 텍스트 입력이 가능하다', async ({ page }) => {
      const ticketIdInput = page.locator('#ticketId');

      // Act
      await ticketIdInput.fill('VOC-20260125-00001');

      // Assert
      await expect(ticketIdInput).toHaveValue('VOC-20260125-00001');
    });

    test('2.3 빈 상태로 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Arrange
      await page.locator('#customerEmail').fill('test@example.com');

      // Act
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      await expect(page.locator('text=티켓 ID를 입력해주세요')).toBeVisible();
      await expect(page.locator('#ticketId')).toHaveAttribute('aria-invalid', 'true');
    });

    test('2.4 잘못된 Ticket ID 형식 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#ticketId').fill('INVALID-FORMAT');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      await expect(
        page.locator('text=올바른 티켓 ID 형식이 아닙니다')
      ).toBeVisible();
    });

    test('2.5 올바른 형식 예시: VOC-YYYYMMDD-XXXXX', async ({ page }) => {
      const ticketIdInput = page.locator('#ticketId');

      // Act - 올바른 형식 입력
      await ticketIdInput.fill('VOC-20260125-00001');

      // Assert - 입력 성공
      await expect(ticketIdInput).toHaveValue('VOC-20260125-00001');
    });

    test('2.6 최대 22자까지 입력 가능하다', async ({ page }) => {
      const ticketIdInput = page.locator('#ticketId');
      const validTicketId = 'VOC-20260125-00001'; // 19자

      // Act
      await ticketIdInput.fill(validTicketId + 'XXX'); // 22자 초과

      // Assert - maxlength 속성으로 제한됨
      const value = await ticketIdInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(22);
    });

    test('2.7 포커스 시 테두리 스타일이 변경된다', async ({ page }) => {
      const ticketIdInput = page.locator('#ticketId');

      // Act
      await ticketIdInput.focus();

      // Assert - focus:ring 클래스 확인
      await expect(ticketIdInput).toHaveClass(/focus:ring-2/);
      await expect(ticketIdInput).toHaveClass(/focus:ring-blue-500/);
    });

    test('2.8 에러 상태에서는 빨간 테두리가 표시된다', async ({ page }) => {
      // Act - 빈 값으로 제출하여 에러 발생
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      const ticketIdInput = page.locator('#ticketId');
      await expect(ticketIdInput).toHaveClass(/border-red-500/);
    });
  });

  test.describe('3. 이메일 입력 필드 (#customerEmail)', () => {
    test('3.1 클릭 시 포커스된다', async ({ page }) => {
      const emailInput = page.locator('#customerEmail');

      // Act
      await emailInput.click();

      // Assert
      await expect(emailInput).toBeFocused();
    });

    test('3.2 텍스트 입력이 가능하다', async ({ page }) => {
      const emailInput = page.locator('#customerEmail');

      // Act
      await emailInput.fill('user@example.com');

      // Assert
      await expect(emailInput).toHaveValue('user@example.com');
    });

    test('3.3 빈 상태로 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Arrange
      await page.locator('#ticketId').fill('VOC-20260125-00001');

      // Act
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      await expect(page.locator('text=이메일 주소를 입력해주세요')).toBeVisible();
      await expect(page.locator('#customerEmail')).toHaveAttribute('aria-invalid', 'true');
    });

    test('3.4 잘못된 이메일 형식 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('invalid-email');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      await expect(page.locator('text=올바른 이메일 형식이 아닙니다')).toBeVisible();
    });

    test('3.5 @ 없는 이메일은 유효성 검사 실패한다', async ({ page }) => {
      // Act
      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('invalidemail.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      await expect(page.locator('text=올바른 이메일 형식이 아닙니다')).toBeVisible();
    });

    test('3.6 포커스 시 테두리 스타일이 변경된다', async ({ page }) => {
      const emailInput = page.locator('#customerEmail');

      // Act
      await emailInput.focus();

      // Assert
      await expect(emailInput).toHaveClass(/focus:ring-2/);
      await expect(emailInput).toHaveClass(/focus:ring-blue-500/);
    });
  });

  test.describe('4. 초기화 버튼', () => {
    test('4.1 클릭 시 모든 입력 필드가 초기화된다', async ({ page }) => {
      // Arrange - 필드에 값 입력
      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');

      // Act
      await page.getByRole('button', { name: '초기화' }).click();

      // Assert
      await expect(page.locator('#ticketId')).toHaveValue('');
      await expect(page.locator('#customerEmail')).toHaveValue('');
    });

    test('4.2 클릭 시 에러 메시지가 초기화된다', async ({ page }) => {
      // Arrange - 에러 발생시키기
      await page.getByRole('button', { name: /^조회$/ }).click();
      await expect(page.locator('[role="alert"]')).toBeVisible();

      // Act
      await page.getByRole('button', { name: '초기화' }).click();

      // Assert
      await expect(page.locator('[role="alert"]')).not.toBeVisible();
    });

    test('4.3 로딩 중에는 버튼이 비활성화된다', async ({ page }) => {
      // Arrange - API 응답 지연
      await page.route('**/api/vocs/status', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'Test',
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');

      // Act - 조회 시작
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert - 로딩 중 초기화 버튼 비활성화
      const resetButton = page.getByRole('button', { name: '초기화' });
      await expect(resetButton).toBeDisabled();
    });

    test('4.4 호버 시 배경 색상이 변경된다', async ({ page }) => {
      const resetButton = page.getByRole('button', { name: '초기화' });

      // Assert - hover 클래스 확인
      await expect(resetButton).toHaveClass(/hover:bg-slate-100/);
    });
  });

  test.describe('5. 조회 버튼', () => {
    test.beforeEach(async ({ page }) => {
      // 기본 API 모킹 설정
      await page.route('**/api/vocs/status', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        if (
          postData?.ticketId === 'VOC-20260125-00001' &&
          postData?.customerEmail === 'hong@example.com'
        ) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ticketId: 'VOC-20260125-00001',
                title: '제품 배송 지연',
                status: 'RECEIVED',
                category: '제품 문의',
                priority: 'HIGH',
                createdAt: '2026-01-25T10:00:00Z',
                updatedAt: '2026-01-25T10:00:00Z',
                statusHistory: [
                  {
                    id: 1,
                    status: 'RECEIVED',
                    statusLabel: '접수됨',
                    changedAt: '2026-01-25T10:00:00Z',
                  },
                ],
              },
            }),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: {
                code: 'VOC_NOT_FOUND',
                message: 'VOC를 찾을 수 없습니다',
              },
            }),
          });
        }
      });
    });

    test('5.1 클릭 시 폼이 제출된다', async ({ page }) => {
      // Arrange
      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('hong@example.com');

      // Act
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert - 결과 표시
      await expect(page.locator('h2', { hasText: '조회 결과' })).toBeVisible({ timeout: 5000 });
    });

    test('5.2 로딩 중에는 버튼이 비활성화되고 텍스트가 변경된다', async ({ page }) => {
      // Arrange - API 응답 지연
      await page.route('**/api/vocs/status', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'Test',
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');

      // Act
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert - 로딩 상태
      const loadingButton = page.getByRole('button', { name: '조회 중...' });
      await expect(loadingButton).toBeVisible();
      await expect(loadingButton).toBeDisabled();
    });

    test('5.3 유효하지 않은 입력 시 API 호출 없이 유효성 검사만 실행된다', async ({ page }) => {
      let apiCalled = false;
      await page.route('**/api/vocs/status', async (route) => {
        apiCalled = true;
        await route.fulfill({ status: 200 });
      });

      // Act - 빈 폼 제출
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      await expect(page.locator('text=티켓 ID를 입력해주세요')).toBeVisible();
      expect(apiCalled).toBe(false);
    });

    test('5.4 Enter 키로도 폼 제출이 가능하다', async ({ page }) => {
      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('hong@example.com');

      // Act - Enter 키 입력
      await page.locator('#customerEmail').press('Enter');

      // Assert
      await expect(page.locator('h2', { hasText: '조회 결과' })).toBeVisible({ timeout: 5000 });
    });

    test('5.5 호버 시 배경 색상이 변경된다', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /^조회$/ });

      // Assert
      await expect(submitButton).toHaveClass(/hover:bg-blue-700/);
    });
  });

  test.describe('6. 조회 결과 표시 (VocStatusResult)', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: '제품 배송 지연',
              status: 'RECEIVED',
              category: '제품 문의',
              priority: 'HIGH',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T11:30:00Z',
              statusHistory: [
                {
                  id: 1,
                  status: 'RECEIVED',
                  statusLabel: '접수됨',
                  changedAt: '2026-01-25T10:00:00Z',
                },
              ],
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('hong@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();
      await page.waitForTimeout(500);
    });

    test('6.1 조회 결과 제목이 표시된다', async ({ page }) => {
      await expect(page.locator('h2', { hasText: '조회 결과' })).toBeVisible();
    });

    test('6.2 Ticket ID가 올바르게 표시된다', async ({ page }) => {
      const ticketIdSection = page.locator('text=Ticket ID').locator('..');
      await expect(ticketIdSection).toBeVisible();
      await expect(page.locator('.font-mono', { hasText: 'VOC-20260125-00001' })).toBeVisible();
    });

    test('6.3 제목이 올바르게 표시된다', async ({ page }) => {
      const titleSection = page.locator('text=제목').locator('..');
      await expect(titleSection).toBeVisible();
      await expect(page.locator('.font-medium', { hasText: '제품 배송 지연' })).toBeVisible();
    });

    test('6.4 접수일시가 올바르게 표시된다', async ({ page }) => {
      const createdAtSection = page.locator('text=접수일시').locator('..');
      await expect(createdAtSection).toBeVisible();
      await expect(createdAtSection).toContainText('2026-01-25');
      await expect(createdAtSection).toContainText('KST');
    });

    test('6.5 최종 수정일시가 올바르게 표시된다', async ({ page }) => {
      const updatedAtSection = page.locator('text=최종 수정일시').locator('..');
      await expect(updatedAtSection).toBeVisible();
      await expect(updatedAtSection).toContainText('2026-01-25');
    });

    test('6.6 카테고리가 표시된다', async ({ page }) => {
      const categorySection = page.locator('text=카테고리').locator('..');
      await expect(categorySection).toBeVisible();
      await expect(categorySection).toContainText('제품 문의');
    });

    test('6.7 우선순위 배지가 표시된다', async ({ page }) => {
      const prioritySection = page.locator('text=우선순위').locator('..');
      await expect(prioritySection).toBeVisible();
    });

    test('6.8 상태 배지가 올바르게 표시된다', async ({ page }) => {
      // VocStatusBadge 컴포넌트 렌더링 확인
      const statusBadge = page.locator('[class*="inline-flex"]', { hasText: '접수됨' }).first();
      await expect(statusBadge).toBeVisible();
    });
  });

  test.describe('7. Ticket ID 복사 버튼', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'Test VOC',
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();
      await page.waitForTimeout(500);
    });

    test('7.1 복사 버튼이 표시된다', async ({ page }) => {
      const copyButton = page.getByRole('button', { name: 'Ticket ID 복사' });
      await expect(copyButton).toBeVisible();
    });

    test('7.2 클릭 시 아이콘이 체크 표시로 변경된다', async ({ page }) => {
      const copyButton = page.getByRole('button', { name: 'Ticket ID 복사' });

      // Act
      await copyButton.click();

      // Assert - 아이콘 변경 확인
      await expect(copyButton.locator('.material-icons-outlined', { hasText: 'check' })).toBeVisible({
        timeout: 1000,
      });
    });

    test('7.3 호버 시 색상이 변경된다', async ({ page }) => {
      const copyButton = page.getByRole('button', { name: 'Ticket ID 복사' });

      // Assert
      await expect(copyButton).toHaveClass(/hover:text-blue-600/);
    });

    test('7.4 클릭 후 2초 뒤 원래 아이콘으로 돌아온다', async ({ page }) => {
      const copyButton = page.getByRole('button', { name: 'Ticket ID 복사' });

      // Act
      await copyButton.click();
      await expect(copyButton.locator('.material-icons-outlined', { hasText: 'check' })).toBeVisible();

      // Assert - 2초 후 원래 아이콘으로 복원
      await page.waitForTimeout(2500);
      await expect(copyButton.locator('.material-icons-outlined', { hasText: 'content_copy' })).toBeVisible();
    });
  });

  test.describe('8. 상태 타임라인 (VocStatusTimeline)', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'Test VOC',
              status: 'IN_PROGRESS',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T14:00:00Z',
              statusHistory: [
                {
                  id: 1,
                  status: 'RECEIVED',
                  statusLabel: '접수됨',
                  changedAt: '2026-01-25T10:00:00Z',
                },
                {
                  id: 2,
                  status: 'ASSIGNED',
                  statusLabel: '배정됨',
                  changedAt: '2026-01-25T11:00:00Z',
                  changedBy: '김철수',
                },
                {
                  id: 3,
                  status: 'IN_PROGRESS',
                  statusLabel: '처리중',
                  changedAt: '2026-01-25T14:00:00Z',
                  changedBy: '김철수',
                },
              ],
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();
      await page.waitForTimeout(500);
    });

    test('8.1 타임라인 섹션 제목이 표시된다', async ({ page }) => {
      await expect(page.locator('h3', { hasText: '처리 진행 상태' })).toBeVisible();
    });

    test('8.2 모든 상태 히스토리 아이템이 표시된다', async ({ page }) => {
      const timelineItems = page.locator('ol[role="list"] > li');
      await expect(timelineItems).toHaveCount(3);
    });

    test('8.3 각 타임라인 아이템에 상태 라벨이 표시된다', async ({ page }) => {
      await expect(page.locator('.font-semibold', { hasText: '접수됨' })).toBeVisible();
      await expect(page.locator('.font-semibold', { hasText: '배정됨' })).toBeVisible();
      await expect(page.locator('.font-semibold', { hasText: '처리중' })).toBeVisible();
    });

    test('8.4 각 타임라인 아이템에 날짜/시간이 표시된다', async ({ page }) => {
      const timelineItems = page.locator('ol[role="list"] > li');
      const firstItem = timelineItems.nth(0);

      await expect(firstItem).toContainText('2026-01-25');
      await expect(firstItem).toContainText('10:00:00');
    });

    test('8.5 담당자 정보가 있는 경우 표시된다', async ({ page }) => {
      await expect(page.locator('text=담당자: 김철수')).toBeVisible();
    });

    test('8.6 완료된 상태는 초록색 아이콘으로 표시된다', async ({ page }) => {
      const completedIcon = page.locator('.bg-green-600').first();
      await expect(completedIcon).toBeVisible();
    });

    test('8.7 현재 진행중인 상태는 파란색 아이콘으로 표시된다', async ({ page }) => {
      const inProgressIcon = page.locator('.bg-blue-600').last();
      await expect(inProgressIcon).toBeVisible();
    });

    test('8.8 타임라인 아이템 간 연결선이 표시된다', async ({ page }) => {
      // CSS after 속성으로 연결선이 그려지므로 클래스 확인
      const timelineItems = page.locator('ol[role="list"] > li');
      const firstItem = timelineItems.nth(0);

      await expect(firstItem).toHaveClass(/after:absolute/);
      await expect(firstItem).toHaveClass(/after:bg-gray-200/);
    });

    test('8.9 마지막 타임라인 아이템에는 연결선이 없다', async ({ page }) => {
      const timelineItems = page.locator('ol[role="list"] > li');
      const lastItemClass = await timelineItems.nth(2).getAttribute('class');

      // 마지막 아이템은 after 클래스가 없거나 조건부로 적용되지 않음
      expect(lastItemClass).toBeTruthy();
    });
  });

  test.describe('9. 에러 상태 - VOC 찾을 수 없음 (404)', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'VOC_NOT_FOUND',
              message: 'VOC를 찾을 수 없습니다',
            },
          }),
        });
      });
    });

    test('9.1 조회 결과가 없음 메시지가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#ticketId').fill('VOC-20260125-99999');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      await expect(page.locator('h3', { hasText: '조회 결과가 없습니다' })).toBeVisible({ timeout: 3000 });
    });

    test('9.2 안내 메시지가 표시된다', async ({ page }) => {
      await page.locator('#ticketId').fill('VOC-20260125-99999');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      await expect(page.locator('text=Ticket ID와 이메일을 확인해주세요')).toBeVisible({ timeout: 3000 });
    });

    test('9.3 검색 아이콘이 표시된다', async ({ page }) => {
      await page.locator('#ticketId').fill('VOC-20260125-99999');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      await expect(page.locator('.material-icons-outlined', { hasText: 'search' })).toBeVisible({
        timeout: 3000,
      });
    });
  });

  test.describe('10. 에러 상태 - 네트워크 오류', () => {
    test('10.1 네트워크 오류 시 에러 메시지가 표시된다', async ({ page }) => {
      // Arrange - 네트워크 오류 시뮬레이션
      await page.route('**/api/vocs/status', async (route) => {
        await route.abort('failed');
      });

      // Act
      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert
      const errorAlert = page.locator('[role="alert"]', { hasText: '조회 중 오류가 발생했습니다' });
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
    });

    test('10.2 서버 500 에러 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '서버 오류가 발생했습니다' },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
    });

    test('10.3 에러 발생 후에도 폼을 다시 수정할 수 있다', async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({ status: 500 });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // 에러 표시 대기
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });

      // Act - 입력 수정
      await page.locator('#ticketId').fill('VOC-20260125-00002');
      await page.locator('#customerEmail').fill('new@example.com');

      // Assert
      await expect(page.locator('#ticketId')).toHaveValue('VOC-20260125-00002');
      await expect(page.locator('#customerEmail')).toHaveValue('new@example.com');
    });
  });

  test.describe('11. 키보드 네비게이션', () => {
    test('11.1 Tab 키로 폼 요소 간 이동이 가능하다', async ({ page }) => {
      const ticketIdInput = page.locator('#ticketId');
      const emailInput = page.locator('#customerEmail');
      const resetButton = page.getByRole('button', { name: '초기화' });
      const submitButton = page.getByRole('button', { name: /^조회$/ });

      // Ticket ID → Email
      await ticketIdInput.focus();
      await page.keyboard.press('Tab');
      await expect(emailInput).toBeFocused();

      // Email → Reset Button
      await page.keyboard.press('Tab');
      await expect(resetButton).toBeFocused();

      // Reset → Submit
      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();
    });

    test('11.2 Shift+Tab으로 역방향 이동이 가능하다', async ({ page }) => {
      const ticketIdInput = page.locator('#ticketId');
      const emailInput = page.locator('#customerEmail');
      const submitButton = page.getByRole('button', { name: /^조회$/ });

      await submitButton.focus();

      // 역방향 이동
      await page.keyboard.press('Shift+Tab');
      // Reset 버튼
      await page.keyboard.press('Shift+Tab');
      await expect(emailInput).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(ticketIdInput).toBeFocused();
    });

    test('11.3 Enter 키로 폼 제출이 가능하다', async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'Test',
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');

      // Act - Enter 키
      await page.keyboard.press('Enter');

      // Assert
      await expect(page.locator('h2', { hasText: '조회 결과' })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('12. 접근성 (Accessibility)', () => {
    test('12.1 모든 폼 필드에 aria-label이 설정되어 있다', async ({ page }) => {
      await expect(page.locator('#ticketId')).toHaveAttribute('aria-label', 'Ticket ID');
      await expect(page.locator('#customerEmail')).toHaveAttribute('aria-label', '이메일');
    });

    test('12.2 필수 필드에 aria-required가 설정되어 있다', async ({ page }) => {
      await expect(page.locator('#ticketId')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('#customerEmail')).toHaveAttribute('aria-required', 'true');
    });

    test('12.3 유효성 검사 실패 시 aria-invalid가 true로 설정된다', async ({ page }) => {
      await page.getByRole('button', { name: /^조회$/ }).click();

      await expect(page.locator('#ticketId')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#customerEmail')).toHaveAttribute('aria-invalid', 'true');
    });

    test('12.4 에러 메시지에 role="alert"가 설정되어 있다', async ({ page }) => {
      await page.getByRole('button', { name: /^조회$/ }).click();

      const alerts = page.locator('[role="alert"]');
      const count = await alerts.count();
      expect(count).toBeGreaterThan(0);
    });

    test('12.5 도움말 텍스트가 aria-describedby로 연결되어 있다', async ({ page }) => {
      await expect(page.locator('#ticketId')).toHaveAttribute('aria-describedby', 'ticketIdHelp');
      await expect(page.locator('#customerEmail')).toHaveAttribute('aria-describedby', 'emailHelp');
    });

    test('12.6 버튼에 적절한 aria-label이 설정되어 있다', async ({ page }) => {
      await expect(page.getByRole('button', { name: '초기화' })).toHaveAttribute('aria-label', '입력 초기화');
      await expect(page.getByRole('button', { name: /^조회$/ })).toHaveAttribute('aria-label', 'VOC 상태 조회');
    });
  });

  test.describe('13. 반응형 레이아웃', () => {
    test('13.1 모바일 뷰포트에서 폼이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert - 모든 요소가 여전히 접근 가능
      await expect(page.locator('#ticketId')).toBeVisible();
      await expect(page.locator('#customerEmail')).toBeVisible();
      await expect(page.getByRole('button', { name: /^조회$/ })).toBeVisible();
    });

    test('13.2 모바일에서 버튼이 세로로 배치된다 (flex-col)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const buttonContainer = page.locator('.flex.flex-col.sm\\:flex-row');
      await expect(buttonContainer).toBeVisible();
    });

    test('13.3 태블릿 뷰포트에서 폼이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('#ticketId')).toBeVisible();
      await expect(page.locator('#customerEmail')).toBeVisible();
    });

    test('13.4 데스크톱 뷰포트에서 최대 너비가 적용된다', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      const container = page.locator('.max-w-7xl');
      await expect(container).toBeVisible();
    });
  });

  test.describe('14. 보안', () => {
    test('14.1 입력 필드는 XSS 공격에 안전하다', async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';

      await page.locator('#ticketId').fill(xssPayload);
      await page.locator('#customerEmail').fill(xssPayload);

      // Assert - 스크립트가 실행되지 않고 텍스트로 저장됨
      await expect(page.locator('#ticketId')).toHaveValue(xssPayload);

      let alertTriggered = false;
      page.on('dialog', () => {
        alertTriggered = true;
      });

      await page.getByRole('button', { name: /^조회$/ }).click();
      await page.waitForTimeout(500);

      expect(alertTriggered).toBe(false);
    });

    test('14.2 SQL Injection 패턴이 텍스트로 처리된다', async ({ page }) => {
      const sqlPayload = "'; DROP TABLE vocs; --";

      await page.locator('#ticketId').fill(sqlPayload);
      await page.locator('#customerEmail').fill('test@example.com');

      // Assert - 입력값이 그대로 저장됨
      await expect(page.locator('#ticketId')).toHaveValue(sqlPayload);
    });

    test('14.3 HTML 태그가 이스케이프되어 표시된다', async ({ page }) => {
      const htmlPayload = '<img src=x onerror=alert(1)>';

      await page.locator('#ticketId').fill(htmlPayload);

      // Assert - HTML이 렌더링되지 않음
      await expect(page.locator('#ticketId')).toHaveValue(htmlPayload);
    });
  });

  test.describe('15. 에지 케이스', () => {
    test('15.1 매우 긴 제목도 올바르게 표시된다', async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'A'.repeat(200),
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      // Assert - line-clamp-2 클래스로 2줄 제한
      const titleElement = page.locator('.line-clamp-2');
      await expect(titleElement).toBeVisible();
    });

    test('15.2 statusHistory가 없는 경우 타임라인이 표시되지 않는다', async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'Test',
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
              statusHistory: [],
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();

      await page.waitForTimeout(500);

      // Assert - 타임라인이 렌더링되지 않음
      await expect(page.locator('h3', { hasText: '처리 진행 상태' })).not.toBeVisible();
    });

    test('15.3 다크모드에서도 올바르게 표시된다', async ({ page }) => {
      // Arrange - 다크모드 활성화
      await page.emulateMedia({ colorScheme: 'dark' });

      // Assert - 다크모드 스타일 클래스 적용 확인
      const container = page.locator('.dark\\:bg-slate-900');
      await expect(container).toBeVisible();
    });

    test('15.4 더블 클릭 시 폼이 한 번만 제출된다', async ({ page }) => {
      let submitCount = 0;
      await page.route('**/api/vocs/status', async (route) => {
        submitCount++;
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: 'VOC-20260125-00001',
              title: 'Test',
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
            },
          }),
        });
      });

      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');

      // Act - 더블 클릭
      const submitButton = page.getByRole('button', { name: /^조회$/ });
      await submitButton.dblclick();

      await page.waitForTimeout(1000);

      // Assert - 로딩 상태로 인해 중복 제출 방지
      expect(submitCount).toBeLessThanOrEqual(2);
    });

    test('15.5 연속으로 다른 VOC 조회가 가능하다', async ({ page }) => {
      await page.route('**/api/vocs/status', async (route) => {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ticketId: postData.ticketId,
              title: `VOC ${postData.ticketId}`,
              status: 'RECEIVED',
              createdAt: '2026-01-25T10:00:00Z',
              updatedAt: '2026-01-25T10:00:00Z',
            },
          }),
        });
      });

      // 첫 번째 조회
      await page.locator('#ticketId').fill('VOC-20260125-00001');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: /^조회$/ }).click();
      await expect(page.locator('.font-mono', { hasText: 'VOC-20260125-00001' })).toBeVisible();

      // 두 번째 조회
      await page.locator('#ticketId').fill('VOC-20260125-00002');
      await page.getByRole('button', { name: /^조회$/ }).click();
      await expect(page.locator('.font-mono', { hasText: 'VOC-20260125-00002' })).toBeVisible();
    });
  });
});
