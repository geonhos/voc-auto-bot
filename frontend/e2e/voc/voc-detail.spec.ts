/**
 * @see ./detailed/voc/voc-detail.detailed.spec.ts for detailed UI interaction tests
 */

import { test, expect } from '@playwright/test';
import { VocDetailPage } from '../page-objects';
import { testVocs, testAssignees } from '../fixtures';

/**
 * @description E2E tests for VOC Detail page (SC-06)
 * Tests detail display, memo management, status change, and assignee assignment
 */

test.describe('VOC Detail Page', () => {
  let vocDetailPage: VocDetailPage;

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

    vocDetailPage = new VocDetailPage(page);
  });

  test.describe('Detail Information Display', () => {
    test('should display VOC details correctly', async ({ page }) => {
      // Mock VOC detail API
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      const ticketId = await vocDetailPage.getTicketId();
      expect(ticketId).toContain(testVocs[0].ticketId);

      const title = await vocDetailPage.getTitle();
      expect(title).toContain(testVocs[0].title);
    });

    test('should display status badge', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await expect(vocDetailPage.statusBadge).toBeVisible();
    });

    test('should display priority badge', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await expect(vocDetailPage.priorityBadge).toBeVisible();
    });

    test('should display customer information', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.verifyCustomerInfo({
        name: testVocs[0].customerName,
        email: testVocs[0].customerEmail,
        phone: testVocs[0].customerPhone,
      });
    });

    test('should display category', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      if (testVocs[0].category) {
        await vocDetailPage.verifyCategory(testVocs[0].category.name);
      }
    });

    test('should display content', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.verifyContent(testVocs[0].content);
    });
  });

  test.describe('Status Change', () => {
    test('should change VOC status', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      // Mock status change API
      await page.route(`**/api/vocs/${testVocs[0].id}/status`, async (route) => {
        if (route.request().method() === 'PATCH') {
          const requestBody = route.request().postDataJSON();
          expect(requestBody.status).toBe('ASSIGNED');

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...testVocs[0], status: 'ASSIGNED' },
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.changeStatus('ASSIGNED');
      await vocDetailPage.verifyStatusChanged('ASSIGNED');
    });

    test('should change status with processing note', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      // Mock status change API
      await page.route(`**/api/vocs/${testVocs[0].id}/status`, async (route) => {
        if (route.request().method() === 'PATCH') {
          const requestBody = route.request().postDataJSON();
          expect(requestBody.status).toBe('IN_PROGRESS');
          expect(requestBody.processingNote).toBe('담당자가 처리 중입니다');

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ...testVocs[0],
                status: 'IN_PROGRESS',
                processingNote: '담당자가 처리 중입니다',
              },
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.changeStatus('IN_PROGRESS', '담당자가 처리 중입니다');
      await vocDetailPage.verifyStatusChanged('IN_PROGRESS');
    });

    test('should handle status change error', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      // Mock API error
      await page.route(`**/api/vocs/${testVocs[0].id}/status`, async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: '상태 변경에 실패했습니다' },
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.changeStatus('ASSIGNED');

      // Verify error message appears
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible();
    });
  });

  test.describe('Assignee Management', () => {
    test('should assign VOC to user', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      // Mock assign API
      await page.route(`**/api/vocs/${testVocs[0].id}/assign`, async (route) => {
        if (route.request().method() === 'PATCH') {
          const requestBody = route.request().postDataJSON();
          expect(requestBody.assigneeId).toBe(testAssignees[0].id);

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...testVocs[0], assignee: testAssignees[0] },
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.assignToUser(testAssignees[0].id.toString());
      await vocDetailPage.verifyAssignee(testAssignees[0].name);
    });

    test('should display current assignee', async ({ page }) => {
      const vocWithAssignee = testVocs[1]; // Has assignee

      await page.route(`**/api/vocs/${vocWithAssignee.id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: vocWithAssignee,
            }),
          });
        }
      });

      await vocDetailPage.goto(vocWithAssignee.id);
      await vocDetailPage.waitForLoad();

      if (vocWithAssignee.assignee) {
        await vocDetailPage.verifyAssignee(vocWithAssignee.assignee.name);
      }
    });
  });

  test.describe('Memo Management', () => {
    test('should add a new memo', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      // Mock add memo API
      await page.route(`**/api/vocs/${testVocs[0].id}/memos`, async (route) => {
        if (route.request().method() === 'POST') {
          const requestBody = route.request().postDataJSON();
          expect(requestBody.content).toBe('새로운 메모입니다');

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 10,
                content: '새로운 메모입니다',
                isInternal: false,
                author: { id: 1, name: '관리자' },
                createdAt: new Date().toISOString(),
              },
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      const initialCount = await vocDetailPage.getMemoCount();
      await vocDetailPage.addMemo('새로운 메모입니다');

      await page.waitForTimeout(500);
      const newCount = await vocDetailPage.getMemoCount();
      expect(newCount).toBe(initialCount + 1);
    });

    test('should add internal memo', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      // Mock add memo API
      await page.route(`**/api/vocs/${testVocs[0].id}/memos`, async (route) => {
        if (route.request().method() === 'POST') {
          const requestBody = route.request().postDataJSON();
          expect(requestBody.isInternal).toBe(true);

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 11,
                content: '내부 메모입니다',
                isInternal: true,
                author: { id: 1, name: '관리자' },
                createdAt: new Date().toISOString(),
              },
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.addMemo('내부 메모입니다', true);

      await page.waitForTimeout(500);
      await vocDetailPage.verifyMemoExists('내부 메모입니다');
    });

    test('should delete a memo', async ({ page }) => {
      const vocWithMemos = testVocs[1]; // Has memos

      await page.route(`**/api/vocs/${vocWithMemos.id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: vocWithMemos,
            }),
          });
        }
      });

      // Mock delete memo API
      const memoId = vocWithMemos.memos[0].id;
      await page.route(`**/api/vocs/${vocWithMemos.id}/memos/${memoId}`, async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 204,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      });

      await vocDetailPage.goto(vocWithMemos.id);
      await vocDetailPage.waitForLoad();

      const initialCount = await vocDetailPage.getMemoCount();
      await vocDetailPage.deleteMemo(0);

      await page.waitForTimeout(500);
      const newCount = await vocDetailPage.getMemoCount();
      expect(newCount).toBe(initialCount - 1);
    });

    test('should display existing memos', async ({ page }) => {
      const vocWithMemos = testVocs[1]; // Has memos

      await page.route(`**/api/vocs/${vocWithMemos.id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: vocWithMemos,
            }),
          });
        }
      });

      await vocDetailPage.goto(vocWithMemos.id);
      await vocDetailPage.waitForLoad();

      const memoCount = await vocDetailPage.getMemoCount();
      expect(memoCount).toBe(vocWithMemos.memos.length);

      if (vocWithMemos.memos.length > 0) {
        await vocDetailPage.verifyMemoExists(vocWithMemos.memos[0].content);
      }
    });
  });

  test.describe('Attachments', () => {
    test('should display attachments list', async ({ page }) => {
      const vocWithAttachments = {
        ...testVocs[0],
        attachments: [
          {
            id: 1,
            originalFileName: 'document.pdf',
            storedFileName: 'stored-123.pdf',
            fileSize: 1024 * 500,
            mimeType: 'application/pdf',
            downloadUrl: '/api/files/download/123',
            createdAt: '2026-01-25T10:00:00Z',
          },
        ],
      };

      await page.route(`**/api/vocs/${vocWithAttachments.id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: vocWithAttachments,
            }),
          });
        }
      });

      await vocDetailPage.goto(vocWithAttachments.id);
      await vocDetailPage.waitForLoad();

      const attachmentCount = await vocDetailPage.getAttachmentCount();
      expect(attachmentCount).toBe(1);
    });

    test('should download attachment', async ({ page }) => {
      const vocWithAttachments = {
        ...testVocs[0],
        attachments: [
          {
            id: 1,
            originalFileName: 'document.pdf',
            storedFileName: 'stored-123.pdf',
            fileSize: 1024 * 500,
            mimeType: 'application/pdf',
            downloadUrl: '/api/files/download/123',
            createdAt: '2026-01-25T10:00:00Z',
          },
        ],
      };

      await page.route(`**/api/vocs/${vocWithAttachments.id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: vocWithAttachments,
            }),
          });
        }
      });

      // Mock download endpoint
      await page.route('**/api/files/download/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          body: Buffer.from('Mock PDF content'),
        });
      });

      await vocDetailPage.goto(vocWithAttachments.id);
      await vocDetailPage.waitForLoad();

      const download = await vocDetailPage.downloadAttachment(0);
      expect(download).toBeTruthy();
    });
  });

  test.describe('Similar VOC', () => {
    test('should open similar VOC modal', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[0],
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();

      // Verify modal opens
      const modal = page.getByRole('dialog', { name: /유사 VOC/i });
      await expect(modal).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 error', async ({ page }) => {
      await page.route('**/api/vocs/999', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: 'VOC를 찾을 수 없습니다' },
            }),
          });
        }
      });

      await vocDetailPage.goto(999);

      // Verify error message is displayed
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
    });

    test('should handle server error', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: '서버 오류가 발생했습니다' },
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);

      // Verify error message is displayed
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
    });
  });
});
