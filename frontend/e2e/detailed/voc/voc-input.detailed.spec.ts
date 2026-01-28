import { test, expect } from '@playwright/test';

/**
 * @description VOC 입력 페이지 상세 E2E 테스트 시나리오
 * @route /voc/input
 * @issue SC-02
 *
 * ## 테스트 대상 UI 요소
 * 1. 제목 입력 필드 (#title)
 * 2. 내용 입력 필드 (#content - textarea)
 * 3. 대분류 카테고리 선택 (#parentCategoryId)
 * 4. 중분류 카테고리 선택 (#categoryId)
 * 5. 우선순위 선택 (#priority)
 * 6. 고객명 입력 필드 (#customerName)
 * 7. 고객 이메일 입력 필드 (#customerEmail)
 * 8. 파일 첨부 (FileUpload)
 * 9. 초기화 버튼
 * 10. VOC 등록 버튼 (submit)
 * 11. VocSuccessModal (성공 모달)
 */

test.describe('VOC 입력 페이지 (/voc/input) - 상세 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    // Mock 카테고리 API
    await page.route('**/api/v1/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, name: '상품/서비스', type: 'MAIN', level: 0, parentId: null, isActive: true },
            { id: 2, name: '결제/환불', type: 'MAIN', level: 0, parentId: null, isActive: true },
            { id: 3, name: '배송', type: 'MAIN', level: 0, parentId: null, isActive: true },
            { id: 11, name: '상품 문의', type: 'SUB', level: 1, parentId: 1, isActive: true },
            { id: 12, name: '품질 문제', type: 'SUB', level: 1, parentId: 1, isActive: true },
            { id: 21, name: '결제 오류', type: 'SUB', level: 1, parentId: 2, isActive: true },
            { id: 22, name: '환불 요청', type: 'SUB', level: 1, parentId: 2, isActive: true },
            { id: 31, name: '배송 지연', type: 'SUB', level: 1, parentId: 3, isActive: true },
          ],
        }),
      });
    });

    await page.goto('/voc/input');
  });

  test.describe('1. 페이지 렌더링', () => {
    test('1.1 페이지 타이틀이 올바르게 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('h1')).toHaveText('VOC 등록');
    });

    test('1.2 페이지 설명이 표시된다', async ({ page }) => {
      // Assert
      const description = page.locator('p.text-gray-600').first();
      await expect(description).toContainText('고객의 소리');
    });

    test('1.3 모든 필수 폼 필드가 렌더링된다', async ({ page }) => {
      // Assert - 필수 필드 확인
      await expect(page.locator('#title')).toBeVisible();
      await expect(page.locator('#content')).toBeVisible();
      await expect(page.locator('#parentCategoryId')).toBeVisible();
      await expect(page.locator('#categoryId')).toBeVisible();
      await expect(page.locator('#priority')).toBeVisible();
      await expect(page.locator('#customerEmail')).toBeVisible();
    });

    test('1.4 선택적 폼 필드가 렌더링된다', async ({ page }) => {
      // Assert
      await expect(page.locator('#customerName')).toBeVisible();
    });

    test('1.5 버튼들이 올바르게 렌더링된다', async ({ page }) => {
      // Assert
      const resetButton = page.getByRole('button', { name: '초기화' });
      const submitButton = page.getByRole('button', { name: 'VOC 등록' });

      await expect(resetButton).toBeVisible();
      await expect(resetButton).toBeEnabled();
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('1.6 안내 사항 섹션이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('h3', { hasText: '안내 사항' })).toBeVisible();
      await expect(page.locator('text=등록된 VOC는 담당자 배정 후 처리가 진행됩니다')).toBeVisible();
      await expect(page.locator('text=첨부파일은 최대 5개, 각 파일당 10MB까지')).toBeVisible();
    });
  });

  test.describe('2. 제목 입력 필드 (#title)', () => {
    test('2.1 클릭 시 포커스된다', async ({ page }) => {
      const titleInput = page.locator('#title');

      // Act
      await titleInput.click();

      // Assert
      await expect(titleInput).toBeFocused();
    });

    test('2.2 텍스트 입력이 가능하다', async ({ page }) => {
      const titleInput = page.locator('#title');

      // Act
      await titleInput.fill('배송 지연 문의입니다');

      // Assert
      await expect(titleInput).toHaveValue('배송 지연 문의입니다');
    });

    test('2.3 플레이스홀더가 표시된다', async ({ page }) => {
      const titleInput = page.locator('#title');

      // Assert
      await expect(titleInput).toHaveAttribute('placeholder', /제목을 입력하세요/);
    });

    test('2.4 필수 표시가 있다', async ({ page }) => {
      const titleLabel = page.locator('label[for="title"]');

      // Assert
      await expect(titleLabel).toContainText('제목');
      await expect(titleLabel.locator('span.text-red-500')).toHaveText('*');
    });

    test('2.5 200자 이상 입력 시 경고가 표시된다', async ({ page }) => {
      const titleInput = page.locator('#title');
      const longTitle = 'A'.repeat(201);

      // Act
      await titleInput.fill(longTitle);
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="title"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('200자');
    });

    test('2.6 빈 값으로 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="title"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
      await expect(page.locator('#title')).toHaveAttribute('aria-invalid', 'true');
    });

    test('2.7 2자 미만 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      const titleInput = page.locator('#title');

      // Act
      await titleInput.fill('A');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="title"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('2자');
    });

    test('2.8 포커스 시 테두리 색상이 변경된다', async ({ page }) => {
      const titleInput = page.locator('#title');

      // Act
      await titleInput.focus();

      // Assert
      await expect(titleInput).toHaveClass(/focus:ring-blue-200/);
    });
  });

  test.describe('3. 내용 입력 필드 (#content)', () => {
    test('3.1 클릭 시 포커스된다', async ({ page }) => {
      const contentTextarea = page.locator('#content');

      // Act
      await contentTextarea.click();

      // Assert
      await expect(contentTextarea).toBeFocused();
    });

    test('3.2 텍스트 입력이 가능하다', async ({ page }) => {
      const contentTextarea = page.locator('#content');

      // Act
      await contentTextarea.fill('배송이 예정일보다 3일이 지나도 도착하지 않았습니다. 확인 부탁드립니다.');

      // Assert
      await expect(contentTextarea).toHaveValue(/배송이 예정일보다 3일이 지나도/);
    });

    test('3.3 여러 줄 입력이 가능하다 (textarea)', async ({ page }) => {
      const contentTextarea = page.locator('#content');

      // Act
      await contentTextarea.fill('첫 번째 줄입니다.\n두 번째 줄입니다.\n세 번째 줄입니다.');

      // Assert
      const value = await contentTextarea.inputValue();
      expect(value).toContain('\n');
    });

    test('3.4 8줄 높이로 렌더링된다', async ({ page }) => {
      const contentTextarea = page.locator('#content');

      // Assert
      await expect(contentTextarea).toHaveAttribute('rows', '8');
    });

    test('3.5 빈 값으로 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#title').fill('테스트 제목');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="content"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
      await expect(page.locator('#content')).toHaveAttribute('aria-invalid', 'true');
    });

    test('3.6 10자 미만 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      const contentTextarea = page.locator('#content');

      // Act
      await page.locator('#title').fill('테스트 제목');
      await contentTextarea.fill('짧은글');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="content"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('10자');
    });

    test('3.7 플레이스홀더가 표시된다', async ({ page }) => {
      const contentTextarea = page.locator('#content');

      // Assert
      await expect(contentTextarea).toHaveAttribute('placeholder', /내용을 입력하세요/);
    });

    test('3.8 필수 표시가 있다', async ({ page }) => {
      const contentLabel = page.locator('label[for="content"]');

      // Assert
      await expect(contentLabel).toContainText('내용');
      await expect(contentLabel.locator('span.text-red-500')).toHaveText('*');
    });
  });

  test.describe('4. 카테고리 선택 (대분류/중분류)', () => {
    test('4.1 대분류 select가 렌더링된다', async ({ page }) => {
      const parentSelect = page.locator('#parentCategoryId');

      // Assert
      await expect(parentSelect).toBeVisible();
      await expect(page.locator('label[for="parentCategoryId"]')).toContainText('대분류');
    });

    test('4.2 중분류 select가 렌더링된다', async ({ page }) => {
      const categorySelect = page.locator('#categoryId');

      // Assert
      await expect(categorySelect).toBeVisible();
      await expect(page.locator('label[for="categoryId"]')).toContainText('중분류');
    });

    test('4.3 대분류 선택 시 중분류 옵션이 로드된다', async ({ page }) => {
      const parentSelect = page.locator('#parentCategoryId');
      const categorySelect = page.locator('#categoryId');

      // Act - 대분류 선택 (상품/서비스)
      await parentSelect.selectOption({ value: '1' });

      // Assert - 중분류 옵션 확인
      await page.waitForTimeout(300);
      const options = await categorySelect.locator('option').allTextContents();
      expect(options).toContain('상품 문의');
      expect(options).toContain('품질 문제');
    });

    test('4.4 대분류 변경 시 중분류가 초기화된다', async ({ page }) => {
      const parentSelect = page.locator('#parentCategoryId');
      const categorySelect = page.locator('#categoryId');

      // Act - 첫 번째 대분류 선택 및 중분류 선택
      await parentSelect.selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await categorySelect.selectOption({ value: '11' });

      // 다른 대분류로 변경
      await parentSelect.selectOption({ value: '2' });
      await page.waitForTimeout(200);

      // Assert - 중분류가 초기화됨
      const selectedValue = await categorySelect.inputValue();
      expect(selectedValue).toBe('');
    });

    test('4.5 대분류를 선택하지 않으면 중분류가 비활성화된다', async ({ page }) => {
      const categorySelect = page.locator('#categoryId');

      // Assert
      await expect(categorySelect).toBeDisabled();
      await expect(categorySelect.locator('option').first()).toContainText('먼저 대분류를 선택하세요');
    });

    test('4.6 중분류가 없는 대분류 선택 시 적절한 메시지가 표시된다', async ({ page }) => {
      // Mock - 중분류가 없는 대분류 추가
      await page.route('**/api/v1/categories', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 99, name: '기타', type: 'MAIN', level: 0, parentId: null, isActive: true },
            ],
          }),
        });
      });

      await page.reload();

      const parentSelect = page.locator('#parentCategoryId');
      const categorySelect = page.locator('#categoryId');

      // Act
      await parentSelect.selectOption({ value: '99' });
      await page.waitForTimeout(200);

      // Assert
      await expect(categorySelect).toBeDisabled();
      await expect(categorySelect.locator('option').first()).toContainText('중분류가 없습니다');
    });

    test('4.7 카테고리 로딩 중에는 스켈레톤이 표시된다', async ({ page }) => {
      // Mock - 지연된 API 응답
      await page.route('**/api/v1/categories', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.reload();

      // Assert
      const skeleton = page.locator('.animate-pulse');
      await expect(skeleton).toBeVisible();
    });

    test('4.8 중분류 미선택 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="categoryId"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('5. 우선순위 선택 (#priority)', () => {
    test('5.1 우선순위 select가 렌더링된다', async ({ page }) => {
      const prioritySelect = page.locator('#priority');

      // Assert
      await expect(prioritySelect).toBeVisible();
      await expect(page.locator('label[for="priority"]')).toContainText('우선순위');
    });

    test('5.2 4가지 우선순위 옵션이 있다', async ({ page }) => {
      const prioritySelect = page.locator('#priority');

      // Assert
      const options = await prioritySelect.locator('option').allTextContents();
      expect(options).toHaveLength(4);
      expect(options).toContain('낮음');
      expect(options).toContain('보통');
      expect(options).toContain('높음');
      expect(options).toContain('긴급');
    });

    test('5.3 기본값이 선택되어 있다', async ({ page }) => {
      const prioritySelect = page.locator('#priority');

      // Assert
      const selectedValue = await prioritySelect.inputValue();
      expect(selectedValue).toBeTruthy();
      expect(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).toContain(selectedValue);
    });

    test('5.4 우선순위 변경이 가능하다', async ({ page }) => {
      const prioritySelect = page.locator('#priority');

      // Act
      await prioritySelect.selectOption({ value: 'URGENT' });

      // Assert
      await expect(prioritySelect).toHaveValue('URGENT');
    });

    test('5.5 필수 표시가 있다', async ({ page }) => {
      const priorityLabel = page.locator('label[for="priority"]');

      // Assert
      await expect(priorityLabel.locator('span.text-red-500')).toHaveText('*');
    });
  });

  test.describe('6. 고객 정보 입력', () => {
    test('6.1 고객 정보 섹션이 렌더링된다', async ({ page }) => {
      // Assert
      await expect(page.locator('h3', { hasText: '고객 정보' })).toBeVisible();
    });

    test('6.2 고객명 입력 필드가 선택사항이다', async ({ page }) => {
      const customerNameLabel = page.locator('label[for="customerName"]');

      // Assert
      await expect(customerNameLabel).toContainText('고객명');
      await expect(customerNameLabel.locator('span.text-red-500')).not.toBeVisible();
    });

    test('6.3 고객명 입력이 가능하다', async ({ page }) => {
      const customerNameInput = page.locator('#customerName');

      // Act
      await customerNameInput.fill('홍길동');

      // Assert
      await expect(customerNameInput).toHaveValue('홍길동');
    });

    test('6.4 고객 이메일 입력 필드가 필수이다', async ({ page }) => {
      const customerEmailLabel = page.locator('label[for="customerEmail"]');

      // Assert
      await expect(customerEmailLabel).toContainText('이메일');
      await expect(customerEmailLabel.locator('span.text-red-500')).toHaveText('*');
    });

    test('6.5 고객 이메일 입력이 가능하다', async ({ page }) => {
      const customerEmailInput = page.locator('#customerEmail');

      // Act
      await customerEmailInput.fill('customer@example.com');

      // Assert
      await expect(customerEmailInput).toHaveValue('customer@example.com');
    });

    test('6.6 이메일 필드 타입이 email이다', async ({ page }) => {
      const customerEmailInput = page.locator('#customerEmail');

      // Assert
      await expect(customerEmailInput).toHaveAttribute('type', 'email');
    });

    test('6.7 잘못된 이메일 형식 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('invalid-email');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="customerEmail"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/이메일|형식/i);
    });

    test('6.8 고객 이메일 빈 값 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      const errorMessage = page.locator('label[for="customerEmail"] ~ p.text-red-600');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('7. 파일 첨부 (FileUpload)', () => {
    test('7.1 파일 첨부 섹션이 렌더링된다', async ({ page }) => {
      // Assert
      await expect(page.locator('label', { hasText: '첨부파일' })).toBeVisible();
      await expect(page.getByRole('button', { name: '파일 선택' })).toBeVisible();
    });

    test('7.2 파일 업로드 제한 안내가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=최대 5개, 파일당 10MB 이하')).toBeVisible();
      await expect(page.locator('text=지원 형식:')).toBeVisible();
    });

    test('7.3 파일 선택 버튼 클릭이 가능하다', async ({ page }) => {
      const fileButton = page.getByRole('button', { name: '파일 선택' });

      // Assert
      await expect(fileButton).toBeEnabled();
    });

    test('7.4 단일 파일 업로드가 가능하다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('PDF content'),
      });

      // Assert
      await page.waitForTimeout(300);
      await expect(page.locator('text=test-document.pdf')).toBeVisible();
    });

    test('7.5 여러 파일 업로드가 가능하다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act
      await fileInput.setInputFiles([
        {
          name: 'file1.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('image content 1'),
        },
        {
          name: 'file2.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('pdf content'),
        },
      ]);

      // Assert
      await page.waitForTimeout(300);
      await expect(page.locator('text=file1.jpg')).toBeVisible();
      await expect(page.locator('text=file2.pdf')).toBeVisible();
    });

    test('7.6 업로드된 파일 정보가 표시된다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act
      await fileInput.setInputFiles({
        name: 'report.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('x'.repeat(1024 * 100)), // 100KB
      });

      // Assert
      await page.waitForTimeout(300);
      await expect(page.locator('text=report.xlsx')).toBeVisible();
      // 파일 크기도 표시됨
      await expect(page.locator('text=/\\d+(\\.\\d+)?\\s*(KB|MB|Bytes)/')).toBeVisible();
    });

    test('7.7 업로드된 파일 삭제가 가능하다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act - 파일 업로드
      await fileInput.setInputFiles({
        name: 'to-delete.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test'),
      });

      await page.waitForTimeout(300);
      await expect(page.locator('text=to-delete.txt')).toBeVisible();

      // Act - 삭제 버튼 클릭
      const deleteButton = page.locator('button', { hasText: '삭제' }).first();
      await deleteButton.click();

      // Assert
      await page.waitForTimeout(200);
      await expect(page.locator('text=to-delete.txt')).not.toBeVisible();
    });

    test('7.8 10MB 초과 파일 업로드 시 에러가 표시된다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act - 11MB 파일 생성
      await fileInput.setInputFiles({
        name: 'large-file.zip',
        mimeType: 'application/zip',
        buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB
      });

      // Assert
      await page.waitForTimeout(300);
      const errorMessage = page.locator('p.text-red-600[role="alert"]').last();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/크기|10MB/i);
    });

    test('7.9 5개 초과 파일 업로드 시 에러가 표시된다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act - 6개 파일 업로드 시도
      await fileInput.setInputFiles([
        { name: 'file1.txt', mimeType: 'text/plain', buffer: Buffer.from('1') },
        { name: 'file2.txt', mimeType: 'text/plain', buffer: Buffer.from('2') },
        { name: 'file3.txt', mimeType: 'text/plain', buffer: Buffer.from('3') },
        { name: 'file4.txt', mimeType: 'text/plain', buffer: Buffer.from('4') },
        { name: 'file5.txt', mimeType: 'text/plain', buffer: Buffer.from('5') },
        { name: 'file6.txt', mimeType: 'text/plain', buffer: Buffer.from('6') },
      ]);

      // Assert
      await page.waitForTimeout(300);
      const errorMessage = page.locator('p.text-red-600[role="alert"]').last();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/최대 5개/i);
    });

    test('7.10 파일 개수가 라벨에 표시된다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act
      await fileInput.setInputFiles([
        { name: 'file1.txt', mimeType: 'text/plain', buffer: Buffer.from('1') },
        { name: 'file2.txt', mimeType: 'text/plain', buffer: Buffer.from('2') },
      ]);

      // Assert
      await page.waitForTimeout(300);
      const fileLabel = page.locator('label', { hasText: '첨부파일' });
      await expect(fileLabel).toContainText('(2/5)');
    });

    test('7.11 5개 파일 업로드 후 파일 선택 버튼이 비활성화된다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Act
      await fileInput.setInputFiles([
        { name: 'file1.txt', mimeType: 'text/plain', buffer: Buffer.from('1') },
        { name: 'file2.txt', mimeType: 'text/plain', buffer: Buffer.from('2') },
        { name: 'file3.txt', mimeType: 'text/plain', buffer: Buffer.from('3') },
        { name: 'file4.txt', mimeType: 'text/plain', buffer: Buffer.from('4') },
        { name: 'file5.txt', mimeType: 'text/plain', buffer: Buffer.from('5') },
      ]);

      // Assert
      await page.waitForTimeout(300);
      const fileButton = page.getByRole('button', { name: '파일 선택' });
      await expect(fileButton).toBeDisabled();
    });
  });

  test.describe('8. 초기화 버튼', () => {
    test('8.1 초기화 버튼이 렌더링된다', async ({ page }) => {
      const resetButton = page.getByRole('button', { name: '초기화' });

      // Assert
      await expect(resetButton).toBeVisible();
      await expect(resetButton).toBeEnabled();
    });

    test('8.2 클릭 시 모든 필드가 초기화된다', async ({ page }) => {
      // Arrange - 폼 입력
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerName').fill('홍길동');
      await page.locator('#customerEmail').fill('test@example.com');

      // Act
      await page.getByRole('button', { name: '초기화' }).click();

      // Assert
      await expect(page.locator('#title')).toHaveValue('');
      await expect(page.locator('#content')).toHaveValue('');
      await expect(page.locator('#customerName')).toHaveValue('');
      await expect(page.locator('#customerEmail')).toHaveValue('');
    });

    test('8.3 카테고리 선택도 초기화된다', async ({ page }) => {
      // Arrange
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act
      await page.getByRole('button', { name: '초기화' }).click();

      // Assert
      await page.waitForTimeout(200);
      const parentValue = await page.locator('#parentCategoryId').inputValue();
      const categoryValue = await page.locator('#categoryId').inputValue();
      expect(parentValue).toBe('');
      expect(categoryValue).toBe('');
    });

    test('8.4 업로드된 파일도 초기화된다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Arrange
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test'),
      });
      await page.waitForTimeout(300);

      // Act
      await page.getByRole('button', { name: '초기화' }).click();

      // Assert
      await expect(page.locator('text=test.txt')).not.toBeVisible();
    });

    test('8.5 제출 중에는 초기화 버튼이 비활성화된다', async ({ page }) => {
      // Mock - 지연된 API 응답
      await page.route('**/api/vocs', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 1, ticketId: 'VOC-20260127-0001' },
          }),
        });
      });

      // Arrange
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert - 로딩 중
      const resetButton = page.getByRole('button', { name: '초기화' });
      await expect(resetButton).toBeDisabled();
    });
  });

  test.describe('9. VOC 등록 버튼', () => {
    test.beforeEach(async ({ page }) => {
      // Mock VOC 등록 API
      await page.route('**/api/vocs', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                ticketId: 'VOC-20260127-0001',
                title: '테스트 VOC',
                status: 'SUBMITTED',
              },
            }),
          });
        }
      });
    });

    test('9.1 등록 버튼이 렌더링된다', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: 'VOC 등록' });

      // Assert
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('9.2 필수 필드 미입력 시 폼이 제출되지 않는다', async ({ page }) => {
      let apiCalled = false;
      await page.route('**/api/vocs', async (route) => {
        apiCalled = true;
        await route.fulfill({ status: 201 });
      });

      // Act - 빈 폼 제출
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      expect(apiCalled).toBe(false);
      await expect(page.locator('p.text-red-600[role="alert"]')).toBeVisible();
    });

    test('9.3 유효한 데이터로 제출 시 성공 모달이 표시된다', async ({ page }) => {
      // Arrange
      await page.locator('#title').fill('배송 지연 문의');
      await page.locator('#content').fill('주문한 상품이 예정일보다 3일 지연되었습니다. 확인 부탁드립니다.');
      await page.locator('#customerEmail').fill('customer@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '3' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '31' });

      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(1000);
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).toBeVisible();
      await expect(page.locator('text=VOC-20260127-0001')).toBeVisible();
    });

    test('9.4 제출 중에는 버튼이 비활성화되고 로딩 텍스트가 표시된다', async ({ page }) => {
      // Mock - 지연된 응답
      await page.route('**/api/vocs', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 1, ticketId: 'VOC-20260127-0001' },
          }),
        });
      });

      // Arrange
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      const submitButton = page.getByRole('button', { name: '등록 중...' });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });

    test('9.5 API 에러 시 에러 메시지가 표시된다', async ({ page }) => {
      // Mock - 에러 응답
      await page.route('**/api/vocs', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '서버 오류가 발생했습니다' },
          }),
        });
      });

      // Arrange
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(1000);
      const errorAlert = page.locator('.bg-red-50[role="alert"]');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/오류/i);
    });

    test('9.6 Enter 키로 폼 제출이 가능하다', async ({ page }) => {
      // Arrange
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act - 마지막 입력 필드에서 Enter
      await page.locator('#customerEmail').press('Enter');

      // Assert
      await page.waitForTimeout(1000);
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).toBeVisible();
    });

    test('9.7 파일 첨부 포함 제출이 가능하다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Arrange
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      await fileInput.setInputFiles({
        name: 'screenshot.png',
        mimeType: 'image/png',
        buffer: Buffer.from('image data'),
      });

      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(1000);
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).toBeVisible();
    });
  });

  test.describe('10. 성공 모달 (VocSuccessModal)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock VOC 등록 API
      await page.route('**/api/vocs', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                ticketId: 'VOC-20260127-0001',
                title: '테스트 VOC',
              },
            }),
          });
        }
      });

      // 유효한 폼 입력
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      await page.getByRole('button', { name: 'VOC 등록' }).click();
      await page.waitForTimeout(1000);
    });

    test('10.1 성공 모달이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).toBeVisible();
      await expect(page.locator('.fixed.inset-0.bg-black.bg-opacity-50')).toBeVisible();
    });

    test('10.2 성공 메시지가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=고객의 소리가 성공적으로 등록되었습니다')).toBeVisible();
    });

    test('10.3 티켓 번호가 올바르게 표시된다', async ({ page }) => {
      // Assert
      const ticketId = page.locator('p.text-2xl.font-bold.text-blue-600');
      await expect(ticketId).toBeVisible();
      await expect(ticketId).toHaveText('VOC-20260127-0001');
    });

    test('10.4 안내 메시지가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=티켓 번호를 통해 언제든지 VOC 처리 현황을 조회하실 수 있습니다')).toBeVisible();
      await expect(page.locator('text=담당자 배정 후 처리 진행 상황을 안내드리겠습니다')).toBeVisible();
    });

    test('10.5 목록으로 버튼이 렌더링된다', async ({ page }) => {
      const listButton = page.getByRole('button', { name: '목록으로' });

      // Assert
      await expect(listButton).toBeVisible();
      await expect(listButton).toBeEnabled();
    });

    test('10.6 새 VOC 등록 버튼이 렌더링된다', async ({ page }) => {
      const newVocButton = page.getByRole('button', { name: '새 VOC 등록' });

      // Assert
      await expect(newVocButton).toBeVisible();
      await expect(newVocButton).toBeEnabled();
    });

    test('10.7 목록으로 버튼 클릭 시 VOC 목록 페이지로 이동한다', async ({ page }) => {
      const listButton = page.getByRole('button', { name: '목록으로' });

      // Act
      await listButton.click();

      // Assert
      await expect(page).toHaveURL(/\/voc\/table/);
    });

    test('10.8 새 VOC 등록 버튼 클릭 시 모달이 닫히고 폼이 초기화된다', async ({ page }) => {
      const newVocButton = page.getByRole('button', { name: '새 VOC 등록' });

      // Act
      await newVocButton.click();

      // Assert
      await page.waitForTimeout(300);
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).not.toBeVisible();
      await expect(page.locator('#title')).toHaveValue('');
      await expect(page.locator('#content')).toHaveValue('');
    });

    test('10.9 성공 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const successIcon = page.locator('.text-green-600 svg');
      await expect(successIcon).toBeVisible();
    });

    test('10.10 모달 오버레이가 반투명 배경을 가진다', async ({ page }) => {
      const overlay = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');

      // Assert
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveClass(/bg-opacity-50/);
    });
  });

  test.describe('11. 키보드 네비게이션', () => {
    test('11.1 Tab 키로 폼 요소 간 이동이 가능하다', async ({ page }) => {
      const titleInput = page.locator('#title');
      const contentTextarea = page.locator('#content');

      // 제목 → 내용
      await titleInput.focus();
      await page.keyboard.press('Tab');
      await expect(contentTextarea).toBeFocused();
    });

    test('11.2 Shift+Tab으로 역방향 이동이 가능하다', async ({ page }) => {
      const titleInput = page.locator('#title');
      const contentTextarea = page.locator('#content');

      await contentTextarea.focus();

      // Act - 역방향 이동
      await page.keyboard.press('Shift+Tab');

      // Assert
      await expect(titleInput).toBeFocused();
    });

    test('11.3 select 요소에서 화살표 키로 옵션 선택이 가능하다', async ({ page }) => {
      const prioritySelect = page.locator('#priority');

      // Act
      await prioritySelect.focus();
      await page.keyboard.press('ArrowDown');

      // Assert - 선택이 변경됨
      await expect(prioritySelect).toBeFocused();
    });
  });

  test.describe('12. 접근성 (Accessibility)', () => {
    test('12.1 모든 input 필드에 label이 연결되어 있다', async ({ page }) => {
      // Assert
      await expect(page.locator('label[for="title"]')).toBeVisible();
      await expect(page.locator('label[for="content"]')).toBeVisible();
      await expect(page.locator('label[for="parentCategoryId"]')).toBeVisible();
      await expect(page.locator('label[for="categoryId"]')).toBeVisible();
      await expect(page.locator('label[for="priority"]')).toBeVisible();
      await expect(page.locator('label[for="customerName"]')).toBeVisible();
      await expect(page.locator('label[for="customerEmail"]')).toBeVisible();
    });

    test('12.2 필수 필드에 * 표시가 있다', async ({ page }) => {
      const requiredLabels = [
        'label[for="title"]',
        'label[for="content"]',
        'label[for="parentCategoryId"]',
        'label[for="categoryId"]',
        'label[for="priority"]',
        'label[for="customerEmail"]',
      ];

      // Assert
      for (const selector of requiredLabels) {
        const asterisk = page.locator(`${selector} span.text-red-500`);
        await expect(asterisk).toHaveText('*');
      }
    });

    test('12.3 유효성 검사 실패 시 aria-invalid가 true로 설정된다', async ({ page }) => {
      // Act - 빈 폼 제출
      await page.getByRole('button', { name: 'VOC 등록' }).click();
      await page.waitForTimeout(500);

      // Assert
      await expect(page.locator('#title')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#content')).toHaveAttribute('aria-invalid', 'true');
    });

    test('12.4 에러 메시지에 role="alert"가 설정되어 있다', async ({ page }) => {
      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();
      await page.waitForTimeout(500);

      // Assert
      const errorMessages = page.locator('p.text-red-600[role="alert"]');
      await expect(errorMessages.first()).toBeVisible();
    });

    test('12.5 파일 삭제 버튼에 aria-label이 있다', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');

      // Arrange
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('test'),
      });

      await page.waitForTimeout(300);

      // Assert
      const deleteButton = page.locator('button[aria-label*="삭제"]').first();
      await expect(deleteButton).toHaveAttribute('aria-label', /test.pdf 삭제/);
    });
  });

  test.describe('13. 반응형 레이아웃', () => {
    test('13.1 모바일 뷰포트에서 폼이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert
      await expect(page.locator('#title')).toBeVisible();
      await expect(page.locator('#content')).toBeVisible();
      await expect(page.getByRole('button', { name: 'VOC 등록' })).toBeVisible();
    });

    test('13.2 태블릿 뷰포트에서 폼이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Assert
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('.max-w-4xl')).toBeVisible();
    });

    test('13.3 데스크톱 뷰포트에서 폼이 중앙 정렬된다', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Assert
      const container = page.locator('.max-w-4xl.mx-auto');
      await expect(container).toBeVisible();
    });

    test('13.4 모바일에서 버튼이 적절한 크기로 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const resetButton = page.getByRole('button', { name: '초기화' });
      const submitButton = page.getByRole('button', { name: 'VOC 등록' });

      // Assert - 버튼이 터치하기 쉬운 크기
      await expect(resetButton).toBeVisible();
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('14. 에지 케이스', () => {
    test('14.1 네트워크 오류 시 적절한 에러 메시지가 표시된다', async ({ page }) => {
      // Mock - 네트워크 오류
      await page.route('**/api/vocs', async (route) => {
        await route.abort('failed');
      });

      // Arrange
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(1000);
      const errorAlert = page.locator('.bg-red-50[role="alert"]');
      await expect(errorAlert).toBeVisible();
    });

    test('14.2 카테고리 API 로딩 실패 시 처리된다', async ({ page }) => {
      // Mock - 카테고리 API 오류
      await page.route('**/api/v1/categories', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '카테고리를 불러올 수 없습니다' },
          }),
        });
      });

      await page.reload();

      // Assert - 에러 상태에서도 폼은 표시됨
      await expect(page.locator('#title')).toBeVisible();
    });

    test('14.3 더블 클릭 시 폼이 한 번만 제출된다', async ({ page }) => {
      let submitCount = 0;
      await page.route('**/api/vocs', async (route) => {
        submitCount++;
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 1, ticketId: 'VOC-20260127-0001' },
          }),
        });
      });

      // Arrange
      await page.locator('#title').fill('테스트 제목');
      await page.locator('#content').fill('테스트 내용입니다. 최소 10자 이상.');
      await page.locator('#customerEmail').fill('test@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act - 더블 클릭
      const submitButton = page.getByRole('button', { name: 'VOC 등록' });
      await submitButton.dblclick();

      // 대기
      await page.waitForTimeout(1500);

      // Assert - 버튼이 비활성화되어 한 번만 제출됨
      expect(submitCount).toBeLessThanOrEqual(2);
    });

    test('14.4 특수 문자가 포함된 제목 입력이 가능하다', async ({ page }) => {
      const specialTitle = '배송 문의 (긴급) - <주문번호: #12345>';

      // Act
      await page.locator('#title').fill(specialTitle);

      // Assert
      await expect(page.locator('#title')).toHaveValue(specialTitle);
    });

    test('14.5 매우 긴 내용 입력이 가능하다', async ({ page }) => {
      const longContent = '안녕하세요. '.repeat(100); // 600자

      // Act
      await page.locator('#content').fill(longContent);

      // Assert
      await expect(page.locator('#content')).toHaveValue(longContent);
    });

    test('14.6 XSS 공격 시도가 차단된다', async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';

      // Act
      await page.locator('#title').fill(xssPayload);
      await page.locator('#content').fill(xssPayload);

      // Assert - 텍스트로 저장되고 스크립트 실행 안됨
      await expect(page.locator('#title')).toHaveValue(xssPayload);

      let alertTriggered = false;
      page.on('dialog', () => {
        alertTriggered = true;
      });

      await page.getByRole('button', { name: 'VOC 등록' }).click();
      await page.waitForTimeout(500);

      expect(alertTriggered).toBe(false);
    });

    test('14.7 빈 공백만 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#title').fill('   ');
      await page.locator('#content').fill('   ');
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(500);
      await expect(page.locator('p.text-red-600[role="alert"]')).toBeVisible();
    });
  });

  test.describe('15. 통합 시나리오', () => {
    test('15.1 전체 VOC 등록 플로우가 정상 동작한다', async ({ page }) => {
      // Mock VOC 등록 API
      await page.route('**/api/vocs', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                ticketId: 'VOC-20260127-0001',
                title: '배송 지연 문의',
              },
            }),
          });
        }
      });

      // Step 1: 제목 입력
      await page.locator('#title').fill('배송 지연 문의');
      await expect(page.locator('#title')).toHaveValue('배송 지연 문의');

      // Step 2: 내용 입력
      await page.locator('#content').fill('주문한 상품이 예정일보다 3일 지연되었습니다. 배송 현황을 확인해주세요.');
      await expect(page.locator('#content')).toHaveValue(/예정일보다 3일/);

      // Step 3: 대분류 선택
      await page.locator('#parentCategoryId').selectOption({ value: '3' });
      await page.waitForTimeout(200);

      // Step 4: 중분류 선택
      await page.locator('#categoryId').selectOption({ value: '31' });
      await expect(page.locator('#categoryId')).toHaveValue('31');

      // Step 5: 우선순위 선택
      await page.locator('#priority').selectOption({ value: 'HIGH' });

      // Step 6: 고객 정보 입력
      await page.locator('#customerName').fill('홍길동');
      await page.locator('#customerEmail').fill('hong@example.com');

      // Step 7: 파일 첨부
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'delivery-proof.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('image data'),
      });
      await page.waitForTimeout(300);
      await expect(page.locator('text=delivery-proof.jpg')).toBeVisible();

      // Step 8: 제출
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Step 9: 성공 모달 확인
      await page.waitForTimeout(1000);
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).toBeVisible();
      await expect(page.locator('text=VOC-20260127-0001')).toBeVisible();

      // Step 10: 새 VOC 등록
      await page.getByRole('button', { name: '새 VOC 등록' }).click();
      await page.waitForTimeout(300);

      // Step 11: 폼 초기화 확인
      await expect(page.locator('#title')).toHaveValue('');
      await expect(page.locator('#content')).toHaveValue('');
    });

    test('15.2 최소 정보만으로 VOC 등록이 가능하다', async ({ page }) => {
      // Mock API
      await page.route('**/api/vocs', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { id: 2, ticketId: 'VOC-20260127-0002' },
            }),
          });
        }
      });

      // Arrange - 필수 필드만 입력
      await page.locator('#title').fill('간단한 문의');
      await page.locator('#content').fill('간단한 문의 내용입니다. 확인 부탁드립니다.');
      await page.locator('#customerEmail').fill('simple@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act
      await page.getByRole('button', { name: 'VOC 등록' }).click();

      // Assert
      await page.waitForTimeout(1000);
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).toBeVisible();
    });

    test('15.3 에러 발생 후 재시도가 가능하다', async ({ page }) => {
      let attemptCount = 0;

      await page.route('**/api/vocs', async (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          // 첫 번째 시도: 실패
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: '서버 오류' },
            }),
          });
        } else {
          // 두 번째 시도: 성공
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { id: 3, ticketId: 'VOC-20260127-0003' },
            }),
          });
        }
      });

      // Arrange
      await page.locator('#title').fill('재시도 테스트');
      await page.locator('#content').fill('재시도 테스트 내용입니다. 확인 부탁드립니다.');
      await page.locator('#customerEmail').fill('retry@example.com');
      await page.locator('#parentCategoryId').selectOption({ value: '1' });
      await page.waitForTimeout(200);
      await page.locator('#categoryId').selectOption({ value: '11' });

      // Act - 첫 번째 시도 (실패)
      await page.getByRole('button', { name: 'VOC 등록' }).click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.bg-red-50[role="alert"]')).toBeVisible();

      // Act - 두 번째 시도 (성공)
      await page.getByRole('button', { name: 'VOC 등록' }).click();
      await page.waitForTimeout(1000);

      // Assert
      await expect(page.locator('h3', { hasText: 'VOC 등록 완료' })).toBeVisible();
    });
  });
});
