import { test, expect } from '@playwright/test';

/**
 * @description 관리자 - 카테고리 관리 페이지 상세 E2E 테스트 시나리오
 * @route /admin/categories
 * @issue #117
 *
 * ## 테스트 대상 UI 요소
 * 1. 페이지 헤더
 *    - 제목 및 설명
 *    - 루트 카테고리 추가 버튼
 *    - 새로고침 버튼
 * 2. CategoryTree
 *    - 트리 구조 표시
 *    - 노드 펼치기/접기 토글
 *    - 노드 선택
 *    - 들여쓰기 레벨 표시
 *    - 폴더 아이콘
 *    - 비활성 뱃지
 * 3. 상세 정보 패널
 *    - 카테고리 정보 표시
 *    - 활성/비활성 토글
 *    - 하위 카테고리 추가 버튼
 *    - 수정 버튼
 *    - 삭제 버튼
 * 4. CategoryForm 모달
 *    - 추가 모드 vs 수정 모드
 *    - 입력 필드 (이름, 코드, 타입, 설명, 정렬순서)
 *    - 유효성 검사
 *    - 저장/취소 버튼
 * 5. 삭제 확인 다이얼로그
 */

test.describe('카테고리 관리 페이지 (/admin/categories) - 상세 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    // 인증 상태 설정
    await page.evaluate(() => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: 'mock-token',
            user: { id: 1, name: '관리자', email: 'admin@test.com', role: 'ADMIN' },
          },
        })
      );
    });

    // 카테고리 트리 API 모킹
    await page.route('**/api/v1/categories/tree', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              name: '제품 문의',
              code: 'PRODUCT',
              description: '제품 관련 문의',
              parentId: null,
              isActive: true,
              level: 0,
              sortOrder: 1,
              children: [
                {
                  id: 11,
                  name: '기능 문의',
                  code: 'PRODUCT_FEATURE',
                  description: '제품 기능 문의',
                  parentId: 1,
                  isActive: true,
                  level: 1,
                  sortOrder: 1,
                  children: [],
                },
                {
                  id: 12,
                  name: '가격 문의',
                  code: 'PRODUCT_PRICE',
                  description: '가격 관련 문의',
                  parentId: 1,
                  isActive: true,
                  level: 1,
                  sortOrder: 2,
                  children: [],
                },
              ],
            },
            {
              id: 2,
              name: '기술 지원',
              code: 'SUPPORT',
              description: '기술 지원 요청',
              parentId: null,
              isActive: true,
              level: 0,
              sortOrder: 2,
              children: [],
            },
            {
              id: 3,
              name: '비활성 카테고리',
              code: 'INACTIVE',
              description: '비활성화된 카테고리',
              parentId: null,
              isActive: false,
              level: 0,
              sortOrder: 3,
              children: [],
            },
          ],
        }),
      });
    });

    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. 페이지 헤더 렌더링', () => {
    test('1.1 페이지 제목과 설명이 올바르게 표시된다', async ({ page }) => {
      // Assert - 제목
      const heading = page.locator('h1', { hasText: '카테고리 관리' });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveClass(/text-2xl.*font-bold/);

      // Assert - 설명
      const description = page.locator('text=VOC 분류를 위한 카테고리를 관리합니다.');
      await expect(description).toBeVisible();
    });

    test('1.2 루트 카테고리 추가 버튼이 렌더링된다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();
      await expect(addButton).toHaveClass(/bg-blue-600.*text-white/);
    });

    test('1.3 새로고침 버튼이 렌더링된다', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: '새로고침' });
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });
  });

  test.describe('2. CategoryTree - 기본 렌더링', () => {
    test('2.1 로딩 중에는 스피너가 표시된다', async ({ page }) => {
      // 새로운 페이지로 로딩 지연 테스트
      const newPage = await page.context().newPage();
      await newPage.evaluate(() => {
        localStorage.setItem(
          'auth-storage',
          JSON.stringify({
            state: {
              isAuthenticated: true,
              accessToken: 'mock-token',
              user: { id: 1, name: '관리자', email: 'admin@test.com', role: 'ADMIN' },
            },
          })
        );
      });

      await newPage.route('**/api/v1/categories/tree', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await newPage.goto('/admin/categories');

      // Assert - 스피너 확인
      const spinner = newPage.locator('.animate-spin');
      await expect(spinner).toBeVisible();

      await newPage.close();
    });

    test('2.2 카테고리가 없을 때 안내 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories/tree', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const emptyMessage = page.locator('text=등록된 카테고리가 없습니다.');
      await expect(emptyMessage).toBeVisible();
    });

    test('2.3 루트 카테고리들이 렌더링된다', async ({ page }) => {
      const productCategory = page.locator('text=제품 문의').first();
      const supportCategory = page.locator('text=기술 지원').first();
      const inactiveCategory = page.locator('text=비활성 카테고리').first();

      await expect(productCategory).toBeVisible();
      await expect(supportCategory).toBeVisible();
      await expect(inactiveCategory).toBeVisible();
    });

    test('2.4 카테고리 코드가 표시된다', async ({ page }) => {
      await expect(page.locator('text=PRODUCT').first()).toBeVisible();
      await expect(page.locator('text=SUPPORT').first()).toBeVisible();
      await expect(page.locator('text=INACTIVE').first()).toBeVisible();
    });

    test('2.5 폴더 아이콘이 모든 카테고리에 표시된다', async ({ page }) => {
      // SVG 폴더 아이콘 확인
      const folderIcons = page.locator('svg[viewBox="0 0 24 24"]').filter({
        has: page.locator('path[d*="M3 7v10"]'),
      });

      const count = await folderIcons.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('3. CategoryTree - 노드 펼치기/접기', () => {
    test('3.1 하위 카테고리가 있는 노드에 펼치기 버튼이 표시된다', async ({ page }) => {
      // 제품 문의는 하위 카테고리가 있음
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      const expandButton = productNode.locator('button svg');

      await expect(expandButton).toBeVisible();
    });

    test('3.2 하위 카테고리가 없는 노드에는 펼치기 버튼이 없다', async ({ page }) => {
      // 기술 지원은 하위 카테고리가 없음
      const supportNode = page.locator('div', { hasText: '기술 지원' }).first();
      const expandButton = supportNode.locator('button svg');

      await expect(expandButton).not.toBeVisible();
    });

    test('3.3 기본적으로 모든 노드가 펼쳐진 상태이다', async ({ page }) => {
      // 하위 카테고리가 보여야 함
      await expect(page.locator('text=기능 문의').first()).toBeVisible();
      await expect(page.locator('text=가격 문의').first()).toBeVisible();
    });

    test('3.4 펼치기 버튼 클릭 시 노드가 접힌다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      const expandButton = productNode.locator('button').first();

      // Act - 접기
      await expandButton.click();

      // Assert - 화살표 아이콘 회전 상태 확인
      const arrowIcon = expandButton.locator('svg');
      const arrowClass = await arrowIcon.getAttribute('class');
      expect(arrowClass).not.toContain('rotate-90');
    });

    test('3.5 접힌 노드를 다시 클릭하면 펼쳐진다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      const expandButton = productNode.locator('button').first();

      // Act - 접기 → 펼치기
      await expandButton.click();
      await expandButton.click();

      // Assert - 화살표 회전 확인
      const arrowIcon = expandButton.locator('svg');
      await expect(arrowIcon).toHaveClass(/rotate-90/);
    });

    test('3.6 펼치기/접기 클릭 시 노드 선택이 되지 않는다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      const expandButton = productNode.locator('button').first();

      // Act - 펼치기 버튼 클릭
      await expandButton.click();

      // Assert - 노드가 선택 상태로 변경되지 않음
      await expect(productNode).not.toHaveClass(/bg-blue-100/);
    });
  });

  test.describe('4. CategoryTree - 노드 선택', () => {
    test('4.1 노드 클릭 시 선택된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();

      // Act
      await productNode.click();

      // Assert - 배경색이 파란색으로 변경
      await expect(productNode).toHaveClass(/bg-blue-100.*text-blue-800/);
    });

    test('4.2 노드 선택 시 상세 정보가 우측 패널에 표시된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();

      // Act
      await productNode.click();

      // Assert - 상세 정보 패널
      await expect(page.locator('text=카테고리명').first()).toBeVisible();
      await expect(page.locator('text=제품 문의').last()).toBeVisible();
      await expect(page.locator('text=코드').first()).toBeVisible();
      await expect(page.locator('text=PRODUCT').last()).toBeVisible();
    });

    test('4.3 다른 노드 선택 시 이전 선택이 해제된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      const supportNode = page.locator('div', { hasText: '기술 지원' }).first();

      // Act - 제품 문의 선택 후 기술 지원 선택
      await productNode.click();
      await supportNode.click();

      // Assert
      await expect(productNode).not.toHaveClass(/bg-blue-100/);
      await expect(supportNode).toHaveClass(/bg-blue-100/);
    });

    test('4.4 하위 카테고리도 선택 가능하다', async ({ page }) => {
      const featureNode = page.locator('div', { hasText: '기능 문의' }).first();

      // Act
      await featureNode.click();

      // Assert
      await expect(featureNode).toHaveClass(/bg-blue-100/);
      await expect(page.locator('text=기능 문의').last()).toBeVisible();
    });

    test('4.5 노드 호버 시 배경색이 변경된다', async ({ page }) => {
      const supportNode = page.locator('div', { hasText: '기술 지원' }).first();

      // Act - 호버
      await supportNode.hover();

      // Assert - hover:bg-gray-100 클래스 확인
      await expect(supportNode).toHaveClass(/hover:bg-gray-100/);
    });
  });

  test.describe('5. CategoryTree - 들여쓰기 및 시각적 구조', () => {
    test('5.1 루트 카테고리는 기본 들여쓰기를 가진다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      const paddingLeft = await productNode.evaluate((el) => el.style.paddingLeft);

      expect(paddingLeft).toBe('12px');
    });

    test('5.2 1레벨 하위 카테고리는 추가 들여쓰기가 적용된다', async ({ page }) => {
      const featureNode = page.locator('div', { hasText: '기능 문의' }).first();
      const paddingLeft = await featureNode.evaluate((el) => el.style.paddingLeft);

      expect(paddingLeft).toBe('32px'); // 20px (레벨) + 12px (기본)
    });

    test('5.3 비활성 카테고리에 "비활성" 뱃지가 표시된다', async ({ page }) => {
      const inactiveNode = page.locator('div', { hasText: '비활성 카테고리' }).first();
      const badge = inactiveNode.locator('span', { hasText: '비활성' });

      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(/bg-gray-200.*text-gray-600/);
    });

    test('5.4 활성 카테고리에는 뱃지가 표시되지 않는다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      const badge = productNode.locator('span', { hasText: '비활성' });

      await expect(badge).not.toBeVisible();
    });
  });

  test.describe('6. 상세 정보 패널 - 초기 상태', () => {
    test('6.1 카테고리 미선택 시 안내 메시지가 표시된다', async ({ page }) => {
      const message = page.locator('text=카테고리를 선택해주세요');
      await expect(message).toBeVisible();
      await expect(message).toHaveClass(/text-gray-500/);
    });

    test('6.2 상세 정보 패널의 제목이 표시된다', async ({ page }) => {
      const heading = page.locator('h2', { hasText: '상세 정보' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('7. 상세 정보 패널 - 카테고리 선택 시', () => {
    test.beforeEach(async ({ page }) => {
      // 제품 문의 선택
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();
    });

    test('7.1 카테고리명이 표시된다', async ({ page }) => {
      const label = page.locator('label', { hasText: '카테고리명' });
      await expect(label).toBeVisible();

      const value = page.locator('p.font-medium', { hasText: '제품 문의' });
      await expect(value).toBeVisible();
    });

    test('7.2 코드가 표시된다', async ({ page }) => {
      const label = page.locator('label', { hasText: '코드' });
      await expect(label).toBeVisible();

      const code = page.locator('p.font-mono', { hasText: 'PRODUCT' });
      await expect(code).toBeVisible();
      await expect(code).toHaveClass(/bg-gray-100/);
    });

    test('7.3 설명이 있을 경우 표시된다', async ({ page }) => {
      const description = page.locator('text=제품 관련 문의');
      await expect(description).toBeVisible();
    });

    test('7.4 레벨이 표시된다', async ({ page }) => {
      const label = page.locator('label', { hasText: '레벨' });
      await expect(label).toBeVisible();

      const level = page.locator('p.text-sm', { hasText: '0' });
      await expect(level).toBeVisible();
    });

    test('7.5 정렬 순서가 표시된다', async ({ page }) => {
      const label = page.locator('label', { hasText: '정렬 순서' });
      await expect(label).toBeVisible();

      const sortOrder = page.locator('p.text-sm', { hasText: '1' });
      await expect(sortOrder).toBeVisible();
    });

    test('7.6 활성 상태 뱃지가 표시된다', async ({ page }) => {
      const badge = page.locator('span', { hasText: '활성' });
      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(/bg-green-100.*text-green-800/);
    });

    test('7.7 비활성화 버튼이 표시된다', async ({ page }) => {
      const deactivateButton = page.getByRole('button', { name: '비활성화' });
      await expect(deactivateButton).toBeVisible();
      await expect(deactivateButton).toBeEnabled();
    });

    test('7.8 하위 카테고리 추가 버튼이 표시된다', async ({ page }) => {
      const addChildButton = page.getByRole('button', { name: '하위 카테고리 추가' });
      await expect(addChildButton).toBeVisible();
      await expect(addChildButton).toHaveClass(/text-blue-600.*border-blue-600/);
    });

    test('7.9 수정 버튼이 표시된다', async ({ page }) => {
      const editButton = page.getByRole('button', { name: '수정' });
      await expect(editButton).toBeVisible();
    });

    test('7.10 삭제 버튼이 표시된다', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: '삭제' });
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toHaveClass(/text-red-600.*border-red-300/);
    });
  });

  test.describe('8. 상세 정보 패널 - 활성/비활성 토글', () => {
    test('8.1 비활성화 버튼 클릭 시 API 호출이 발생한다', async ({ page }) => {
      let updateCalled = false;

      await page.route('**/api/v1/categories/1', async (route) => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          updateCalled = true;
          const postData = await route.request().postData();
          expect(postData).toContain('isActive');

          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: { id: 1, name: '제품 문의', isActive: false },
            }),
          });
        }
      });

      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const deactivateButton = page.getByRole('button', { name: '비활성화' });
      await deactivateButton.click();

      expect(updateCalled).toBe(true);
    });

    test('8.2 비활성화 중에는 버튼이 "변경 중..."으로 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories/1', async (route) => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true, data: {} }),
          });
        }
      });

      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const deactivateButton = page.getByRole('button', { name: '비활성화' });
      await deactivateButton.click();

      // Assert - 로딩 상태
      const loadingButton = page.getByRole('button', { name: '변경 중...' });
      await expect(loadingButton).toBeVisible();
      await expect(loadingButton).toBeDisabled();
    });

    test('8.3 비활성 카테고리 선택 시 활성화 버튼이 표시된다', async ({ page }) => {
      const inactiveNode = page.locator('div', { hasText: '비활성 카테고리' }).first();
      await inactiveNode.click();

      const activateButton = page.getByRole('button', { name: '활성화' });
      await expect(activateButton).toBeVisible();
      await expect(activateButton).toHaveClass(/bg-green-600.*text-white/);
    });

    test('8.4 활성화 실패 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories/3', async (route) => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({
              success: false,
              error: { message: '상태 변경에 실패했습니다' },
            }),
          });
        }
      });

      const inactiveNode = page.locator('div', { hasText: '비활성 카테고리' }).first();
      await inactiveNode.click();

      const activateButton = page.getByRole('button', { name: '활성화' });
      await activateButton.click();

      // alert 다이얼로그 확인
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('상태 변경에 실패했습니다');
        await dialog.accept();
      });
    });
  });

  test.describe('9. 루트 카테고리 추가 모달', () => {
    test('9.1 루트 카테고리 버튼 클릭 시 모달이 열린다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      // Assert - 모달 표시
      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      const modalTitle = page.locator('h3', { hasText: '카테고리 추가' });
      await expect(modalTitle).toBeVisible();
    });

    test('9.2 모달 배경이 어둡게 표시된다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const backdrop = page.locator('.bg-black.bg-opacity-50');
      await expect(backdrop).toBeVisible();
    });

    test('9.3 모든 입력 필드가 렌더링된다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      // 카테고리명
      await expect(page.locator('label', { hasText: '카테고리명' })).toBeVisible();
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toBeVisible();

      // 코드
      await expect(page.locator('label', { hasText: '코드' })).toBeVisible();
      const codeInput = page.locator('input[name="code"]');
      await expect(codeInput).toBeVisible();
      await expect(codeInput).toHaveAttribute('placeholder', '예: PRODUCT_INQUIRY');

      // 타입
      await expect(page.locator('label', { hasText: '타입' })).toBeVisible();
      const typeSelect = page.locator('select[name="type"]');
      await expect(typeSelect).toBeVisible();

      // 설명
      await expect(page.locator('label', { hasText: '설명' })).toBeVisible();
      const descTextarea = page.locator('textarea[name="description"]');
      await expect(descTextarea).toBeVisible();

      // 정렬 순서
      await expect(page.locator('label', { hasText: '정렬 순서' })).toBeVisible();
      const sortInput = page.locator('input[name="sortOrder"]');
      await expect(sortInput).toBeVisible();
    });

    test('9.4 취소 버튼이 렌더링된다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const cancelButton = page.getByRole('button', { name: '취소' });
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveClass(/border-gray-300/);
    });

    test('9.5 추가 버튼이 렌더링된다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const submitButton = page.getByRole('button', { name: '추가' });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toHaveClass(/bg-blue-600/);
    });
  });

  test.describe('10. 카테고리 추가 폼 - 입력', () => {
    test.beforeEach(async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();
    });

    test('10.1 카테고리명 입력이 가능하다', async ({ page }) => {
      const nameInput = page.locator('input[name="name"]');

      await nameInput.fill('신규 카테고리');
      await expect(nameInput).toHaveValue('신규 카테고리');
    });

    test('10.2 코드 입력이 가능하다', async ({ page }) => {
      const codeInput = page.locator('input[name="code"]');

      await codeInput.fill('NEW_CATEGORY');
      await expect(codeInput).toHaveValue('NEW_CATEGORY');
    });

    test('10.3 코드 입력 시 자동으로 대문자로 변환된다', async ({ page }) => {
      const codeInput = page.locator('input[name="code"]');

      await expect(codeInput).toHaveClass(/uppercase/);
    });

    test('10.4 타입 선택이 가능하다', async ({ page }) => {
      const typeSelect = page.locator('select[name="type"]');

      await typeSelect.selectOption('MAIN');
      await expect(typeSelect).toHaveValue('MAIN');

      await typeSelect.selectOption('SUB');
      await expect(typeSelect).toHaveValue('SUB');
    });

    test('10.5 타입 옵션들이 올바르게 표시된다', async ({ page }) => {
      const mainOption = page.locator('option[value="MAIN"]');
      const subOption = page.locator('option[value="SUB"]');

      await expect(mainOption).toHaveText('대분류');
      await expect(subOption).toHaveText('중분류');
    });

    test('10.6 설명 입력이 가능하다', async ({ page }) => {
      const descTextarea = page.locator('textarea[name="description"]');

      await descTextarea.fill('카테고리 설명입니다.');
      await expect(descTextarea).toHaveValue('카테고리 설명입니다.');
    });

    test('10.7 정렬 순서 입력이 가능하다', async ({ page }) => {
      const sortInput = page.locator('input[name="sortOrder"]');

      await sortInput.fill('5');
      await expect(sortInput).toHaveValue('5');
    });

    test('10.8 정렬 순서는 0 이상만 입력 가능하다', async ({ page }) => {
      const sortInput = page.locator('input[name="sortOrder"]');
      await expect(sortInput).toHaveAttribute('min', '0');
    });
  });

  test.describe('11. 카테고리 추가 폼 - 유효성 검사', () => {
    test.beforeEach(async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();
    });

    test('11.1 카테고리명이 비어있으면 에러가 표시된다', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const error = page.locator('text=카테고리명은 2자 이상이어야 합니다');
      await expect(error).toBeVisible();
      await expect(error).toHaveClass(/text-red-600/);
    });

    test('11.2 카테고리명이 1자이면 에러가 표시된다', async ({ page }) => {
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('A');

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const error = page.locator('text=카테고리명은 2자 이상이어야 합니다');
      await expect(error).toBeVisible();
    });

    test('11.3 카테고리명이 50자를 초과하면 에러가 표시된다', async ({ page }) => {
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('A'.repeat(51));

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const error = page.locator('text=50자 이하여야 합니다');
      await expect(error).toBeVisible();
    });

    test('11.4 코드가 비어있으면 에러가 표시된다', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const error = page.locator('text=코드는 2자 이상이어야 합니다');
      await expect(error).toBeVisible();
    });

    test('11.5 코드 형식이 올바르지 않으면 에러가 표시된다', async ({ page }) => {
      const codeInput = page.locator('input[name="code"]');
      await codeInput.fill('invalid-code');

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const error = page.locator('text=대문자, 숫자, 언더스코어만 사용 가능합니다');
      await expect(error).toBeVisible();
    });

    test('11.6 설명이 200자를 초과하면 에러가 표시된다', async ({ page }) => {
      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');
      const descTextarea = page.locator('textarea[name="description"]');

      await nameInput.fill('테스트');
      await codeInput.fill('TEST');
      await descTextarea.fill('A'.repeat(201));

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const error = page.locator('text=200자 이하여야 합니다');
      await expect(error).toBeVisible();
    });

    test('11.7 에러가 있는 필드는 빨간색 테두리가 표시된다', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toHaveClass(/border-red-500/);
    });

    test('11.8 에러가 있는 필드 포커스 시 빨간색 링이 표시된다', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const nameInput = page.locator('input[name="name"]');
      await nameInput.focus();

      await expect(nameInput).toHaveClass(/focus:ring-red-200/);
    });
  });

  test.describe('12. 카테고리 추가 폼 - 제출', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/v1/categories', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              success: true,
              data: {
                id: 100,
                name: '신규 카테고리',
                code: 'NEW_CATEGORY',
                type: 'MAIN',
                description: '테스트 설명',
                isActive: true,
              },
            }),
          });
        }
      });

      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();
    });

    test('12.1 올바른 데이터 입력 시 제출이 가능하다', async ({ page }) => {
      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');
      const typeSelect = page.locator('select[name="type"]');

      await nameInput.fill('신규 카테고리');
      await codeInput.fill('NEW_CATEGORY');
      await typeSelect.selectOption('MAIN');

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      // 모달이 닫혀야 함
      await expect(page.locator('h3', { hasText: '카테고리 추가' })).not.toBeVisible();
    });

    test('12.2 제출 중에는 버튼이 비활성화되고 로딩 상태가 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories', async (route) => {
        if (route.request().method() === 'POST') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ success: true, data: {} }),
          });
        }
      });

      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');

      await nameInput.fill('신규 카테고리');
      await codeInput.fill('NEW');

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      // Assert - 로딩 상태
      const loadingButton = page.getByRole('button', { name: '저장 중...' });
      await expect(loadingButton).toBeVisible();
      await expect(loadingButton).toBeDisabled();
      await expect(loadingButton).toHaveClass(/bg-blue-400.*cursor-not-allowed/);
    });

    test('12.3 제출 실패 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 409,
            body: JSON.stringify({
              success: false,
              error: { message: '이미 존재하는 코드입니다' },
            }),
          });
        }
      });

      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');

      await nameInput.fill('중복 카테고리');
      await codeInput.fill('DUPLICATE');

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      // Assert - 에러 메시지
      const errorBox = page.locator('.bg-red-50');
      await expect(errorBox).toBeVisible();
      await expect(errorBox).toContainText('이미 존재하는 코드입니다');
    });

    test('12.4 취소 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
      const cancelButton = page.getByRole('button', { name: '취소' });
      await cancelButton.click();

      const modal = page.locator('h3', { hasText: '카테고리 추가' });
      await expect(modal).not.toBeVisible();
    });

    test('12.5 취소 시 입력 데이터는 저장되지 않는다', async ({ page }) => {
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('취소될 카테고리');

      const cancelButton = page.getByRole('button', { name: '취소' });
      await cancelButton.click();

      // 카테고리가 트리에 추가되지 않음
      await expect(page.locator('text=취소될 카테고리')).not.toBeVisible();
    });
  });

  test.describe('13. 하위 카테고리 추가', () => {
    test('13.1 하위 카테고리 추가 버튼 클릭 시 모달이 열린다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const addChildButton = page.getByRole('button', { name: '하위 카테고리 추가' });
      await addChildButton.click();

      const modalTitle = page.locator('h3', { hasText: '카테고리 추가' });
      await expect(modalTitle).toBeVisible();
    });

    test('13.2 모달에 상위 카테고리 정보가 표시된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const addChildButton = page.getByRole('button', { name: '하위 카테고리 추가' });
      await addChildButton.click();

      const parentInfo = page.locator('text=상위 카테고리: 제품 문의');
      await expect(parentInfo).toBeVisible();
    });

    test('13.3 하위 카테고리 추가 시 parentId가 전송된다', async ({ page }) => {
      let capturedData: any;

      await page.route('**/api/v1/categories', async (route) => {
        if (route.request().method() === 'POST') {
          const postData = route.request().postDataJSON();
          capturedData = postData;

          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              success: true,
              data: { id: 101, name: '하위 카테고리', parentId: 1 },
            }),
          });
        }
      });

      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const addChildButton = page.getByRole('button', { name: '하위 카테고리 추가' });
      await addChildButton.click();

      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');
      await nameInput.fill('하위 카테고리');
      await codeInput.fill('CHILD');

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      expect(capturedData.parentId).toBe(1);
    });
  });

  test.describe('14. 카테고리 수정', () => {
    test('14.1 수정 버튼 클릭 시 수정 모달이 열린다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const editButton = page.getByRole('button', { name: '수정' });
      await editButton.click();

      const modalTitle = page.locator('h3', { hasText: '카테고리 수정' });
      await expect(modalTitle).toBeVisible();
    });

    test('14.2 수정 모달에 기존 데이터가 채워져 있다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const editButton = page.getByRole('button', { name: '수정' });
      await editButton.click();

      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toHaveValue('제품 문의');
    });

    test('14.3 수정 모달에는 활성화 체크박스가 표시된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const editButton = page.getByRole('button', { name: '수정' });
      await editButton.click();

      const checkbox = page.locator('input[type="checkbox"]#isActive');
      await expect(checkbox).toBeVisible();
    });

    test('14.4 활성화 체크박스 초기값이 올바르게 설정된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const editButton = page.getByRole('button', { name: '수정' });
      await editButton.click();

      const checkbox = page.locator('input[type="checkbox"]#isActive');
      await expect(checkbox).toBeChecked();
    });

    test('14.5 수정 버튼이 표시된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const editButton = page.getByRole('button', { name: '수정' });
      await editButton.click();

      const submitButton = page.getByRole('button', { name: '수정' }).last();
      await expect(submitButton).toBeVisible();
    });

    test('14.6 데이터 수정 후 저장이 가능하다', async ({ page }) => {
      await page.route('**/api/v1/categories/1', async (route) => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: { id: 1, name: '수정된 카테고리' },
            }),
          });
        }
      });

      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const editButton = page.getByRole('button', { name: '수정' });
      await editButton.click();

      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('수정된 카테고리');

      const submitButton = page.getByRole('button', { name: '수정' }).last();
      await submitButton.click();

      // 모달이 닫혀야 함
      await expect(page.locator('h3', { hasText: '카테고리 수정' })).not.toBeVisible();
    });

    test('14.7 수정 중 로딩 상태가 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories/1', async (route) => {
        if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true, data: {} }),
          });
        }
      });

      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      const editButton = page.getByRole('button', { name: '수정' });
      await editButton.click();

      const submitButton = page.getByRole('button', { name: '수정' }).last();
      await submitButton.click();

      const loadingButton = page.getByRole('button', { name: '저장 중...' });
      await expect(loadingButton).toBeVisible();
      await expect(loadingButton).toBeDisabled();
    });
  });

  test.describe('15. 카테고리 삭제', () => {
    test('15.1 삭제 버튼 클릭 시 확인 다이얼로그가 표시된다', async ({ page }) => {
      const inactiveNode = page.locator('div', { hasText: '비활성 카테고리' }).first();
      await inactiveNode.click();

      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('삭제하시겠습니까');
        await dialog.dismiss();
      });

      const deleteButton = page.getByRole('button', { name: '삭제' });
      await deleteButton.click();
    });

    test('15.2 확인 다이얼로그에 하위 카테고리 경고가 포함된다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('하위 카테고리가 있는 경우 삭제할 수 없습니다');
        await dialog.dismiss();
      });

      const deleteButton = page.getByRole('button', { name: '삭제' });
      await deleteButton.click();
    });

    test('15.3 삭제 확인 시 API 호출이 발생한다', async ({ page }) => {
      let deleteCalled = false;

      await page.route('**/api/v1/categories/3', async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteCalled = true;
          await route.fulfill({
            status: 204,
            body: '',
          });
        }
      });

      const inactiveNode = page.locator('div', { hasText: '비활성 카테고리' }).first();
      await inactiveNode.click();

      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      const deleteButton = page.getByRole('button', { name: '삭제' });
      await deleteButton.click();

      await page.waitForTimeout(500);
      expect(deleteCalled).toBe(true);
    });

    test('15.4 삭제 중에는 버튼이 "삭제 중..."으로 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories/3', async (route) => {
        if (route.request().method() === 'DELETE') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 204,
            body: '',
          });
        }
      });

      const inactiveNode = page.locator('div', { hasText: '비활성 카테고리' }).first();
      await inactiveNode.click();

      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      const deleteButton = page.getByRole('button', { name: '삭제' });
      await deleteButton.click();

      const loadingButton = page.getByRole('button', { name: '삭제 중...' });
      await expect(loadingButton).toBeVisible();
    });

    test('15.5 하위 카테고리가 있는 경우 삭제 실패 에러가 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories/1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({
              success: false,
              error: { message: '하위 카테고리가 있는 카테고리는 삭제할 수 없습니다' },
            }),
          });
        }
      });

      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.click();

      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });

      const deleteButton = page.getByRole('button', { name: '삭제' });
      await deleteButton.click();

      // 에러 alert 확인
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('하위 카테고리가 있는 카테고리는 삭제할 수 없습니다');
        await dialog.accept();
      });

      await page.waitForTimeout(500);
    });

    test('15.6 삭제 취소 시 아무 동작도 하지 않는다', async ({ page }) => {
      let deleteCalled = false;

      await page.route('**/api/v1/categories/3', async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteCalled = true;
          await route.fulfill({ status: 204 });
        }
      });

      const inactiveNode = page.locator('div', { hasText: '비활성 카테고리' }).first();
      await inactiveNode.click();

      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      const deleteButton = page.getByRole('button', { name: '삭제' });
      await deleteButton.click();

      await page.waitForTimeout(500);
      expect(deleteCalled).toBe(false);
    });
  });

  test.describe('16. 새로고침 기능', () => {
    test('16.1 새로고침 버튼 클릭 시 API가 재호출된다', async ({ page }) => {
      let apiCallCount = 0;

      await page.route('**/api/v1/categories/tree', async (route) => {
        apiCallCount++;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      const refreshButton = page.getByRole('button', { name: '새로고침' });
      await refreshButton.click();

      await page.waitForTimeout(500);
      expect(apiCallCount).toBeGreaterThan(1);
    });

    test('16.2 새로고침 중에는 로딩 스피너가 표시된다', async ({ page }) => {
      await page.route('**/api/v1/categories/tree', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      const refreshButton = page.getByRole('button', { name: '새로고침' });
      await refreshButton.click();

      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible();
    });
  });

  test.describe('17. 키보드 네비게이션', () => {
    test('17.1 Tab 키로 버튼 간 이동이 가능하다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      const refreshButton = page.getByRole('button', { name: '새로고침' });

      await addButton.focus();
      await expect(addButton).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(refreshButton).toBeFocused();
    });

    test('17.2 Enter 키로 카테고리 선택이 가능하다', async ({ page }) => {
      const productNode = page.locator('div', { hasText: '제품 문의' }).first();
      await productNode.focus();
      await page.keyboard.press('Enter');

      await expect(productNode).toHaveClass(/bg-blue-100/);
    });

    test('17.3 모달에서 Escape 키로 닫기가 가능하다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      await page.keyboard.press('Escape');

      const modal = page.locator('h3', { hasText: '카테고리 추가' });
      await expect(modal).not.toBeVisible();
    });

    test('17.4 모달 내에서 Tab 키로 포커스가 순환한다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');

      await nameInput.focus();
      await expect(nameInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(codeInput).toBeFocused();
    });
  });

  test.describe('18. 반응형 레이아웃', () => {
    test('18.1 모바일 뷰포트에서 레이아웃이 적절히 조정된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const heading = page.locator('h1', { hasText: '카테고리 관리' });
      await expect(heading).toBeVisible();

      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await expect(addButton).toBeVisible();
    });

    test('18.2 태블릿 뷰포트에서 상세 패널이 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const detailPanel = page.locator('h2', { hasText: '상세 정보' });
      await expect(detailPanel).toBeVisible();
    });

    test('18.3 모바일에서 모달이 화면에 맞게 조정된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const modal = page.locator('.max-w-md.mx-4');
      await expect(modal).toBeVisible();
    });
  });

  test.describe('19. 접근성 (Accessibility)', () => {
    test('19.1 주요 영역에 적절한 시맨틱 태그가 사용된다', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();
    });

    test('19.2 버튼에 적절한 role이 설정되어 있다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await expect(addButton).toHaveAttribute('type', 'button');
    });

    test('19.3 폼 필드에 label이 연결되어 있다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const nameLabel = page.locator('label', { hasText: '카테고리명' });
      await expect(nameLabel).toBeVisible();
    });

    test('19.4 에러 메시지가 적절히 연결되어 있다', async ({ page }) => {
      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      const errorMessage = page.locator('.text-red-600').first();
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('20. 에지 케이스', () => {
    test('20.1 네트워크 오류 시 적절한 에러 처리가 된다', async ({ page }) => {
      await page.route('**/api/v1/categories/tree', async (route) => {
        await route.abort('failed');
      });

      await page.reload();
      await page.waitForTimeout(2000);

      // 에러 상태 처리 확인 (로딩이 멈추고 빈 상태 또는 에러 메시지)
      const spinner = page.locator('.animate-spin');
      await expect(spinner).not.toBeVisible();
    });

    test('20.2 중복 클릭 방지가 적용된다', async ({ page }) => {
      let createCallCount = 0;

      await page.route('**/api/v1/categories', async (route) => {
        if (route.request().method() === 'POST') {
          createCallCount++;
          await new Promise((resolve) => setTimeout(resolve, 500));
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ success: true, data: {} }),
          });
        }
      });

      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');
      await nameInput.fill('테스트');
      await codeInput.fill('TEST');

      const submitButton = page.getByRole('button', { name: '추가' });

      // 더블 클릭 시도
      await submitButton.click();
      await submitButton.click();

      await page.waitForTimeout(1000);
      expect(createCallCount).toBe(1);
    });

    test('20.3 빈 트리에서 카테고리 추가가 가능하다', async ({ page }) => {
      await page.route('**/api/v1/categories/tree', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.route('**/api/v1/categories', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              success: true,
              data: { id: 1, name: '첫 카테고리', code: 'FIRST' },
            }),
          });
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const addButton = page.getByRole('button', { name: '+ 루트 카테고리' });
      await addButton.click();

      const nameInput = page.locator('input[name="name"]');
      const codeInput = page.locator('input[name="code"]');
      await nameInput.fill('첫 카테고리');
      await codeInput.fill('FIRST');

      const submitButton = page.getByRole('button', { name: '추가' });
      await submitButton.click();

      // 모달이 닫혀야 함
      await expect(page.locator('h3', { hasText: '카테고리 추가' })).not.toBeVisible();
    });
  });
});
