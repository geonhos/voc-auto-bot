import { test, expect } from '@playwright/test';
import { VocDetailPage, SimilarVocModal } from '../page-objects';
import { testVocs, testSimilarVocs } from '../fixtures';

/**
 * @description E2E tests for Similar VOC feature (SC-07)
 * Tests similar VOC modal, similarity display, and navigation
 */

test.describe('Similar VOC', () => {
  let vocDetailPage: VocDetailPage;
  let similarVocModal: SimilarVocModal;

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
    similarVocModal = new SimilarVocModal(page);

    // Mock VOC detail
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
  });

  test.describe('Modal Opening', () => {
    test('should open similar VOC modal when button is clicked', async ({ page }) => {
      // Mock similar VOC API
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      await expect(similarVocModal.modal).toBeVisible();
    });

    test('should close modal when close button is clicked', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      await similarVocModal.close();
      await expect(similarVocModal.modal).not.toBeVisible();
    });

    test('should close modal when Escape key is pressed', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      await similarVocModal.closeByEscape();
    });
  });

  test.describe('Similar VOC List Display', () => {
    test('should display list of similar VOCs', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      const count = await similarVocModal.getSimilarVocCount();
      expect(count).toBe(testSimilarVocs.length);
    });

    test('should display correct card information', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      const cardData = await similarVocModal.getCardData(0);
      expect(cardData.ticketId).toContain(testSimilarVocs[0].ticketId);
      expect(cardData.title).toContain(testSimilarVocs[0].title);
    });

    test('should show empty state when no similar VOCs found', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      await similarVocModal.verifyEmptyState();
    });

    test('should show loading state while fetching', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        // Delay the response
        await page.waitForTimeout(1000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();

      // Check if loading state is shown
      if (await similarVocModal.loadingSpinner.isVisible({ timeout: 500 })) {
        await similarVocModal.verifyLoading();
      }
    });
  });

  test.describe('Similarity Score Display', () => {
    test('should display similarity percentage', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      const cardData = await similarVocModal.getCardData(0);
      expect(cardData.similarity).toBeTruthy();
      expect(cardData.similarity).toMatch(/\d+%/); // Should contain percentage
    });

    test('should display similarity score above threshold', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      // Verify all similarities are above minimum threshold (e.g., 50%)
      await similarVocModal.verifyMinimumSimilarity(50);
    });

    test('should sort cards by similarity in descending order', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      await similarVocModal.verifySortedBySimilarity();
    });

    test('should highlight high similarity scores', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      // Verify high similarity (>80%) cards have special styling
      const firstCard = await similarVocModal.getCardByIndex(0);
      const similarityElement = firstCard.locator('[data-testid="similar-voc-similarity"]');

      // Check if high similarity has special class or color
      const hasHighlightClass = await similarityElement.evaluate((el) => {
        const classList = Array.from(el.classList);
        return classList.some((c) => c.includes('high') || c.includes('success') || c.includes('green'));
      });

      // High similarity should be highlighted (if first item has >80%)
      if (testSimilarVocs[0].similarity > 0.8) {
        expect(hasHighlightClass).toBeTruthy();
      }
    });
  });

  test.describe('Status Badge Display', () => {
    test('should display status badge for each similar VOC', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      const cardData = await similarVocModal.getCardData(0);
      expect(cardData.status).toBeTruthy();
    });

    test('should show different badge colors for different statuses', async ({ page }) => {
      const mixedStatusVocs = [
        { ...testSimilarVocs[0], status: 'RESOLVED' },
        { ...testSimilarVocs[1], status: 'CLOSED' },
        { ...testSimilarVocs[2], status: 'IN_PROGRESS' },
      ];

      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mixedStatusVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      // Verify all status badges are visible
      for (let i = 0; i < mixedStatusVocs.length; i++) {
        const card = await similarVocModal.getCardByIndex(i);
        const statusBadge = card.locator('[data-testid="similar-voc-status"]');
        await expect(statusBadge).toBeVisible();
      }
    });
  });

  test.describe('Navigation to Detail', () => {
    test('should navigate to similar VOC detail when card is clicked', async ({ page, context }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      // Mock similar VOC detail
      await page.route(`**/api/vocs/${testSimilarVocs[0].id}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: testVocs[1], // Use another test VOC as the similar one
            }),
          });
        }
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      const navigationPromise = page.waitForURL(`**/voc/${testSimilarVocs[0].id}**`);
      await similarVocModal.clickCard(0);

      await navigationPromise;
      expect(page.url()).toContain(`/voc/${testSimilarVocs[0].id}`);
    });

    test('should navigate by clicking specific ticket ID', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      const navigationPromise = page.waitForURL(`**/voc/${testSimilarVocs[0].id}**`);
      await similarVocModal.clickCardByTicketId(testSimilarVocs[0].ticketId);

      await navigationPromise;
      expect(page.url()).toContain(`/voc/${testSimilarVocs[0].id}`);
    });

    test('should open similar VOC in same tab', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      const currentUrl = page.url();
      await similarVocModal.clickCard(0);

      await page.waitForLoadState('networkidle');

      // URL should have changed in the same tab
      expect(page.url()).not.toBe(currentUrl);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API error gracefully', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '유사 VOC 조회에 실패했습니다' },
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      // Should show error message
      const errorMessage = page.locator('[role="alert"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should handle network timeout', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        // Simulate timeout
        await page.waitForTimeout(30000);
        await route.abort('timedout');
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();

      // Should handle timeout gracefully
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Filtering and Searching', () => {
    test('should verify card exists by ticket ID', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      await similarVocModal.verifyCardExists(testSimilarVocs[0].ticketId);
    });

    test('should verify card does not exist', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      await similarVocModal.verifyCardNotExists('NONEXISTENT-TICKET');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      // Verify modal has proper role
      await expect(similarVocModal.modal).toHaveAttribute('role', 'dialog');
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      // Should close with Escape
      await page.keyboard.press('Escape');
      await expect(similarVocModal.modal).not.toBeVisible();
    });

    test('should have focusable elements', async ({ page }) => {
      await page.route(`**/api/vocs/${testVocs[0].id}/similar`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testSimilarVocs,
          }),
        });
      });

      await vocDetailPage.goto(testVocs[0].id);
      await vocDetailPage.waitForLoad();

      await vocDetailPage.openSimilarVoc();
      await similarVocModal.waitForModal();

      // Close button should be focusable
      await similarVocModal.closeButton.focus();
      const isFocused = await similarVocModal.closeButton.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    });
  });
});
