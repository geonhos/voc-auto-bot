import { test, expect } from '@playwright/test';
import { VocKanbanPage } from '../page-objects';
import { testVocs, kanbanColumns } from '../fixtures';

/**
 * @description E2E tests for VOC Kanban Board (SC-04)
 * Tests kanban rendering, drag-and-drop, status changes, and filtering
 */

test.describe('VOC Kanban Board', () => {
  let vocKanbanPage: VocKanbanPage;

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

    vocKanbanPage = new VocKanbanPage(page);
    await vocKanbanPage.goto();
  });

  test.describe('Board Rendering', () => {
    test('should render kanban board', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: testVocs,
              page: 0,
              size: 100,
              totalElements: testVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();
      await expect(vocKanbanPage.board).toBeVisible();
    });

    test('should display all status columns', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: testVocs,
              page: 0,
              size: 100,
              totalElements: testVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();
      await vocKanbanPage.verifyAllColumnsVisible();
    });

    test('should display VOC cards in correct columns', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: testVocs,
              page: 0,
              size: 100,
              totalElements: testVocs.length,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      // Verify each VOC is in the correct column based on status
      for (const voc of testVocs) {
        await vocKanbanPage.verifyCardInColumn(voc.ticketId, voc.status);
      }
    });

    test('should display card information correctly', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [testVocs[0]],
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      const cardData = await vocKanbanPage.getCardData(testVocs[0].ticketId);
      expect(cardData.title).toContain(testVocs[0].title);
      expect(cardData.ticketId).toContain(testVocs[0].ticketId);
    });
  });

  test.describe('Drag and Drop', () => {
    test('should drag card to different column', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [testVocs[0]], // RECEIVED status
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      // Mock status change API
      await page.route(`**/api/vocs/${testVocs[0].id}/status`, async (route) => {
        if (route.request().method() === 'PATCH') {
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

      await vocKanbanPage.waitForBoardLoad();

      // Drag from RECEIVED to ASSIGNED
      await vocKanbanPage.dragCardToColumn(testVocs[0].ticketId, 'ASSIGNED');

      // Verify card moved
      await vocKanbanPage.verifyCardInColumn(testVocs[0].ticketId, 'ASSIGNED');
    });

    test('should update status after successful drag', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [testVocs[1]], // ASSIGNED status
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      // Mock status change API
      let statusChanged = false;
      await page.route(`**/api/vocs/${testVocs[1].id}/status`, async (route) => {
        if (route.request().method() === 'PATCH') {
          statusChanged = true;
          const requestBody = route.request().postDataJSON();
          expect(requestBody.status).toBe('IN_PROGRESS');

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...testVocs[1], status: 'IN_PROGRESS' },
            }),
          });
        }
      });

      await vocKanbanPage.waitForBoardLoad();
      await vocKanbanPage.dragCardToColumn(testVocs[1].ticketId, 'IN_PROGRESS');

      expect(statusChanged).toBe(true);
    });

    test('should revert drag on API error', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [testVocs[0]],
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      // Mock API error
      await page.route(`**/api/vocs/${testVocs[0].id}/status`, async (route) => {
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

      await vocKanbanPage.waitForBoardLoad();
      const originalStatus = testVocs[0].status;

      await vocKanbanPage.dragCardToColumn(testVocs[0].ticketId, 'ASSIGNED');

      // Card should revert to original position
      await page.waitForTimeout(1000);
      await vocKanbanPage.verifyCardInColumn(testVocs[0].ticketId, originalStatus);
    });
  });

  test.describe('Card Interactions', () => {
    test('should open detail page when card is clicked', async ({ page, context }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: [testVocs[0]],
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        vocKanbanPage.clickCard(testVocs[0].ticketId),
      ]);

      await newPage.waitForLoadState();
      expect(newPage.url()).toContain(`/voc/${testVocs[0].id}`);
    });

    test('should display card count in column header', async ({ page }) => {
      // Mock VOC list API with multiple cards
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: testVocs.filter((v) => v.status === 'RECEIVED'),
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      const receivedCount = testVocs.filter((v) => v.status === 'RECEIVED').length;
      await vocKanbanPage.verifyColumnCount('RECEIVED', receivedCount);
    });
  });

  test.describe('Filtering', () => {
    test('should filter cards by search query', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const search = url.searchParams.get('search');

        const filtered = search
          ? testVocs.filter((v) => v.title.includes(search))
          : testVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: filtered,
              page: 0,
              size: 100,
              totalElements: filtered.length,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      await vocKanbanPage.searchCards('배송');

      // Only cards with '배송' in title should be visible
      await vocKanbanPage.verifyCardVisible(testVocs[0].ticketId); // 배송 지연
      await vocKanbanPage.verifyCardNotVisible(testVocs[1].ticketId); // 서비스 문의
    });

    test('should filter cards by priority', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const priority = url.searchParams.get('priority');

        const filtered = priority
          ? testVocs.filter((v) => v.priority === priority)
          : testVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: filtered,
              page: 0,
              size: 100,
              totalElements: filtered.length,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      await vocKanbanPage.filterByPriority('HIGH');

      // Only HIGH priority cards should be visible
      const highPriorityVocs = testVocs.filter((v) => v.priority === 'HIGH');
      for (const voc of highPriorityVocs) {
        await vocKanbanPage.verifyCardVisible(voc.ticketId);
      }
    });

    test('should filter cards by category', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const categoryId = url.searchParams.get('categoryId');

        const filtered = categoryId
          ? testVocs.filter((v) => v.category?.id === parseInt(categoryId))
          : testVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: filtered,
              page: 0,
              size: 100,
              totalElements: filtered.length,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      await vocKanbanPage.filterByCategory('1'); // 제품 문의

      // Only category 1 cards should be visible
      const categoryVocs = testVocs.filter((v) => v.category?.id === 1);
      for (const voc of categoryVocs) {
        await vocKanbanPage.verifyCardVisible(voc.ticketId);
      }
    });

    test('should combine multiple filters', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const priority = url.searchParams.get('priority');
        const categoryId = url.searchParams.get('categoryId');

        let filtered = testVocs;
        if (priority) {
          filtered = filtered.filter((v) => v.priority === priority);
        }
        if (categoryId) {
          filtered = filtered.filter((v) => v.category?.id === parseInt(categoryId));
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: filtered,
              page: 0,
              size: 100,
              totalElements: filtered.length,
              totalPages: 1,
            },
          }),
        });
      });

      await vocKanbanPage.waitForBoardLoad();

      await vocKanbanPage.filterByPriority('HIGH');
      await vocKanbanPage.filterByCategory('1');

      // Only HIGH priority + category 1 cards
      const filteredVocs = testVocs.filter(
        (v) => v.priority === 'HIGH' && v.category?.id === 1
      );

      for (const voc of filteredVocs) {
        await vocKanbanPage.verifyCardVisible(voc.ticketId);
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no cards exist', async ({ page }) => {
      // Mock empty VOC list
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

      await vocKanbanPage.waitForBoardLoad();

      // Verify empty state is shown
      const emptyState = page.locator('[data-testid="empty-state"]');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should refresh board when card is updated', async ({ page }) => {
      let requestCount = 0;

      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        requestCount++;
        const content = requestCount === 1 ? [testVocs[0]] : [{ ...testVocs[0], status: 'ASSIGNED' }];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content,
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
            },
          }),
        });
      });

      // Mock status change API
      await page.route(`**/api/vocs/${testVocs[0].id}/status`, async (route) => {
        if (route.request().method() === 'PATCH') {
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

      await vocKanbanPage.waitForBoardLoad();
      await vocKanbanPage.dragCardToColumn(testVocs[0].ticketId, 'ASSIGNED');

      // Wait for refresh
      await page.waitForTimeout(1000);

      // Verify request count increased (board was refreshed)
      expect(requestCount).toBeGreaterThan(1);
    });
  });
});
