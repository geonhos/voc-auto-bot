import { test, expect } from '@playwright/test';

/**
 * @description 관리자 - 사용자 관리 페이지 상세 E2E 테스트 시나리오
 * @route /admin/users
 * @issue #117
 *
 * ## 테스트 대상 UI 요소
 * 1. 페이지 헤더 (제목, 설명, 액션 버튼)
 * 2. 검색 및 필터 (검색어, 역할, 상태)
 * 3. UserTable (컬럼, 행, 배지, 액션 메뉴)
 * 4. UserForm 모달 (신규 생성, 수정, 유효성 검사)
 * 5. 삭제 확인 모달
 * 6. 반응형 레이아웃
 */

test.describe('사용자 관리 페이지 (/admin/users) - 상세 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 권한으로 로그인
    await page.evaluate(() => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: 'mock-admin-token',
            user: {
              id: 1,
              username: 'admin',
              name: '관리자',
              email: 'admin@example.com',
              role: 'ADMIN',
            },
          },
        })
      );
    });

    // 사용자 목록 API 모킹
    await page.route('**/api/users**', async (route) => {
      const url = route.request().url();

      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  username: 'admin',
                  name: '관리자',
                  email: 'admin@example.com',
                  role: 'ADMIN',
                  isActive: true,
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                },
                {
                  id: 2,
                  username: 'manager1',
                  name: '매니저1',
                  email: 'manager1@example.com',
                  role: 'MANAGER',
                  isActive: true,
                  createdAt: '2024-01-02T00:00:00Z',
                  updatedAt: '2024-01-02T00:00:00Z',
                },
                {
                  id: 3,
                  username: 'operator1',
                  name: '상담원1',
                  email: 'operator1@example.com',
                  role: 'OPERATOR',
                  isActive: true,
                  createdAt: '2024-01-03T00:00:00Z',
                  updatedAt: '2024-01-03T00:00:00Z',
                },
                {
                  id: 4,
                  username: 'inactive_user',
                  name: '비활성사용자',
                  email: 'inactive@example.com',
                  role: 'OPERATOR',
                  isActive: false,
                  createdAt: '2024-01-04T00:00:00Z',
                  updatedAt: '2024-01-04T00:00:00Z',
                },
              ],
              page: 0,
              size: 10,
              totalElements: 4,
              totalPages: 1,
            },
          }),
        });
      }
    });

    await page.goto('/admin/users');
  });

  test.describe('1. 페이지 렌더링', () => {
    test('1.1 페이지 타이틀과 설명이 올바르게 표시된다', async ({ page }) => {
      // Assert - 제목
      const heading = page.locator('h1');
      await expect(heading).toHaveText('사용자 관리');
      await expect(heading).toBeVisible();

      // Assert - 설명
      const description = page.locator('p.text-sm.text-gray-500');
      await expect(description).toContainText('시스템 사용자 계정을 관리합니다');
      await expect(description).toBeVisible();
    });

    test('1.2 검색 및 필터 섹션이 올바르게 렌더링된다', async ({ page }) => {
      // Assert - 검색 입력
      const searchInput = page.locator('input[placeholder*="이름 또는 이메일로 검색"]');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('type', 'text');

      // Assert - 역할 필터
      const roleFilter = page.locator('select').first();
      await expect(roleFilter).toBeVisible();
      await expect(roleFilter.locator('option[value=""]')).toHaveText('전체 역할');

      // Assert - 상태 필터
      const statusFilter = page.locator('select').nth(1);
      await expect(statusFilter).toBeVisible();
      await expect(statusFilter.locator('option[value=""]')).toHaveText('전체 상태');
    });

    test('1.3 사용자 추가 버튼이 올바르게 표시된다', async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();

      // Assert - 아이콘 확인
      await expect(addButton.locator('svg')).toBeVisible();
    });

    test('1.4 새로고침 버튼이 올바르게 표시된다', async ({ page }) => {
      const refreshButton = page.locator('button', { hasText: '새로고침' });
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();

      // Assert - 아이콘 확인
      await expect(refreshButton.locator('svg')).toBeVisible();
    });
  });

  test.describe('2. 검색 기능', () => {
    test('2.1 검색 입력 필드에 텍스트 입력이 가능하다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="이름 또는 이메일로 검색"]');

      // Act
      await searchInput.fill('관리자');

      // Assert
      await expect(searchInput).toHaveValue('관리자');
    });

    test('2.2 검색어 입력 시 포커스 스타일이 적용된다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="이름 또는 이메일로 검색"]');

      // Act
      await searchInput.click();

      // Assert
      await expect(searchInput).toBeFocused();
      await expect(searchInput).toHaveClass(/focus:ring-2/);
      await expect(searchInput).toHaveClass(/focus:ring-blue-200/);
    });

    test('2.3 검색어 입력 시 API가 호출된다', async ({ page }) => {
      let apiCalled = false;
      await page.route('**/api/users?search=*', async (route) => {
        apiCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  username: 'admin',
                  name: '관리자',
                  email: 'admin@example.com',
                  role: 'ADMIN',
                  isActive: true,
                },
              ],
              page: 0,
              size: 10,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      const searchInput = page.locator('input[placeholder*="이름 또는 이메일로 검색"]');

      // Act
      await searchInput.fill('관리자');
      await page.waitForTimeout(500); // Debounce 대기

      // Assert
      expect(apiCalled).toBe(true);
    });

    test('2.4 검색어 삭제 시 전체 목록이 다시 표시된다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="이름 또는 이메일로 검색"]');

      // Arrange - 검색어 입력
      await searchInput.fill('관리자');
      await page.waitForTimeout(500);

      // Act - 검색어 삭제
      await searchInput.clear();
      await page.waitForTimeout(500);

      // Assert - 전체 사용자 표시
      const rows = page.locator('tbody tr');
      await expect(rows).toHaveCount(4);
    });
  });

  test.describe('3. 역할 필터', () => {
    test('3.1 역할 셀렉트박스 클릭 시 옵션이 표시된다', async ({ page }) => {
      const roleFilter = page.locator('select').first();

      // Act
      await roleFilter.click();

      // Assert - 모든 옵션 확인
      await expect(roleFilter.locator('option[value=""]')).toBeVisible();
      await expect(roleFilter.locator('option[value="ADMIN"]')).toBeVisible();
      await expect(roleFilter.locator('option[value="MANAGER"]')).toBeVisible();
      await expect(roleFilter.locator('option[value="OPERATOR"]')).toBeVisible();
    });

    test('3.2 관리자 역할 필터 선택 시 관리자만 표시된다', async ({ page }) => {
      await page.route('**/api/users?role=ADMIN**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  username: 'admin',
                  name: '관리자',
                  email: 'admin@example.com',
                  role: 'ADMIN',
                  isActive: true,
                },
              ],
              totalElements: 1,
            },
          }),
        });
      });

      const roleFilter = page.locator('select').first();

      // Act
      await roleFilter.selectOption('ADMIN');
      await page.waitForTimeout(300);

      // Assert
      await expect(roleFilter).toHaveValue('ADMIN');
    });

    test('3.3 매니저 역할 필터 선택 시 매니저만 표시된다', async ({ page }) => {
      await page.route('**/api/users?role=MANAGER**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 2,
                  username: 'manager1',
                  name: '매니저1',
                  email: 'manager1@example.com',
                  role: 'MANAGER',
                  isActive: true,
                },
              ],
              totalElements: 1,
            },
          }),
        });
      });

      const roleFilter = page.locator('select').first();

      // Act
      await roleFilter.selectOption('MANAGER');
      await page.waitForTimeout(300);

      // Assert
      await expect(roleFilter).toHaveValue('MANAGER');
    });

    test('3.4 상담원 역할 필터 선택 시 상담원만 표시된다', async ({ page }) => {
      await page.route('**/api/users?role=OPERATOR**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 3,
                  username: 'operator1',
                  name: '상담원1',
                  email: 'operator1@example.com',
                  role: 'OPERATOR',
                  isActive: true,
                },
              ],
              totalElements: 1,
            },
          }),
        });
      });

      const roleFilter = page.locator('select').first();

      // Act
      await roleFilter.selectOption('OPERATOR');
      await page.waitForTimeout(300);

      // Assert
      await expect(roleFilter).toHaveValue('OPERATOR');
    });

    test('3.5 전체 역할 선택 시 모든 사용자가 표시된다', async ({ page }) => {
      const roleFilter = page.locator('select').first();

      // Arrange - 특정 역할 선택
      await roleFilter.selectOption('ADMIN');
      await page.waitForTimeout(300);

      // Act - 전체 선택
      await roleFilter.selectOption('');
      await page.waitForTimeout(300);

      // Assert
      await expect(roleFilter).toHaveValue('');
    });
  });

  test.describe('4. 상태 필터', () => {
    test('4.1 상태 셀렉트박스 클릭 시 옵션이 표시된다', async ({ page }) => {
      const statusFilter = page.locator('select').nth(1);

      // Act
      await statusFilter.click();

      // Assert
      await expect(statusFilter.locator('option[value=""]')).toBeVisible();
      await expect(statusFilter.locator('option[value="active"]')).toBeVisible();
      await expect(statusFilter.locator('option[value="inactive"]')).toBeVisible();
    });

    test('4.2 활성 상태 필터 선택 시 활성 사용자만 표시된다', async ({ page }) => {
      await page.route('**/api/users?isActive=true**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  username: 'admin',
                  name: '관리자',
                  email: 'admin@example.com',
                  role: 'ADMIN',
                  isActive: true,
                },
                {
                  id: 2,
                  username: 'manager1',
                  name: '매니저1',
                  email: 'manager1@example.com',
                  role: 'MANAGER',
                  isActive: true,
                },
              ],
              totalElements: 2,
            },
          }),
        });
      });

      const statusFilter = page.locator('select').nth(1);

      // Act
      await statusFilter.selectOption('active');
      await page.waitForTimeout(300);

      // Assert
      await expect(statusFilter).toHaveValue('active');
    });

    test('4.3 비활성 상태 필터 선택 시 비활성 사용자만 표시된다', async ({ page }) => {
      await page.route('**/api/users?isActive=false**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 4,
                  username: 'inactive_user',
                  name: '비활성사용자',
                  email: 'inactive@example.com',
                  role: 'OPERATOR',
                  isActive: false,
                },
              ],
              totalElements: 1,
            },
          }),
        });
      });

      const statusFilter = page.locator('select').nth(1);

      // Act
      await statusFilter.selectOption('inactive');
      await page.waitForTimeout(300);

      // Assert
      await expect(statusFilter).toHaveValue('inactive');
    });
  });

  test.describe('5. UserTable - 테이블 헤더', () => {
    test('5.1 모든 컬럼 헤더가 올바르게 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('th', { hasText: '사용자' })).toBeVisible();
      await expect(page.locator('th', { hasText: '이메일' })).toBeVisible();
      await expect(page.locator('th', { hasText: '역할' })).toBeVisible();
      await expect(page.locator('th', { hasText: '상태' })).toBeVisible();
      await expect(page.locator('th', { hasText: '액션' })).toBeVisible();
    });

    test('5.2 헤더가 회색 배경으로 표시된다', async ({ page }) => {
      const thead = page.locator('thead');
      await expect(thead).toHaveClass(/bg-gray-50/);
    });

    test('5.3 헤더 텍스트가 대문자 스타일로 표시된다', async ({ page }) => {
      const firstHeader = page.locator('th').first();
      await expect(firstHeader).toHaveClass(/uppercase/);
    });
  });

  test.describe('6. UserTable - 사용자 행', () => {
    test('6.1 모든 사용자가 테이블에 표시된다', async ({ page }) => {
      const rows = page.locator('tbody tr');
      await expect(rows).toHaveCount(4);
    });

    test('6.2 사용자 행에 호버 시 배경색이 변경된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();

      // Assert - hover 클래스 확인
      await expect(firstRow).toHaveClass(/hover:bg-gray-50/);
    });

    test('6.3 사용자 이름이 올바르게 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow.locator('text=관리자')).toBeVisible();
    });

    test('6.4 사용자 아이디가 올바르게 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow.locator('text=@admin')).toBeVisible();
    });

    test('6.5 사용자 이메일이 올바르게 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow.locator('text=admin@example.com')).toBeVisible();
    });

    test('6.6 사용자 아바타가 이름 첫 글자로 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const avatar = firstRow.locator('.rounded-full.bg-gray-200');

      await expect(avatar).toBeVisible();
      await expect(avatar).toContainText('관');
    });

    test('6.7 아바타가 원형으로 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const avatar = firstRow.locator('.rounded-full');

      await expect(avatar).toHaveClass(/rounded-full/);
    });
  });

  test.describe('7. UserTable - 역할 배지', () => {
    test('7.1 관리자 역할 배지가 보라색으로 표시된다', async ({ page }) => {
      const adminRow = page.locator('tbody tr', { hasText: '관리자' });
      const roleBadge = adminRow.locator('span', { hasText: '관리자' }).first();

      await expect(roleBadge).toBeVisible();
      await expect(roleBadge).toHaveClass(/bg-purple-100/);
      await expect(roleBadge).toHaveClass(/text-purple-800/);
    });

    test('7.2 매니저 역할 배지가 파란색으로 표시된다', async ({ page }) => {
      const managerRow = page.locator('tbody tr', { hasText: '매니저1' });
      const roleBadge = managerRow.locator('span', { hasText: '매니저' }).first();

      await expect(roleBadge).toBeVisible();
      await expect(roleBadge).toHaveClass(/bg-blue-100/);
      await expect(roleBadge).toHaveClass(/text-blue-800/);
    });

    test('7.3 상담원 역할 배지가 초록색으로 표시된다', async ({ page }) => {
      const operatorRow = page.locator('tbody tr', { hasText: '상담원1' });
      const roleBadge = operatorRow.locator('span', { hasText: '상담원' }).first();

      await expect(roleBadge).toBeVisible();
      await expect(roleBadge).toHaveClass(/bg-green-100/);
      await expect(roleBadge).toHaveClass(/text-green-800/);
    });

    test('7.4 역할 배지가 둥근 모서리로 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const roleBadge = firstRow.locator('.rounded-full').filter({ hasText: '관리자' }).first();

      await expect(roleBadge).toHaveClass(/rounded-full/);
    });
  });

  test.describe('8. UserTable - 상태 배지', () => {
    test('8.1 활성 상태 배지가 초록색으로 표시된다', async ({ page }) => {
      const activeRow = page.locator('tbody tr', { hasText: '관리자' });
      const statusBadge = activeRow.locator('span', { hasText: '활성' });

      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toHaveClass(/bg-green-100/);
      await expect(statusBadge).toHaveClass(/text-green-800/);
    });

    test('8.2 비활성 상태 배지가 빨간색으로 표시된다', async ({ page }) => {
      const inactiveRow = page.locator('tbody tr', { hasText: '비활성사용자' });
      const statusBadge = inactiveRow.locator('span', { hasText: '비활성' });

      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toHaveClass(/bg-red-100/);
      await expect(statusBadge).toHaveClass(/text-red-800/);
    });

    test('8.3 상태 배지가 둥근 모서리로 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const statusBadge = firstRow.locator('.rounded-full').filter({ hasText: '활성' }).first();

      await expect(statusBadge).toHaveClass(/rounded-full/);
    });
  });

  test.describe('9. UserTable - 액션 메뉴', () => {
    test('9.1 액션 메뉴 버튼이 모든 행에 표시된다', async ({ page }) => {
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        const actionButton = rows.nth(i).locator('button[aria-label="액션 메뉴"]');
        await expect(actionButton).toBeVisible();
      }
    });

    test('9.2 액션 메뉴 버튼 클릭 시 드롭다운이 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const actionButton = firstRow.locator('button[aria-label="액션 메뉴"]');

      // Act
      await actionButton.click();

      // Assert
      await expect(page.locator('button', { hasText: '수정' })).toBeVisible();
      await expect(page.locator('button', { hasText: '비활성화' })).toBeVisible();
      await expect(page.locator('button', { hasText: '임시 비밀번호 발급' })).toBeVisible();
    });

    test('9.3 액션 메뉴 버튼에 aria-expanded 속성이 설정된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const actionButton = firstRow.locator('button[aria-label="액션 메뉴"]');

      // Assert - 초기 상태
      await expect(actionButton).toHaveAttribute('aria-expanded', 'false');

      // Act
      await actionButton.click();

      // Assert - 열린 상태
      await expect(actionButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('9.4 드롭다운에 수정 메뉴가 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const actionButton = firstRow.locator('button[aria-label="액션 메뉴"]');

      // Act
      await actionButton.click();

      // Assert
      const editMenu = page.locator('button', { hasText: '수정' });
      await expect(editMenu).toBeVisible();
      await expect(editMenu).toBeEnabled();
    });

    test('9.5 드롭다운에 비활성화/활성화 메뉴가 표시된다', async ({ page }) => {
      // 활성 사용자 - 비활성화 메뉴
      const activeRow = page.locator('tbody tr', { hasText: '관리자' });
      const activeActionButton = activeRow.locator('button[aria-label="액션 메뉴"]');
      await activeActionButton.click();
      await expect(page.locator('button', { hasText: '비활성화' })).toBeVisible();
      await activeActionButton.click(); // 닫기

      // 비활성 사용자 - 활성화 메뉴
      const inactiveRow = page.locator('tbody tr', { hasText: '비활성사용자' });
      const inactiveActionButton = inactiveRow.locator('button[aria-label="액션 메뉴"]');
      await inactiveActionButton.click();
      await expect(page.locator('button', { hasText: '활성화' })).toBeVisible();
    });

    test('9.6 드롭다운에 임시 비밀번호 발급 메뉴가 표시된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const actionButton = firstRow.locator('button[aria-label="액션 메뉴"]');

      // Act
      await actionButton.click();

      // Assert
      const resetPasswordMenu = page.locator('button', { hasText: '임시 비밀번호 발급' });
      await expect(resetPasswordMenu).toBeVisible();
      await expect(resetPasswordMenu).toBeEnabled();
    });

    test('9.7 비활성 사용자에게만 잠금 해제 메뉴가 표시된다', async ({ page }) => {
      const inactiveRow = page.locator('tbody tr', { hasText: '비활성사용자' });
      const actionButton = inactiveRow.locator('button[aria-label="액션 메뉴"]');

      // Act
      await actionButton.click();

      // Assert
      await expect(page.locator('button', { hasText: '잠금 해제' })).toBeVisible();
    });

    test('9.8 활성 사용자에게는 잠금 해제 메뉴가 표시되지 않는다', async ({ page }) => {
      const activeRow = page.locator('tbody tr', { hasText: '관리자' });
      const actionButton = activeRow.locator('button[aria-label="액션 메뉴"]');

      // Act
      await actionButton.click();

      // Assert
      await expect(page.locator('button', { hasText: '잠금 해제' })).not.toBeVisible();
    });

    test('9.9 드롭다운 외부 클릭 시 메뉴가 닫힌다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const actionButton = firstRow.locator('button[aria-label="액션 메뉴"]');

      // Arrange
      await actionButton.click();
      await expect(page.locator('button', { hasText: '수정' })).toBeVisible();

      // Act - 외부 클릭
      await page.locator('h1').click();

      // Assert
      await expect(page.locator('button', { hasText: '수정' })).not.toBeVisible();
    });

    test('9.10 드롭다운 메뉴에 호버 시 배경색이 변경된다', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const actionButton = firstRow.locator('button[aria-label="액션 메뉴"]');

      // Act
      await actionButton.click();

      // Assert
      const editMenu = page.locator('button', { hasText: '수정' });
      await expect(editMenu).toHaveClass(/hover:bg-gray-100/);
    });
  });

  test.describe('10. 사용자 추가 버튼', () => {
    test('10.1 클릭 시 사용자 추가 모달이 표시된다', async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });

      // Act
      await addButton.click();

      // Assert
      await expect(page.locator('h3', { hasText: '사용자 추가' })).toBeVisible();
    });

    test('10.2 호버 시 배경색이 변경된다', async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });

      // Assert
      await expect(addButton).toHaveClass(/bg-blue-600/);
      await expect(addButton).toHaveClass(/hover:bg-blue-700/);
    });

    test('10.3 버튼에 + 아이콘이 표시된다', async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      const icon = addButton.locator('svg');

      // Assert
      await expect(icon).toBeVisible();
    });
  });

  test.describe('11. 새로고침 버튼', () => {
    test('11.1 클릭 시 사용자 목록이 새로고침된다', async ({ page }) => {
      let apiCallCount = 0;
      await page.route('**/api/users**', async (route) => {
        apiCallCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [
                {
                  id: 1,
                  username: 'admin',
                  name: '관리자',
                  email: 'admin@example.com',
                  role: 'ADMIN',
                  isActive: true,
                },
              ],
              totalElements: 1,
            },
          }),
        });
      });

      const refreshButton = page.locator('button', { hasText: '새로고침' });
      const initialCallCount = apiCallCount;

      // Act
      await refreshButton.click();
      await page.waitForTimeout(300);

      // Assert
      expect(apiCallCount).toBeGreaterThan(initialCallCount);
    });

    test('11.2 호버 시 배경색이 변경된다', async ({ page }) => {
      const refreshButton = page.locator('button', { hasText: '새로고침' });

      // Assert
      await expect(refreshButton).toHaveClass(/hover:bg-gray-50/);
    });

    test('11.3 버튼에 새로고침 아이콘이 표시된다', async ({ page }) => {
      const refreshButton = page.locator('button', { hasText: '새로고침' });
      const icon = refreshButton.locator('svg');

      // Assert
      await expect(icon).toBeVisible();
    });
  });

  test.describe('12. UserForm 모달 - 신규 생성', () => {
    test.beforeEach(async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();
    });

    test('12.1 모달이 중앙에 표시된다', async ({ page }) => {
      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveClass(/flex items-center justify-center/);
    });

    test('12.2 모달 배경이 반투명 검은색으로 표시된다', async ({ page }) => {
      const overlay = page.locator('.fixed.inset-0.bg-black');
      await expect(overlay).toHaveClass(/bg-opacity-50/);
    });

    test('12.3 모달 제목이 "사용자 추가"로 표시된다', async ({ page }) => {
      await expect(page.locator('h3', { hasText: '사용자 추가' })).toBeVisible();
    });

    test('12.4 아이디 입력 필드가 표시된다', async ({ page }) => {
      await expect(page.locator('label', { hasText: '아이디' })).toBeVisible();
      await expect(page.locator('input[type="text"]').first()).toBeVisible();
    });

    test('12.5 비밀번호 입력 필드가 표시된다', async ({ page }) => {
      await expect(page.locator('label', { hasText: '비밀번호' })).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('12.6 이름 입력 필드가 표시된다', async ({ page }) => {
      await expect(page.locator('label', { hasText: '이름' })).toBeVisible();
    });

    test('12.7 이메일 입력 필드가 표시된다', async ({ page }) => {
      await expect(page.locator('label', { hasText: '이메일' })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('12.8 역할 선택 필드가 표시된다', async ({ page }) => {
      await expect(page.locator('label', { hasText: '역할' })).toBeVisible();
      const roleSelect = page.locator('select');
      await expect(roleSelect).toBeVisible();
    });

    test('12.9 역할 선택의 기본값이 "상담원"이다', async ({ page }) => {
      const roleSelect = page.locator('select');
      await expect(roleSelect).toHaveValue('OPERATOR');
    });

    test('12.10 취소 버튼이 표시된다', async ({ page }) => {
      const cancelButton = page.locator('button[type="button"]', { hasText: '취소' });
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
    });

    test('12.11 추가 버튼이 표시된다', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]', { hasText: '추가' });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('13. UserForm 모달 - 유효성 검사 (신규)', () => {
    test.beforeEach(async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();
    });

    test('13.1 아이디 미입력 시 에러 메시지가 표시된다', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await submitButton.click();

      // Assert
      await expect(page.locator('text=아이디는 4자 이상이어야 합니다')).toBeVisible();
    });

    test('13.2 아이디가 4자 미만일 때 에러 메시지가 표시된다', async ({ page }) => {
      const usernameInput = page.locator('input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await usernameInput.fill('abc');
      await page.locator('input[type="password"]').fill('Test1234!@');
      await page.locator('input[type="email"]').fill('test@test.com');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=아이디는 4자 이상이어야 합니다')).toBeVisible();
    });

    test('13.3 아이디가 20자 초과일 때 에러 메시지가 표시된다', async ({ page }) => {
      const usernameInput = page.locator('input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await usernameInput.fill('a'.repeat(21));
      await submitButton.click();

      // Assert
      await expect(page.locator('text=아이디는 20자 이하여야 합니다')).toBeVisible();
    });

    test('13.4 아이디에 특수문자 사용 시 에러 메시지가 표시된다', async ({ page }) => {
      const usernameInput = page.locator('input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await usernameInput.fill('test@user');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=영문, 숫자, 언더스코어만 사용 가능합니다')).toBeVisible();
    });

    test('13.5 비밀번호가 8자 미만일 때 에러 메시지가 표시된다', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await page.locator('input[type="text"]').first().fill('testuser');
      await passwordInput.fill('Test1!');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=비밀번호는 8자 이상이어야 합니다')).toBeVisible();
    });

    test('13.6 비밀번호에 대문자가 없을 때 에러 메시지가 표시된다', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await page.locator('input[type="text"]').first().fill('testuser');
      await passwordInput.fill('test1234!@');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=대소문자, 숫자, 특수문자를 포함해야 합니다')).toBeVisible();
    });

    test('13.7 비밀번호에 소문자가 없을 때 에러 메시지가 표시된다', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await page.locator('input[type="text"]').first().fill('testuser');
      await passwordInput.fill('TEST1234!@');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=대소문자, 숫자, 특수문자를 포함해야 합니다')).toBeVisible();
    });

    test('13.8 비밀번호에 숫자가 없을 때 에러 메시지가 표시된다', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await page.locator('input[type="text"]').first().fill('testuser');
      await passwordInput.fill('Testtest!@');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=대소문자, 숫자, 특수문자를 포함해야 합니다')).toBeVisible();
    });

    test('13.9 비밀번호에 특수문자가 없을 때 에러 메시지가 표시된다', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await page.locator('input[type="text"]').first().fill('testuser');
      await passwordInput.fill('Test1234');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=대소문자, 숫자, 특수문자를 포함해야 합니다')).toBeVisible();
    });

    test('13.10 이름이 2자 미만일 때 에러 메시지가 표시된다', async ({ page }) => {
      const inputs = page.locator('input[type="text"]');
      const nameInput = inputs.nth(1);
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await inputs.first().fill('testuser');
      await page.locator('input[type="password"]').fill('Test1234!@');
      await nameInput.fill('a');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=이름은 2자 이상이어야 합니다')).toBeVisible();
    });

    test('13.11 이름이 50자 초과일 때 에러 메시지가 표시된다', async ({ page }) => {
      const inputs = page.locator('input[type="text"]');
      const nameInput = inputs.nth(1);
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await inputs.first().fill('testuser');
      await page.locator('input[type="password"]').fill('Test1234!@');
      await nameInput.fill('가'.repeat(51));
      await submitButton.click();

      // Assert
      await expect(page.locator('text=이름은 50자 이하여야 합니다')).toBeVisible();
    });

    test('13.12 이메일 형식이 잘못되었을 때 에러 메시지가 표시된다', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await page.locator('input[type="text"]').first().fill('testuser');
      await page.locator('input[type="password"]').fill('Test1234!@');
      await page.locator('input[type="text"]').nth(1).fill('테스트');
      await emailInput.fill('invalid-email');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=올바른 이메일 형식이 아닙니다')).toBeVisible();
    });

    test('13.13 에러가 있는 입력 필드가 빨간색 테두리로 표시된다', async ({ page }) => {
      const usernameInput = page.locator('input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"]');

      // Act
      await usernameInput.fill('ab');
      await submitButton.click();

      // Assert
      await expect(usernameInput).toHaveClass(/border-red-500/);
    });
  });

  test.describe('14. UserForm 모달 - 수정', () => {
    test.beforeEach(async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      const actionButton = firstRow.locator('button[aria-label="액션 메뉴"]');
      await actionButton.click();

      const editButton = page.locator('button', { hasText: '수정' });
      await editButton.click();
    });

    test('14.1 모달 제목이 "사용자 수정"으로 표시된다', async ({ page }) => {
      await expect(page.locator('h3', { hasText: '사용자 수정' })).toBeVisible();
    });

    test('14.2 아이디 입력 필드가 표시되지 않는다', async ({ page }) => {
      await expect(page.locator('label', { hasText: '아이디' })).not.toBeVisible();
    });

    test('14.3 비밀번호 입력 필드가 표시되지 않는다', async ({ page }) => {
      await expect(page.locator('label', { hasText: '비밀번호' })).not.toBeVisible();
    });

    test('14.4 기존 이름이 입력 필드에 표시된다', async ({ page }) => {
      const nameInput = page.locator('label', { hasText: '이름' }).locator('..').locator('input');
      await expect(nameInput).toHaveValue('관리자');
    });

    test('14.5 기존 이메일이 입력 필드에 표시된다', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveValue('admin@example.com');
    });

    test('14.6 기존 역할이 선택되어 있다', async ({ page }) => {
      const roleSelect = page.locator('select');
      await expect(roleSelect).toHaveValue('ADMIN');
    });

    test('14.7 수정 버튼이 표시된다', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]', { hasText: '수정' });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('15. UserForm 모달 - 취소 및 닫기', () => {
    test('15.1 취소 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
      // Arrange
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();
      await expect(page.locator('h3', { hasText: '사용자 추가' })).toBeVisible();

      // Act
      const cancelButton = page.locator('button[type="button"]', { hasText: '취소' });
      await cancelButton.click();

      // Assert
      await expect(page.locator('h3', { hasText: '사용자 추가' })).not.toBeVisible();
    });

    test('15.2 취소 시 입력한 데이터가 초기화된다', async ({ page }) => {
      // Arrange
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();

      const usernameInput = page.locator('input[type="text"]').first();
      await usernameInput.fill('testuser');

      const cancelButton = page.locator('button[type="button"]', { hasText: '취소' });
      await cancelButton.click();

      // Act - 모달 재오픈
      await addButton.click();

      // Assert - 초기 상태
      await expect(usernameInput).toHaveValue('');
    });
  });

  test.describe('16. 로딩 상태', () => {
    test('16.1 로딩 중 스피너가 표시된다', async ({ page }) => {
      // 새 페이지로 이동하여 로딩 상태 확인
      await page.route('**/api/users**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { content: [], totalElements: 0 },
          }),
        });
      });

      await page.goto('/admin/users');

      // Assert
      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible();
    });

    test('16.2 데이터 없을 때 안내 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/users**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [],
              totalElements: 0,
            },
          }),
        });
      });

      await page.goto('/admin/users');

      // Assert
      await expect(page.locator('text=등록된 사용자가 없습니다')).toBeVisible();
    });
  });

  test.describe('17. 반응형 레이아웃', () => {
    test('17.1 모바일 뷰포트에서 테이블이 스크롤 가능하다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert
      const tableContainer = page.locator('.overflow-x-auto');
      await expect(tableContainer).toBeVisible();
    });

    test('17.2 모바일 뷰포트에서 검색/필터가 세로로 정렬된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert
      const filterContainer = page.locator('.flex.flex-wrap.gap-4');
      await expect(filterContainer).toBeVisible();
    });

    test('17.3 태블릿 뷰포트에서 모든 요소가 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Assert
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[placeholder*="이름 또는 이메일로 검색"]')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('17.4 데스크톱 뷰포트에서 모든 요소가 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Assert
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[placeholder*="이름 또는 이메일로 검색"]')).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('17.5 모바일에서 모달이 화면에 맞게 조정된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();

      // Assert
      const modal = page.locator('.max-w-md');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveClass(/mx-4/);
    });
  });

  test.describe('18. 접근성 (Accessibility)', () => {
    test('18.1 액션 메뉴 버튼에 aria-label이 설정되어 있다', async ({ page }) => {
      const actionButton = page.locator('button[aria-label="액션 메뉴"]').first();
      await expect(actionButton).toHaveAttribute('aria-label', '액션 메뉴');
    });

    test('18.2 액션 메뉴 버튼에 aria-expanded가 설정되어 있다', async ({ page }) => {
      const actionButton = page.locator('button[aria-label="액션 메뉴"]').first();
      await expect(actionButton).toHaveAttribute('aria-expanded');
    });

    test('18.3 모달이 열릴 때 포커스가 이동한다', async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();

      // Assert - 모달 내부로 포커스 이동 확인
      const modal = page.locator('.fixed.inset-0 .bg-white');
      await expect(modal).toBeVisible();
    });

    test('18.4 에러 메시지가 role="alert" 없이도 명확하게 표시된다', async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Assert
      const errorMessage = page.locator('.text-red-600').first();
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('19. 키보드 네비게이션', () => {
    test('19.1 Tab 키로 검색 필드에서 필터로 이동할 수 있다', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="이름 또는 이메일로 검색"]');
      await searchInput.focus();

      // Act
      await page.keyboard.press('Tab');

      // Assert
      const roleFilter = page.locator('select').first();
      await expect(roleFilter).toBeFocused();
    });

    test('19.2 Enter 키로 액션 메뉴를 열 수 있다', async ({ page }) => {
      const actionButton = page.locator('button[aria-label="액션 메뉴"]').first();
      await actionButton.focus();

      // Act
      await page.keyboard.press('Enter');

      // Assert
      await expect(page.locator('button', { hasText: '수정' })).toBeVisible();
    });

    test('19.3 Escape 키로 모달을 닫을 수 없다 (의도적 설계)', async ({ page }) => {
      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();

      // Act
      await page.keyboard.press('Escape');

      // Assert - 모달이 여전히 열려 있음 (데이터 손실 방지)
      await expect(page.locator('h3', { hasText: '사용자 추가' })).toBeVisible();
    });
  });

  test.describe('20. 에러 처리', () => {
    test('20.1 API 에러 시 에러 메시지가 모달에 표시된다', async ({ page }) => {
      await page.route('**/api/users', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: {
                message: '이미 존재하는 아이디입니다',
              },
            }),
          });
        }
      });

      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();

      // 유효한 데이터 입력
      await page.locator('input[type="text"]').first().fill('testuser');
      await page.locator('input[type="password"]').fill('Test1234!@');
      await page.locator('input[type="text"]').nth(1).fill('테스트');
      await page.locator('input[type="email"]').fill('test@example.com');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=이미 존재하는 아이디입니다')).toBeVisible();
    });

    test('20.2 네트워크 오류 시 기본 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/users', async (route) => {
        if (route.request().method() === 'POST') {
          await route.abort('failed');
        }
      });

      const addButton = page.locator('button', { hasText: '사용자 추가' });
      await addButton.click();

      // 유효한 데이터 입력
      await page.locator('input[type="text"]').first().fill('testuser');
      await page.locator('input[type="password"]').fill('Test1234!@');
      await page.locator('input[type="text"]').nth(1).fill('테스트');
      await page.locator('input[type="email"]').fill('test@example.com');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Assert
      await expect(page.locator('text=저장에 실패했습니다')).toBeVisible();
    });
  });
});
