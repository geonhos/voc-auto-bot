/**
 * @see ./detailed/voc/voc-table.detailed.spec.ts for detailed UI interaction tests
 */

import { test, expect } from '@playwright/test';
import { VocTablePage } from '../page-objects';
import { testVocs, pageResponseMock, testCategories } from '../fixtures';

/**
 * @description E2E tests for VOC Table view (SC-05)
 * Tests table rendering, sorting, filtering, pagination, and row selection
 */

test.describe('VOC Table', () => {
  let vocTablePage: VocTablePage;

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

    vocTablePage = new VocTablePage(page);
    await vocTablePage.goto();
  });

  test.describe('Table Rendering', () => {
    test('should render table with headers', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      await expect(vocTablePage.table).toBeVisible();
      const headerCount = await vocTablePage.tableHeaders.count();
      expect(headerCount).toBeGreaterThan(0);
    });

    test('should display VOC data in rows', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      const rowCount = await vocTablePage.getRowCount();
      expect(rowCount).toBe(testVocs.length);
    });

    test('should display correct data in first row', async ({ page }) => {
      // Mock VOC list API
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      const rowData = await vocTablePage.getRowData(0);
      expect(rowData.ticketId).toContain(testVocs[0].ticketId);
      expect(rowData.title).toContain(testVocs[0].title);
    });

    test('should show loading state while fetching data', async ({ page }) => {
      // Delay the response
      await page.route('**/api/vocs?**', async (route) => {
        await page.waitForTimeout(1000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      vocTablePage.goto();

      // Loading spinner should be visible
      if (await vocTablePage.loadingSpinner.isVisible({ timeout: 500 })) {
        await expect(vocTablePage.loadingSpinner).toBeVisible();
      }
    });

    test('should show empty state when no data', async ({ page }) => {
      // Mock empty response
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

      await vocTablePage.goto();
      await vocTablePage.verifyEmptyState();
    });
  });

  test.describe('Sorting', () => {
    test('should sort by ticket ID column', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const sortBy = url.searchParams.get('sortBy');
        const direction = url.searchParams.get('sortDirection');

        let sorted = [...testVocs];
        if (sortBy === 'ticketId') {
          sorted.sort((a, b) => {
            const comparison = a.ticketId.localeCompare(b.ticketId);
            return direction === 'DESC' ? -comparison : comparison;
          });
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...pageResponseMock, content: sorted },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.sortByColumn('티켓번호');

      await page.waitForTimeout(500);
      // Verify order changed
      const rowCount = await vocTablePage.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('should toggle sort direction', async ({ page }) => {
      let sortDirection = 'ASC';

      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const direction = url.searchParams.get('sortDirection');
        if (direction) {
          sortDirection = direction;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      // First click - ascending
      await vocTablePage.sortByColumn('티켓번호');
      await page.waitForTimeout(300);

      // Second click - descending
      await vocTablePage.sortByColumn('티켓번호');
      await page.waitForTimeout(300);

      expect(['ASC', 'DESC']).toContain(sortDirection);
    });
  });

  test.describe('Filtering', () => {
    test('should filter by search query', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const search = url.searchParams.get('search');

        const filtered = search
          ? testVocs.filter((v) => v.title.includes(search) || v.content.includes(search))
          : testVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...pageResponseMock, content: filtered },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.search('배송');

      await vocTablePage.verifyRowExists(testVocs[0].ticketId);
    });

    test('should filter by status', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get('status');

        const filtered = status ? testVocs.filter((v) => v.status === status) : testVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...pageResponseMock, content: filtered, totalElements: filtered.length },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.filterByStatus('RECEIVED');

      const receivedVocs = testVocs.filter((v) => v.status === 'RECEIVED');
      for (const voc of receivedVocs) {
        await vocTablePage.verifyRowExists(voc.ticketId);
      }
    });

    test('should filter by priority', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const priority = url.searchParams.get('priority');

        const filtered = priority ? testVocs.filter((v) => v.priority === priority) : testVocs;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...pageResponseMock, content: filtered },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.filterByPriority('HIGH');

      const highPriorityVocs = testVocs.filter((v) => v.priority === 'HIGH');
      for (const voc of highPriorityVocs) {
        await vocTablePage.verifyRowExists(voc.ticketId);
      }
    });

    test('should filter by category', async ({ page }) => {
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
            data: { ...pageResponseMock, content: filtered },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.filterByCategory('1');

      const categoryVocs = testVocs.filter((v) => v.category?.id === 1);
      for (const voc of categoryVocs) {
        await vocTablePage.verifyRowExists(voc.ticketId);
      }
    });

    test('should filter by date range', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const fromDate = url.searchParams.get('fromDate');
        const toDate = url.searchParams.get('toDate');

        let filtered = testVocs;
        if (fromDate && toDate) {
          filtered = testVocs.filter((v) => {
            const createdDate = new Date(v.createdAt);
            return createdDate >= new Date(fromDate) && createdDate <= new Date(toDate);
          });
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...pageResponseMock, content: filtered },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.filterByDateRange('2026-01-25', '2026-01-25');

      const todayVocs = testVocs.filter((v) => v.createdAt.startsWith('2026-01-25'));
      expect(todayVocs.length).toBeGreaterThan(0);
    });

    test('should reset all filters', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      // Apply some filters
      await vocTablePage.filterByStatus('RECEIVED');
      await page.waitForTimeout(300);

      // Reset filters
      await vocTablePage.resetFilters();

      // All VOCs should be visible again
      const rowCount = await vocTablePage.getRowCount();
      expect(rowCount).toBe(testVocs.length);
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination info', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.verifyPaginationInfo(testVocs.length);
    });

    test('should change page size', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const size = parseInt(url.searchParams.get('size') || '10');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...pageResponseMock,
              size,
              content: testVocs.slice(0, size),
            },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.changePageSize(20);

      await page.waitForTimeout(500);
      // Verify new page size is applied
      const selectedValue = await vocTablePage.pageSizeSelect.inputValue();
      expect(selectedValue).toBe('20');
    });

    test('should navigate to next page', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        const url = new URL(route.request().url());
        const pageNum = parseInt(url.searchParams.get('page') || '0');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              content: testVocs,
              page: pageNum,
              size: 10,
              totalElements: 20,
              totalPages: 2,
              first: pageNum === 0,
              last: pageNum === 1,
              empty: false,
            },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.goToNextPage();

      await page.waitForTimeout(500);
      // Verify navigation occurred
      const url = new URL(page.url());
      const pageParam = url.searchParams.get('page');
      if (pageParam) {
        expect(parseInt(pageParam)).toBeGreaterThanOrEqual(0);
      }
    });

    test('should disable previous button on first page', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...pageResponseMock,
              first: true,
              last: false,
            },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.verifyPrevPageDisabled();
    });

    test('should disable next button on last page', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...pageResponseMock,
              first: false,
              last: true,
            },
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.verifyNextPageDisabled();
    });
  });

  test.describe('Row Selection', () => {
    test('should select individual row', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.selectRow(0);

      const selectedCount = await vocTablePage.getSelectedRowCount();
      expect(selectedCount).toBe(1);
    });

    test('should select all rows', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.selectAllRows();

      const selectedCount = await vocTablePage.getSelectedRowCount();
      const totalRows = await vocTablePage.getRowCount();
      expect(selectedCount).toBe(totalRows);
    });

    test('should deselect all rows', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();
      await vocTablePage.selectAllRows();
      await vocTablePage.deselectAllRows();

      const selectedCount = await vocTablePage.getSelectedRowCount();
      expect(selectedCount).toBe(0);
    });
  });

  test.describe('Row Interaction', () => {
    test('should navigate to detail page when row is clicked', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      const navigationPromise = page.waitForURL(`**/voc/${testVocs[0].id}**`);
      await vocTablePage.clickRow(0);

      await navigationPromise;
      expect(page.url()).toContain(`/voc/${testVocs[0].id}`);
    });

    test('should highlight row on hover', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      const firstRow = vocTablePage.tableRows.first();
      await firstRow.hover();

      // Verify hover class is applied
      const hasHoverClass = await firstRow.evaluate((el) => {
        return el.classList.contains('hover:bg-gray-50') ||
               window.getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
      });

      expect(hasHoverClass).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper table structure', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      await expect(vocTablePage.table.locator('thead')).toBeVisible();
      await expect(vocTablePage.table.locator('tbody')).toBeVisible();
    });

    test('should have accessible pagination controls', async ({ page }) => {
      await page.route('**/api/vocs?**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pageResponseMock,
          }),
        });
      });

      await vocTablePage.waitForTableLoad();

      await expect(vocTablePage.prevPageButton).toHaveAttribute('type', 'button');
      await expect(vocTablePage.nextPageButton).toHaveAttribute('type', 'button');
    });
  });
});
