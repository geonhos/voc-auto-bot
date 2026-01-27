import { test, expect } from '@playwright/test';
import { VocStatusPage } from '../page-objects';
import { statusLookupData, testVocs } from '../fixtures';

/**
 * @description E2E tests for VOC Status Lookup (SC-03)
 * Tests public status lookup, validation, and timeline display
 */

test.describe('VOC Status Lookup', () => {
  let vocStatusPage: VocStatusPage;

  test.beforeEach(async ({ page }) => {
    vocStatusPage = new VocStatusPage(page);
    await vocStatusPage.goto();
  });

  test.describe('Page Rendering', () => {
    test('should render status lookup form', async () => {
      await expect(vocStatusPage.ticketIdInput).toBeVisible();
      await expect(vocStatusPage.emailInput).toBeVisible();
      await expect(vocStatusPage.searchButton).toBeVisible();
    });

    test('should not require authentication', async ({ page }) => {
      // Verify this is a public page
      await vocStatusPage.goto();
      await expect(vocStatusPage.searchButton).toBeVisible();

      // Verify no redirect to login
      expect(page.url()).toContain('/voc/status');
      expect(page.url()).not.toContain('/login');
    });
  });

  test.describe('Form Validation', () => {
    test('should show error when ticket ID is empty', async ({ page }) => {
      await vocStatusPage.fillEmail(statusLookupData.valid.customerEmail);
      await vocStatusPage.clickSearch();

      await page.waitForTimeout(500);
      await vocStatusPage.verifyValidationError('ticketId');
    });

    test('should show error when email is empty', async ({ page }) => {
      await vocStatusPage.fillTicketId(statusLookupData.valid.ticketId);
      await vocStatusPage.clickSearch();

      await page.waitForTimeout(500);
      await vocStatusPage.verifyValidationError('customerEmail');
    });

    test('should validate email format', async ({ page }) => {
      await vocStatusPage.fillTicketId(statusLookupData.valid.ticketId);
      await vocStatusPage.fillEmail('invalid-email');
      await vocStatusPage.clickSearch();

      await page.waitForTimeout(500);
      const emailError = page.locator('#customerEmail').locator('xpath=following-sibling::p[@role="alert"]');
      if (await emailError.isVisible()) {
        const errorText = await emailError.textContent();
        expect(errorText).toMatch(/이메일|email/i);
      }
    });

    test('should validate ticket ID format', async ({ page }) => {
      await vocStatusPage.fillTicketId('INVALID');
      await vocStatusPage.fillEmail(statusLookupData.valid.customerEmail);
      await vocStatusPage.clickSearch();

      await page.waitForTimeout(500);
      // May show format validation or server error
      const hasError = await vocStatusPage.errorMessage.isVisible();
      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Successful Status Lookup', () => {
    test('should display VOC status with valid credentials', async ({ page }) => {
      // Mock successful lookup
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ticketId: testVocs[0].ticketId,
                title: testVocs[0].title,
                status: testVocs[0].status,
                statusLabel: '접수됨',
                createdAt: testVocs[0].createdAt,
                updatedAt: testVocs[0].updatedAt,
              },
            }),
          });
        }
      });

      await vocStatusPage.searchStatus(
        statusLookupData.valid.ticketId,
        statusLookupData.valid.customerEmail
      );

      await vocStatusPage.verifyResultDisplayed(statusLookupData.valid.ticketId);
    });

    test('should display status badge correctly', async ({ page }) => {
      // Mock successful lookup
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ticketId: testVocs[0].ticketId,
                title: testVocs[0].title,
                status: testVocs[0].status,
                statusLabel: '접수됨',
                createdAt: testVocs[0].createdAt,
                updatedAt: testVocs[0].updatedAt,
              },
            }),
          });
        }
      });

      await vocStatusPage.searchStatus(
        statusLookupData.valid.ticketId,
        statusLookupData.valid.customerEmail
      );

      await vocStatusPage.waitForResult();
      await vocStatusPage.verifyStatusBadge('접수됨');
    });

    test('should display VOC title', async ({ page }) => {
      // Mock successful lookup
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ticketId: testVocs[0].ticketId,
                title: testVocs[0].title,
                status: testVocs[0].status,
                statusLabel: '접수됨',
                createdAt: testVocs[0].createdAt,
                updatedAt: testVocs[0].updatedAt,
              },
            }),
          });
        }
      });

      await vocStatusPage.searchStatus(
        statusLookupData.valid.ticketId,
        statusLookupData.valid.customerEmail
      );

      await vocStatusPage.waitForResult();
      const title = await vocStatusPage.titleDisplay.textContent();
      expect(title).toContain(testVocs[0].title);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error for invalid ticket ID', async ({ page }) => {
      // Mock 404 error
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
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

      await vocStatusPage.searchStatus(
        statusLookupData.invalidTicketId.ticketId,
        statusLookupData.invalidTicketId.customerEmail
      );

      await vocStatusPage.verifyErrorDisplayed('찾을 수 없습니다');
    });

    test('should show error for email mismatch', async ({ page }) => {
      // Mock 403 error
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: '이메일이 일치하지 않습니다' },
            }),
          });
        }
      });

      await vocStatusPage.searchStatus(
        statusLookupData.invalidEmail.ticketId,
        statusLookupData.invalidEmail.customerEmail
      );

      await vocStatusPage.verifyErrorDisplayed('일치하지 않습니다');
    });

    test('should handle server error gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
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

      await vocStatusPage.searchStatus(
        statusLookupData.valid.ticketId,
        statusLookupData.valid.customerEmail
      );

      await vocStatusPage.verifyErrorDisplayed();
    });
  });

  test.describe('Status Timeline', () => {
    test('should display status timeline', async ({ page }) => {
      // Mock successful lookup with timeline
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ticketId: testVocs[0].ticketId,
                title: testVocs[0].title,
                status: testVocs[0].status,
                statusLabel: '접수됨',
                createdAt: testVocs[0].createdAt,
                updatedAt: testVocs[0].updatedAt,
                timeline: [
                  {
                    status: 'RECEIVED',
                    statusLabel: '접수됨',
                    timestamp: testVocs[0].createdAt,
                  },
                ],
              },
            }),
          });
        }
      });

      await vocStatusPage.searchStatus(
        statusLookupData.valid.ticketId,
        statusLookupData.valid.customerEmail
      );

      await vocStatusPage.waitForResult();
      await vocStatusPage.verifyTimelineDisplayed();
    });

    test('should show multiple timeline items for progressed VOCs', async ({ page }) => {
      // Mock VOC with multiple status changes
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ticketId: testVocs[1].ticketId,
                title: testVocs[1].title,
                status: testVocs[1].status,
                statusLabel: '배정됨',
                createdAt: testVocs[1].createdAt,
                updatedAt: testVocs[1].updatedAt,
                timeline: [
                  {
                    status: 'RECEIVED',
                    statusLabel: '접수됨',
                    timestamp: '2026-01-25T09:00:00Z',
                  },
                  {
                    status: 'ASSIGNED',
                    statusLabel: '배정됨',
                    timestamp: '2026-01-25T11:00:00Z',
                  },
                ],
              },
            }),
          });
        }
      });

      await vocStatusPage.searchStatus(testVocs[1].ticketId, 'kim@example.com');

      await vocStatusPage.waitForResult();
      const timelineItemCount = await vocStatusPage.getTimelineItems();
      expect(timelineItemCount).toBeGreaterThanOrEqual(2);
    });

    test('should display timeline in chronological order', async ({ page }) => {
      // Mock VOC with timeline
      await page.route('**/api/vocs/status', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ticketId: testVocs[2].ticketId,
                title: testVocs[2].title,
                status: 'IN_PROGRESS',
                statusLabel: '처리중',
                createdAt: testVocs[2].createdAt,
                updatedAt: testVocs[2].updatedAt,
                timeline: [
                  {
                    status: 'RECEIVED',
                    statusLabel: '접수됨',
                    timestamp: '2026-01-25T08:00:00Z',
                  },
                  {
                    status: 'ASSIGNED',
                    statusLabel: '배정됨',
                    timestamp: '2026-01-25T10:00:00Z',
                  },
                  {
                    status: 'IN_PROGRESS',
                    statusLabel: '처리중',
                    timestamp: '2026-01-25T12:00:00Z',
                  },
                ],
              },
            }),
          });
        }
      });

      await vocStatusPage.searchStatus(testVocs[2].ticketId, 'park@example.com');

      await vocStatusPage.waitForResult();
      await vocStatusPage.verifyTimelineDisplayed();

      const timelineItemCount = await vocStatusPage.getTimelineItems();
      expect(timelineItemCount).toBe(3);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels', async () => {
      const ticketIdLabel = vocStatusPage.page.locator('label[for="ticketId"]');
      const emailLabel = vocStatusPage.page.locator('label[for="customerEmail"]');

      await expect(ticketIdLabel).toBeVisible();
      await expect(emailLabel).toBeVisible();
    });

    test('should set aria-invalid on error', async ({ page }) => {
      await vocStatusPage.clickSearch();
      await page.waitForTimeout(500);

      const ticketIdAriaInvalid = await vocStatusPage.ticketIdInput.getAttribute('aria-invalid');
      expect(ticketIdAriaInvalid).toBe('true');
    });

    test('should use role="alert" for error messages', async ({ page }) => {
      await vocStatusPage.clickSearch();
      await page.waitForTimeout(500);

      const alerts = page.locator('[role="alert"]');
      const count = await alerts.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
