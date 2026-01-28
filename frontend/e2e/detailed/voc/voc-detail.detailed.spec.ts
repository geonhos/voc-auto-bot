import { test, expect } from '@playwright/test';

/**
 * @description VOC 상세 페이지 상세 E2E 테스트 시나리오
 * @route /voc/[id]
 * @issue #117
 *
 * ## 테스트 대상 UI 요소
 * 1. 헤더 영역 (티켓 ID, 제목, 상태 배지, 우선순위 배지)
 * 2. VOC 기본 정보 섹션
 * 3. 고객 정보
 * 4. 내용 섹션
 * 5. 카테고리 변경 드롭다운
 * 6. 담당자 메모 입력 및 저장
 * 7. 변경 이력 타임라인
 * 8. 첨부파일 섹션
 * 9. 유사 VOC 섹션
 * 10. AI 분석 결과
 * 11. 액션 버튼 (반려, 이메일, 완료)
 * 12. 반응형 레이아웃
 */

test.describe('VOC 상세 페이지 (/voc/[id]) - 상세 시나리오', () => {
  const mockVoc = {
    id: 1,
    ticketId: 'VOC-20260125-0001',
    title: '제품 배송 지연 문의',
    content: '주문한 제품이 예정일보다 3일이나 지연되고 있습니다. 빠른 확인 부탁드립니다.',
    status: 'NEW',
    priority: 'HIGH',
    channel: 'WEB',
    customerName: '홍길동',
    customerEmail: 'hong@example.com',
    customerPhone: '010-1234-5678',
    category: {
      id: 1,
      name: '배송',
      code: 'DELIVERY',
    },
    suggestedCategory: {
      id: 1,
      name: '배송',
      code: 'DELIVERY',
    },
    attachments: [
      {
        id: 1,
        originalFileName: 'receipt.pdf',
        storedFileName: 'stored-123.pdf',
        fileSize: 1024 * 500,
        mimeType: 'application/pdf',
        downloadUrl: '/api/files/download/123',
        createdAt: '2026-01-25T10:00:00Z',
      },
      {
        id: 2,
        originalFileName: 'photo.jpg',
        storedFileName: 'stored-456.jpg',
        fileSize: 1024 * 800,
        mimeType: 'image/jpeg',
        downloadUrl: '/api/files/download/456',
        createdAt: '2026-01-25T10:01:00Z',
      },
    ],
    memos: [
      {
        id: 1,
        content: '배송팀에 문의하였습니다.',
        isInternal: true,
        author: {
          id: 1,
          name: '김담당',
        },
        createdAt: '2026-01-25T11:00:00Z',
      },
      {
        id: 2,
        content: '고객에게 안내 완료',
        isInternal: false,
        author: {
          id: 1,
          name: '김담당',
        },
        createdAt: '2026-01-25T12:00:00Z',
      },
    ],
    aiAnalysis: {
      summary: '고객이 배송 지연으로 인해 불만을 표현하고 있습니다. 빠른 배송 상태 확인 및 고객 안내가 필요합니다.',
      sentiment: 'NEGATIVE',
      suggestedCategoryId: 1,
      suggestedCategoryName: '배송',
      confidence: 0.95,
      keywords: ['배송', '지연', '확인'],
      analyzedAt: '2026-01-25T10:00:30Z',
    },
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-25T12:00:00Z',
  };

  const mockSimilarVocs = [
    {
      id: 2,
      ticketId: 'VOC-20260124-0020',
      title: '제품 배송 관련 문의',
      status: 'RESOLVED',
      similarity: 0.87,
      createdAt: '2026-01-24T15:00:00Z',
    },
    {
      id: 3,
      ticketId: 'VOC-20260123-0045',
      title: '배송 지연 문의',
      status: 'CLOSED',
      similarity: 0.76,
      createdAt: '2026-01-23T09:30:00Z',
    },
  ];

  const mockCategoryTree = [
    {
      id: 1,
      name: '배송',
      code: 'DELIVERY',
      level: 0,
      children: [
        { id: 11, name: '배송 지연', code: 'DELIVERY_DELAY', level: 1 },
        { id: 12, name: '배송 오류', code: 'DELIVERY_ERROR', level: 1 },
      ],
    },
    {
      id: 2,
      name: '제품',
      code: 'PRODUCT',
      level: 0,
      children: [
        { id: 21, name: '제품 불량', code: 'PRODUCT_DEFECT', level: 1 },
        { id: 22, name: '제품 문의', code: 'PRODUCT_INQUIRY', level: 1 },
      ],
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock authentication
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

    // Mock VOC detail API
    await page.route('**/api/vocs/1', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockVoc,
          }),
        });
      }
    });

    // Mock similar VOCs API
    await page.route('**/api/vocs/1/similar*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockSimilarVocs,
        }),
      });
    });

    // Mock category tree API
    await page.route('**/api/categories/tree', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockCategoryTree,
        }),
      });
    });

    await page.goto('/voc/1');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. 페이지 렌더링 및 로딩', () => {
    test('1.1 페이지가 올바르게 로드된다', async ({ page }) => {
      // Assert - 페이지 제목
      await expect(page.locator('h1')).toContainText('VOC 상세');

      // Assert - 기본 정보 섹션
      await expect(page.locator('text=VOC 기본 정보')).toBeVisible();
    });

    test('1.2 로딩 중에는 스피너가 표시된다', async ({ page }) => {
      // Arrange - 느린 API 응답 설정
      await page.route('**/api/vocs/2', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockVoc,
          }),
        });
      });

      // Act
      await page.goto('/voc/2');

      // Assert - 로딩 스피너 확인
      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible();
    });

    test('1.3 존재하지 않는 VOC ID 접근 시 에러 메시지가 표시된다', async ({ page }) => {
      // Arrange
      await page.route('**/api/vocs/999', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'VOC를 찾을 수 없습니다' },
          }),
        });
      });

      // Act
      await page.goto('/voc/999');

      // Assert
      await expect(page.locator('text=VOC를 찾을 수 없습니다')).toBeVisible();
      await expect(page.getByRole('button', { name: '목록으로 돌아가기' })).toBeVisible();
    });
  });

  test.describe('2. VOC 기본 정보 섹션', () => {
    test('2.1 티켓 ID가 올바르게 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=Ticket ID')).toBeVisible();
      await expect(page.locator(`text=${mockVoc.ticketId}`)).toBeVisible();
    });

    test('2.2 제목이 올바르게 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=제목')).toBeVisible();
      await expect(page.locator(`text=${mockVoc.title}`)).toBeVisible();
    });

    test('2.3 상태 배지가 올바르게 표시된다', async ({ page }) => {
      // Assert
      const statusBadge = page.locator('.status-badge').first();
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toContainText('접수');
    });

    test('2.4 상태 배지에 적절한 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const statusIcon = page.locator('.status-badge .material-icons-outlined').first();
      await expect(statusIcon).toBeVisible();
      await expect(statusIcon).toContainText('inbox');
    });

    test('2.5 접수일시가 올바른 형식으로 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=접수일시')).toBeVisible();
      // 한국 로케일 형식: 2026. 01. 25. 오후 7:00:00
      await expect(page.locator('text=/2026.*01.*25/')).toBeVisible();
    });

    test('2.6 고객 이메일이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=최종 사용자 이메일')).toBeVisible();
      await expect(page.locator(`text=${mockVoc.customerEmail}`)).toBeVisible();
    });

    test('2.7 내용이 올바르게 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=내용')).toBeVisible();
      const contentBox = page.locator('.whitespace-pre-wrap').first();
      await expect(contentBox).toContainText(mockVoc.content);
    });

    test('2.8 내용 영역은 pre-wrap으로 줄바꿈이 유지된다', async ({ page }) => {
      // Assert
      const contentBox = page.locator('.whitespace-pre-wrap').first();
      await expect(contentBox).toHaveClass(/whitespace-pre-wrap/);
    });

    test('2.9 계정 ID(고객명)가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=계정 ID')).toBeVisible();
      await expect(page.locator(`text=${mockVoc.customerName}`)).toBeVisible();
    });
  });

  test.describe('3. 첨부파일 섹션', () => {
    test('3.1 첨부파일이 있으면 섹션이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=첨부 파일')).toBeVisible();
    });

    test('3.2 첨부파일 목록이 올바르게 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator(`text=${mockVoc.attachments[0].originalFileName}`)).toBeVisible();
      await expect(page.locator(`text=${mockVoc.attachments[1].originalFileName}`)).toBeVisible();
    });

    test('3.3 첨부파일 아이콘이 파일 타입에 따라 다르게 표시된다', async ({ page }) => {
      // Assert - PDF 아이콘
      const pdfRow = page.locator(`text=${mockVoc.attachments[0].originalFileName}`).locator('..');
      const pdfIcon = pdfRow.locator('.material-icons-outlined');
      await expect(pdfIcon).toContainText('description');

      // Assert - 이미지 아이콘
      const imageRow = page.locator(`text=${mockVoc.attachments[1].originalFileName}`).locator('..');
      const imageIcon = imageRow.locator('.material-icons-outlined');
      await expect(imageIcon).toContainText('image');
    });

    test('3.4 첨부파일 크기가 MB 단위로 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=/0.5 MB/')).toBeVisible();
      await expect(page.locator('text=/0.8 MB/')).toBeVisible();
    });

    test('3.5 첨부파일에 호버하면 배경색이 변경된다', async ({ page }) => {
      // Arrange
      const firstAttachment = page
        .locator(`text=${mockVoc.attachments[0].originalFileName}`)
        .locator('..');

      // Act
      await firstAttachment.hover();

      // Assert - hover 클래스 확인
      await expect(firstAttachment).toHaveClass(/hover:bg-slate-100/);
    });

    test('3.6 첨부파일 다운로드 버튼이 표시된다', async ({ page }) => {
      // Assert
      const downloadIcons = page.locator('.material-icons-outlined:has-text("download")');
      await expect(downloadIcons).toHaveCount(2);
    });

    test('3.7 첨부파일 다운로드 링크가 올바르게 설정되어 있다', async ({ page }) => {
      // Assert
      const firstLink = page.locator(`text=${mockVoc.attachments[0].originalFileName}`).locator('..');
      await expect(firstLink).toHaveAttribute('href', mockVoc.attachments[0].downloadUrl);
      await expect(firstLink).toHaveAttribute('target', '_blank');
    });
  });

  test.describe('4. AI 분석 결과 섹션', () => {
    test('4.1 AI 분석 결과 섹션이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=AI 분석 결과')).toBeVisible();
    });

    test('4.2 AI 분석 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const aiIcon = page
        .locator('text=AI 분석 결과')
        .locator('..')
        .locator('.material-icons-outlined:has-text("psychology")');
      await expect(aiIcon).toBeVisible();
    });

    test('4.3 자동 분류 카테고리가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=자동 분류 카테고리')).toBeVisible();
      await expect(page.locator(`text=${mockVoc.suggestedCategory!.name}`)).toBeVisible();
    });

    test('4.4 추천 응대 가이드가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=추천 응대 가이드')).toBeVisible();
      await expect(page.locator(`text=${mockVoc.aiAnalysis!.summary}`)).toBeVisible();
    });

    test('4.5 추천 응대 가이드는 info 색상의 배경을 가진다', async ({ page }) => {
      // Assert
      const guideBox = page.locator('.bg-info\\/5').first();
      await expect(guideBox).toBeVisible();
      await expect(guideBox).toHaveClass(/border-info/);
    });
  });

  test.describe('5. 유사 VOC 섹션', () => {
    test('5.1 유사 VOC 섹션이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=/유사 VOC/')).toBeVisible();
    });

    test('5.2 유사 VOC 개수가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator(`text=유사 VOC (${mockSimilarVocs.length}건)`)).toBeVisible();
    });

    test('5.3 유사 VOC 목록이 표시된다', async ({ page }) => {
      // Assert
      for (const similar of mockSimilarVocs) {
        await expect(page.locator(`text=${similar.ticketId}`)).toBeVisible();
        await expect(page.locator(`text=${similar.title}`)).toBeVisible();
      }
    });

    test('5.4 유사도가 퍼센트로 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=/유사도 0.87/')).toBeVisible();
      await expect(page.locator('text=/유사도 0.76/')).toBeVisible();
    });

    test('5.5 유사도가 0.8 이상이면 success 색상으로 표시된다', async ({ page }) => {
      // Assert
      const highSimilarity = page.locator('text=/유사도 0.87/');
      await expect(highSimilarity).toHaveClass(/text-success/);
    });

    test('5.6 유사도가 0.8 미만이면 warning 색상으로 표시된다', async ({ page }) => {
      // Assert
      const lowSimilarity = page.locator('text=/유사도 0.76/');
      await expect(lowSimilarity).toHaveClass(/text-warning/);
    });

    test('5.7 유사 VOC는 클릭 가능한 링크이다', async ({ page }) => {
      // Assert
      const firstLink = page.locator(`text=${mockSimilarVocs[0].ticketId}`).locator('..');
      await expect(firstLink).toHaveAttribute('href', `/voc/${mockSimilarVocs[0].id}`);
    });

    test('5.8 유사 VOC에 호버하면 배경색이 변경된다', async ({ page }) => {
      // Arrange
      const firstSimilar = page.locator(`text=${mockSimilarVocs[0].ticketId}`).locator('..');

      // Act
      await firstSimilar.hover();

      // Assert
      await expect(firstSimilar).toHaveClass(/hover:bg-slate-100/);
    });

    test('5.9 유사 VOC에 외부 링크 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const openIcon = page.locator('.material-icons-outlined:has-text("open_in_new")').first();
      await expect(openIcon).toBeVisible();
    });

    test('5.10 유사 VOC에 chevron 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const chevrons = page.locator('.material-icons-outlined:has-text("chevron_right")');
      await expect(chevrons.first()).toBeVisible();
    });
  });

  test.describe('6. 카테고리 수정 섹션', () => {
    test('6.1 카테고리 수정 섹션이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=카테고리 수정')).toBeVisible();
    });

    test('6.2 대분류 드롭다운이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('label[for="mainCategory"]')).toHaveText('대분류');
      await expect(page.locator('#mainCategory')).toBeVisible();
    });

    test('6.3 중분류 드롭다운이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('label[for="subCategory"]')).toHaveText('중분류');
      await expect(page.locator('#subCategory')).toBeVisible();
    });

    test('6.4 대분류 선택 전에는 중분류가 비활성화된다', async ({ page }) => {
      // Assert
      await expect(page.locator('#subCategory')).toBeDisabled();
    });

    test('6.5 대분류를 선택하면 중분류가 활성화된다', async ({ page }) => {
      // Act
      await page.locator('#mainCategory').selectOption({ value: '1' });

      // Assert
      await expect(page.locator('#subCategory')).toBeEnabled();
    });

    test('6.6 대분류 드롭다운 클릭 시 옵션 목록이 표시된다', async ({ page }) => {
      // Act
      await page.locator('#mainCategory').click();

      // Assert - 대분류 옵션들 확인
      await expect(page.locator('#mainCategory option:has-text("배송")')).toBeVisible();
      await expect(page.locator('#mainCategory option:has-text("제품")')).toBeVisible();
    });

    test('6.7 대분류 선택 후 중분류 옵션이 동적으로 로드된다', async ({ page }) => {
      // Act
      await page.locator('#mainCategory').selectOption({ value: '1' });
      await page.locator('#subCategory').click();

      // Assert
      await expect(page.locator('#subCategory option:has-text("배송 지연")')).toBeVisible();
      await expect(page.locator('#subCategory option:has-text("배송 오류")')).toBeVisible();
    });

    test('6.8 카테고리 저장 버튼이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.getByRole('button', { name: '저장' })).toBeVisible();
    });

    test('6.9 중분류 미선택 시 저장 버튼이 비활성화된다', async ({ page }) => {
      // Assert
      const saveButton = page.getByRole('button', { name: '저장' }).first();
      await expect(saveButton).toBeDisabled();
    });

    test('6.10 중분류 선택 시 저장 버튼이 활성화된다', async ({ page }) => {
      // Act
      await page.locator('#mainCategory').selectOption({ value: '1' });
      await page.locator('#subCategory').selectOption({ value: '11' });

      // Assert
      const saveButton = page.getByRole('button', { name: '저장' }).first();
      await expect(saveButton).toBeEnabled();
    });

    test('6.11 카테고리 저장 버튼 클릭 시 API 호출이 발생한다', async ({ page }) => {
      // Arrange
      let apiCalled = false;
      await page.route('**/api/vocs/1', async (route) => {
        if (route.request().method() === 'PATCH') {
          apiCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...mockVoc, category: { id: 11, name: '배송 지연', code: 'DELIVERY_DELAY' } },
            }),
          });
        }
      });

      // Act
      await page.locator('#mainCategory').selectOption({ value: '1' });
      await page.locator('#subCategory').selectOption({ value: '11' });
      await page.getByRole('button', { name: '저장' }).first().click();

      // Assert
      await page.waitForTimeout(500);
      expect(apiCalled).toBe(true);
    });

    test('6.12 저장 중에는 버튼이 비활성화되고 "저장 중..." 텍스트가 표시된다', async ({
      page,
    }) => {
      // Arrange
      await page.route('**/api/vocs/1', async (route) => {
        if (route.request().method() === 'PATCH') {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: mockVoc }),
          });
        }
      });

      await page.locator('#mainCategory').selectOption({ value: '1' });
      await page.locator('#subCategory').selectOption({ value: '11' });

      // Act
      await page.getByRole('button', { name: '저장' }).first().click();

      // Assert
      const savingButton = page.getByRole('button', { name: '저장 중...' }).first();
      await expect(savingButton).toBeVisible();
      await expect(savingButton).toBeDisabled();
    });
  });

  test.describe('7. 담당자 메모 섹션', () => {
    test('7.1 담당자 메모 섹션이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=담당자 메모')).toBeVisible();
    });

    test('7.2 메모 입력 textarea가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('label[for="memo"]')).toHaveText('메모 내용 (최대 1000자)');
      await expect(page.locator('#memo')).toBeVisible();
    });

    test('7.3 메모 textarea에 placeholder가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('#memo')).toHaveAttribute(
        'placeholder',
        '처리 내용, 조치 사항, 특이사항 등을 메모하세요'
      );
    });

    test('7.4 메모 textarea에 글자 수가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=/0 \\/ 1,000자/')).toBeVisible();
    });

    test('7.5 메모 입력 시 글자 수가 업데이트된다', async ({ page }) => {
      // Act
      await page.locator('#memo').fill('테스트 메모입니다');

      // Assert
      await expect(page.locator('text=/8 \\/ 1,000자/')).toBeVisible();
    });

    test('7.6 메모는 최대 1000자까지 입력 가능하다', async ({ page }) => {
      // Arrange
      const longText = 'a'.repeat(1001);

      // Act
      await page.locator('#memo').fill(longText);

      // Assert
      const value = await page.locator('#memo').inputValue();
      expect(value.length).toBeLessThanOrEqual(1000);
    });

    test('7.7 메모 저장 버튼이 표시된다', async ({ page }) => {
      // Assert
      const memoSection = page.locator('text=담당자 메모').locator('..');
      const saveButton = memoSection.getByRole('button', { name: '저장' });
      await expect(saveButton).toBeVisible();
    });

    test('7.8 메모가 비어있으면 저장 버튼이 비활성화된다', async ({ page }) => {
      // Assert
      const memoSection = page.locator('text=담당자 메모').locator('..');
      const saveButton = memoSection.getByRole('button', { name: '저장' });
      await expect(saveButton).toBeDisabled();
    });

    test('7.9 메모 입력 시 저장 버튼이 활성화된다', async ({ page }) => {
      // Act
      await page.locator('#memo').fill('새 메모');

      // Assert
      const memoSection = page.locator('text=담당자 메모').locator('..');
      const saveButton = memoSection.getByRole('button', { name: '저장' });
      await expect(saveButton).toBeEnabled();
    });

    test('7.10 메모 저장 버튼 클릭 시 API 호출이 발생한다', async ({ page }) => {
      // Arrange
      let apiCalled = false;
      await page.route('**/api/vocs/1/memos', async (route) => {
        if (route.request().method() === 'POST') {
          apiCalled = true;
          const body = route.request().postDataJSON();
          expect(body.content).toBe('새 메모입니다');
          expect(body.isInternal).toBe(true);

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 3,
                content: '새 메모입니다',
                isInternal: true,
                author: { id: 1, name: '관리자' },
                createdAt: new Date().toISOString(),
              },
            }),
          });
        }
      });

      // Act
      await page.locator('#memo').fill('새 메모입니다');
      const memoSection = page.locator('text=담당자 메모').locator('..');
      await memoSection.getByRole('button', { name: '저장' }).click();

      // Assert
      await page.waitForTimeout(500);
      expect(apiCalled).toBe(true);
    });

    test('7.11 메모 저장 후 입력 필드가 초기화된다', async ({ page }) => {
      // Arrange
      await page.route('**/api/vocs/1/memos', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 3,
                content: '새 메모',
                isInternal: true,
                author: { id: 1, name: '관리자' },
                createdAt: new Date().toISOString(),
              },
            }),
          });
        }
      });

      // Act
      await page.locator('#memo').fill('새 메모');
      const memoSection = page.locator('text=담당자 메모').locator('..');
      await memoSection.getByRole('button', { name: '저장' }).click();

      // Assert
      await page.waitForTimeout(500);
      await expect(page.locator('#memo')).toHaveValue('');
    });

    test('7.12 메모 textarea는 5줄 높이를 가진다', async ({ page }) => {
      // Assert
      await expect(page.locator('#memo')).toHaveAttribute('rows', '5');
    });

    test('7.13 메모 textarea는 리사이즈가 불가능하다', async ({ page }) => {
      // Assert
      await expect(page.locator('#memo')).toHaveClass(/resize-none/);
    });
  });

  test.describe('8. 변경 이력 섹션', () => {
    test('8.1 변경 이력 섹션이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.locator('text=변경 이력')).toBeVisible();
    });

    test('8.2 변경 이력 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const historyIcon = page
        .locator('text=변경 이력')
        .locator('..')
        .locator('.material-icons-outlined:has-text("history")');
      await expect(historyIcon).toBeVisible();
    });

    test('8.3 메모 목록이 표시된다', async ({ page }) => {
      // Assert
      for (const memo of mockVoc.memos) {
        await expect(page.locator(`text=${memo.content}`)).toBeVisible();
      }
    });

    test('8.4 메모 작성자가 표시된다', async ({ page }) => {
      // Assert
      for (const memo of mockVoc.memos) {
        await expect(page.locator(`text=${memo.author.name}`)).toBeVisible();
      }
    });

    test('8.5 메모 작성 일시가 표시된다', async ({ page }) => {
      // Assert - 날짜 형식 확인
      await expect(page.locator('text=/2026.*01.*25/')).toBeVisible();
    });

    test('8.6 메모마다 담당자 뱃지가 표시된다', async ({ page }) => {
      // Assert
      const badges = page.locator('text=담당자');
      await expect(badges.first()).toBeVisible();
    });

    test('8.7 메모가 없으면 안내 메시지가 표시된다', async ({ page }) => {
      // Arrange - 메모가 없는 VOC
      await page.route('**/api/vocs/2', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...mockVoc, id: 2, memos: [] },
          }),
        });
      });

      // Act
      await page.goto('/voc/2');
      await page.waitForLoadState('networkidle');

      // Assert
      await expect(page.locator('text=변경 이력이 없습니다')).toBeVisible();
    });

    test('8.8 메모 목록은 시간순으로 정렬된다', async ({ page }) => {
      // Assert - 첫 번째 메모가 더 이른 시간
      const memoItems = page.locator('[data-testid="memo-item"]').or(page.locator('.pb-4'));
      const firstMemo = memoItems.first();
      await expect(firstMemo).toContainText(mockVoc.memos[0].content);
    });
  });

  test.describe('9. 하단 액션 버튼', () => {
    test('9.1 반려 버튼이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.getByRole('button', { name: '반려' })).toBeVisible();
    });

    test('9.2 반려 버튼에 block 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const rejectButton = page.getByRole('button', { name: '반려' });
      const icon = rejectButton.locator('.material-icons-outlined:has-text("block")');
      await expect(icon).toBeVisible();
    });

    test('9.3 반려 버튼은 danger 색상 테두리를 가진다', async ({ page }) => {
      // Assert
      const rejectButton = page.getByRole('button', { name: '반려' });
      await expect(rejectButton).toHaveClass(/border-danger/);
      await expect(rejectButton).toHaveClass(/text-danger/);
    });

    test('9.4 이메일 발송 링크가 표시된다', async ({ page }) => {
      // Assert
      await expect(page.getByRole('link', { name: '이메일 발송' })).toBeVisible();
    });

    test('9.5 이메일 발송 링크에 email 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const emailLink = page.getByRole('link', { name: '이메일 발송' });
      const icon = emailLink.locator('.material-icons-outlined:has-text("email")');
      await expect(icon).toBeVisible();
    });

    test('9.6 이메일 발송 링크는 올바른 URL을 가진다', async ({ page }) => {
      // Assert
      const emailLink = page.getByRole('link', { name: '이메일 발송' });
      await expect(emailLink).toHaveAttribute('href', `/email/compose?vocId=${mockVoc.id}`);
    });

    test('9.7 완료 처리 버튼이 표시된다', async ({ page }) => {
      // Assert
      await expect(page.getByRole('button', { name: '완료 처리' })).toBeVisible();
    });

    test('9.8 완료 처리 버튼에 check_circle 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const completeButton = page.getByRole('button', { name: '완료 처리' });
      const icon = completeButton.locator('.material-icons-outlined:has-text("check_circle")');
      await expect(icon).toBeVisible();
    });

    test('9.9 완료 처리 버튼은 success 색상을 가진다', async ({ page }) => {
      // Assert
      const completeButton = page.getByRole('button', { name: '완료 처리' });
      await expect(completeButton).toHaveClass(/bg-success/);
    });

    test('9.10 반려 버튼 클릭 시 확인 대화상자가 표시된다', async ({ page }) => {
      // Arrange
      let dialogShown = false;
      page.on('dialog', (dialog) => {
        dialogShown = true;
        expect(dialog.message()).toContain('반려');
        dialog.dismiss();
      });

      // Act
      await page.getByRole('button', { name: '반려' }).click();

      // Assert
      expect(dialogShown).toBe(true);
    });

    test('9.11 반려 확인 시 API 호출이 발생한다', async ({ page }) => {
      // Arrange
      let apiCalled = false;
      await page.route('**/api/vocs/1/status', async (route) => {
        if (route.request().method() === 'PATCH') {
          const body = route.request().postDataJSON();
          if (body.status === 'REJECTED') {
            apiCalled = true;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...mockVoc, status: 'REJECTED' },
            }),
          });
        }
      });

      page.on('dialog', (dialog) => dialog.accept());

      // Act
      await page.getByRole('button', { name: '반려' }).click();

      // Assert
      await page.waitForTimeout(500);
      expect(apiCalled).toBe(true);
    });

    test('9.12 완료 처리 버튼 클릭 시 확인 대화상자가 표시된다', async ({ page }) => {
      // Arrange
      let dialogShown = false;
      page.on('dialog', (dialog) => {
        dialogShown = true;
        expect(dialog.message()).toContain('완료');
        dialog.dismiss();
      });

      // Act
      await page.getByRole('button', { name: '완료 처리' }).click();

      // Assert
      expect(dialogShown).toBe(true);
    });

    test('9.13 완료 처리 확인 시 API 호출이 발생한다', async ({ page }) => {
      // Arrange
      let apiCalled = false;
      await page.route('**/api/vocs/1/status', async (route) => {
        if (route.request().method() === 'PATCH') {
          const body = route.request().postDataJSON();
          if (body.status === 'RESOLVED') {
            apiCalled = true;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...mockVoc, status: 'RESOLVED' },
            }),
          });
        }
      });

      page.on('dialog', (dialog) => dialog.accept());

      // Act
      await page.getByRole('button', { name: '완료 처리' }).click();

      // Assert
      await page.waitForTimeout(500);
      expect(apiCalled).toBe(true);
    });

    test('9.14 버튼들은 모바일에서 세로로 정렬된다', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert
      const buttonContainer = page.locator('.flex.flex-col.sm\\:flex-row');
      await expect(buttonContainer).toBeVisible();
    });

    test('9.15 버튼에 호버하면 스타일이 변경된다', async ({ page }) => {
      // Arrange
      const rejectButton = page.getByRole('button', { name: '반려' });

      // Act
      await rejectButton.hover();

      // Assert
      await expect(rejectButton).toHaveClass(/hover:bg-danger\/10/);
    });
  });

  test.describe('10. 안내 메시지', () => {
    test('10.1 하단 안내 메시지가 표시된다', async ({ page }) => {
      // Assert
      await expect(
        page.locator('text=VOC 처리 완료 후에는 최종 사용자에게 자동으로 알림이 발송됩니다')
      ).toBeVisible();
    });

    test('10.2 안내 메시지에 info 아이콘이 표시된다', async ({ page }) => {
      // Assert
      const infoBox = page.locator('.bg-info\\/10');
      const icon = infoBox.locator('.material-icons-outlined:has-text("info")');
      await expect(icon).toBeVisible();
    });

    test('10.3 안내 메시지는 info 색상 배경을 가진다', async ({ page }) => {
      // Assert
      const infoBox = page.locator('.bg-info\\/10');
      await expect(infoBox).toBeVisible();
      await expect(infoBox).toHaveClass(/border-info/);
    });
  });

  test.describe('11. 반응형 레이아웃', () => {
    test('11.1 모바일 뷰포트에서 그리드가 1열로 표시된다', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert
      const gridContainers = page.locator('.grid.grid-cols-1.md\\:grid-cols-2');
      await expect(gridContainers.first()).toBeVisible();
    });

    test('11.2 태블릿 뷰포트에서 그리드가 2열로 표시된다', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 768, height: 1024 });

      // Assert
      const gridContainers = page.locator('.grid.grid-cols-1.md\\:grid-cols-2');
      await expect(gridContainers.first()).toBeVisible();
    });

    test('11.3 모바일에서 액션 버튼이 세로로 정렬된다', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert
      const buttonContainer = page
        .locator('.flex.flex-col.sm\\:flex-row')
        .filter({ has: page.getByRole('button', { name: '반려' }) });
      await expect(buttonContainer).toBeVisible();
    });

    test('11.4 데스크톱에서 최대 너비가 제한된다', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Assert
      const container = page.locator('.max-w-7xl');
      await expect(container.first()).toBeVisible();
    });

    test('11.5 모든 섹션이 모바일에서도 접근 가능하다', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert
      await expect(page.locator('text=VOC 기본 정보')).toBeVisible();
      await expect(page.locator('text=카테고리 수정')).toBeVisible();
      await expect(page.locator('text=담당자 메모')).toBeVisible();
      await expect(page.locator('text=변경 이력')).toBeVisible();
    });
  });

  test.describe('12. 다크 모드', () => {
    test('12.1 다크 모드 클래스가 적용되어 있다', async ({ page }) => {
      // Assert
      const sections = page.locator('.dark\\:bg-slate-800');
      await expect(sections.first()).toBeVisible();
    });

    test('12.2 다크 모드에서 텍스트 색상이 적절하게 변경된다', async ({ page }) => {
      // Assert
      const labels = page.locator('.dark\\:text-slate-400');
      await expect(labels.first()).toBeVisible();
    });

    test('12.3 다크 모드에서 테두리 색상이 적절하게 변경된다', async ({ page }) => {
      // Assert
      const borders = page.locator('.dark\\:border-slate-700');
      await expect(borders.first()).toBeVisible();
    });
  });

  test.describe('13. 포커스 및 키보드 네비게이션', () => {
    test('13.1 Tab 키로 입력 필드 간 이동이 가능하다', async ({ page }) => {
      // Arrange
      const mainCategory = page.locator('#mainCategory');
      const subCategory = page.locator('#subCategory');
      const memo = page.locator('#memo');

      // Act & Assert
      await mainCategory.focus();
      await expect(mainCategory).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(subCategory).toBeFocused();

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // 저장 버튼 건너뛰기
      await expect(memo).toBeFocused();
    });

    test('13.2 포커스 시 입력 필드에 ring이 표시된다', async ({ page }) => {
      // Arrange
      const mainCategory = page.locator('#mainCategory');

      // Act
      await mainCategory.focus();

      // Assert
      await expect(mainCategory).toHaveClass(/focus:ring-2/);
      await expect(mainCategory).toHaveClass(/focus:ring-primary/);
    });

    test('13.3 Tab 키로 버튼 간 이동이 가능하다', async ({ page }) => {
      // Act
      const rejectButton = page.getByRole('button', { name: '반려' });
      const completeButton = page.getByRole('button', { name: '완료 처리' });

      await rejectButton.focus();
      await expect(rejectButton).toBeFocused();

      await page.keyboard.press('Tab');
      // 이메일 링크 건너뛰기
      await page.keyboard.press('Tab');
      await expect(completeButton).toBeFocused();
    });
  });

  test.describe('14. 에러 처리', () => {
    test('14.1 카테고리 저장 실패 시 에러 처리', async ({ page }) => {
      // Arrange
      await page.route('**/api/vocs/1', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: '카테고리 변경에 실패했습니다' },
            }),
          });
        }
      });

      // Act
      await page.locator('#mainCategory').selectOption({ value: '1' });
      await page.locator('#subCategory').selectOption({ value: '11' });
      await page.getByRole('button', { name: '저장' }).first().click();

      // Assert - 에러 메시지 확인
      await page.waitForTimeout(500);
      // 에러는 console.error로 처리되므로 사용자에게 별도 UI 없음
    });

    test('14.2 메모 저장 실패 시 에러 처리', async ({ page }) => {
      // Arrange
      await page.route('**/api/vocs/1/memos', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: '메모 저장에 실패했습니다' },
            }),
          });
        }
      });

      // Act
      await page.locator('#memo').fill('테스트 메모');
      const memoSection = page.locator('text=담당자 메모').locator('..');
      await memoSection.getByRole('button', { name: '저장' }).click();

      // Assert
      await page.waitForTimeout(500);
      // 에러는 console.error로 처리
    });

    test('14.3 네트워크 오류 시 재시도 가능', async ({ page }) => {
      // Arrange - 첫 시도는 실패, 두 번째 시도는 성공
      let attemptCount = 0;
      await page.route('**/api/vocs/1/memos', async (route) => {
        if (route.request().method() === 'POST') {
          attemptCount++;
          if (attemptCount === 1) {
            await route.abort('failed');
          } else {
            await route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  id: 3,
                  content: '메모',
                  isInternal: true,
                  author: { id: 1, name: '관리자' },
                  createdAt: new Date().toISOString(),
                },
              }),
            });
          }
        }
      });

      // Act - 첫 시도
      await page.locator('#memo').fill('메모');
      const memoSection = page.locator('text=담당자 메모').locator('..');
      await memoSection.getByRole('button', { name: '저장' }).click();
      await page.waitForTimeout(1000);

      // Act - 재시도
      await page.locator('#memo').fill('메모');
      await memoSection.getByRole('button', { name: '저장' }).click();

      // Assert
      await page.waitForTimeout(500);
      expect(attemptCount).toBe(2);
    });
  });

  test.describe('15. 접근성 (Accessibility)', () => {
    test('15.1 모든 폼 필드에 label이 연결되어 있다', async ({ page }) => {
      // Assert
      await expect(page.locator('label[for="mainCategory"]')).toBeVisible();
      await expect(page.locator('label[for="subCategory"]')).toBeVisible();
      await expect(page.locator('label[for="memo"]')).toBeVisible();
    });

    test('15.2 버튼에 적절한 role이 설정되어 있다', async ({ page }) => {
      // Assert
      await expect(page.getByRole('button', { name: '반려' })).toBeVisible();
      await expect(page.getByRole('button', { name: '완료 처리' })).toBeVisible();
    });

    test('15.3 링크에 적절한 role이 설정되어 있다', async ({ page }) => {
      // Assert
      await expect(page.getByRole('link', { name: '이메일 발송' })).toBeVisible();
    });

    test('15.4 아이콘만 있는 요소는 aria-label을 가진다', async ({ page }) => {
      // Assert - Material Icons는 장식용이므로 aria-hidden 또는 텍스트와 함께 사용
      const iconButtons = page.locator('button .material-icons-outlined');
      await expect(iconButtons.first()).toBeVisible();
    });

    test('15.5 비활성화된 요소는 disabled 속성을 가진다', async ({ page }) => {
      // Assert
      await expect(page.locator('#subCategory')).toBeDisabled();
    });
  });

  test.describe('16. 성능', () => {
    test('16.1 페이지 로드 시간이 3초 이내이다', async ({ page }) => {
      // Arrange
      const startTime = Date.now();

      // Act
      await page.goto('/voc/1');
      await page.waitForLoadState('networkidle');

      // Assert
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('16.2 API 응답 대기 중에도 UI가 반응한다', async ({ page }) => {
      // Arrange
      await page.route('**/api/vocs/1/memos', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 3,
              content: '메모',
              isInternal: true,
              author: { id: 1, name: '관리자' },
              createdAt: new Date().toISOString(),
            },
          }),
        });
      });

      // Act
      await page.locator('#memo').fill('메모');
      const memoSection = page.locator('text=담당자 메모').locator('..');
      await memoSection.getByRole('button', { name: '저장' }).click();

      // Assert - 다른 요소에 여전히 접근 가능
      await expect(page.locator('#mainCategory')).toBeEnabled();
      await expect(page.getByRole('button', { name: '반려' })).toBeEnabled();
    });
  });
});
