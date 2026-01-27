import { test, expect } from '../fixtures/test-fixtures';
import { waitForApi, waitForNetworkIdle } from '../utils/test-helpers';

/**
 * @description Example E2E tests for dashboard functionality
 * This file demonstrates best practices for writing E2E tests
 * 
 * NOTE: This is an EXAMPLE file. Rename to .spec.ts to run these tests.
 */

test.describe('Dashboard - Example Tests', () => {
  test.describe('Authenticated User Access', () => {
    test('should load dashboard with statistics', async ({ authenticatedPage: page }) => {
      // Arrange - Setup API listener before navigation
      const statsPromise = waitForApi(page, '/statistics/summary', {
        method: 'GET',
        status: 200,
      });

      // Act - Navigate to dashboard
      await page.goto('/dashboard');

      // Assert - Verify URL
      await expect(page).toHaveURL(/\/dashboard/);

      // Assert - API was called
      const statsResponse = await statsPromise;
      expect(statsResponse.status()).toBe(200);

      // Assert - Statistics cards are visible
      await expect(page.locator('[data-testid="kpi-card"]').first()).toBeVisible();
      
      // Assert - Page has loaded completely
      await waitForNetworkIdle(page);
    });

    test('should display recent VOC list', async ({ authenticatedPage: page }) => {
      // Act
      await page.goto('/dashboard');
      
      // Assert - Recent VOC section exists
      const recentVocSection = page.locator('[data-testid="recent-voc-list"]');
      await expect(recentVocSection).toBeVisible();

      // Assert - Has VOC items or empty state
      const vocItems = page.locator('[data-testid="voc-item"]');
      const emptyState = page.locator('[data-testid="empty-state"]');
      
      const itemCount = await vocItems.count();
      if (itemCount > 0) {
        await expect(vocItems.first()).toBeVisible();
      } else {
        await expect(emptyState).toBeVisible();
      }
    });

    test('should navigate to VOC details from recent list', async ({ 
      authenticatedPage: page 
    }) => {
      // Arrange
      await page.goto('/dashboard');
      
      // Wait for VOC list to load
      const vocItem = page.locator('[data-testid="voc-item"]').first();
      await vocItem.waitFor({ state: 'visible' });

      // Act - Click on first VOC item
      await vocItem.click();

      // Assert - Navigated to VOC details page
      await page.waitForURL(/\/voc\/\d+/);
      await expect(page).toHaveURL(/\/voc\/\d+/);
    });

    test('should filter statistics by date range', async ({ authenticatedPage: page }) => {
      // Arrange
      await page.goto('/dashboard');

      // Act - Select date range
      const dateRangePicker = page.getByRole('button', { name: /날짜 선택|date range/i });
      await dateRangePicker.click();

      // Select "Last 7 days" option (adjust selector based on your implementation)
      await page.getByText(/최근 7일|last 7 days/i).click();

      // Wait for API call with new date range
      await waitForApi(page, /statistics.*startDate/, {
        method: 'GET',
        status: 200,
      });

      // Assert - Statistics updated
      await expect(page.locator('[data-testid="kpi-card"]')).toBeVisible();
    });

    test('should display charts correctly', async ({ authenticatedPage: page }) => {
      // Act
      await page.goto('/dashboard');

      // Assert - All chart types are visible
      await expect(page.locator('[data-testid="status-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="priority-chart"]')).toBeVisible();

      // Assert - Charts have rendered (check for SVG elements)
      const chartSvg = page.locator('[data-testid="status-chart"] svg');
      await expect(chartSvg).toBeVisible();
    });
  });

  test.describe('Role-Based Access', () => {
    test('admin should see admin statistics', async ({ adminPage: page }) => {
      // Act
      await page.goto('/dashboard');

      // Assert - Admin-specific statistics visible
      await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
    });

    test('manager should see team statistics', async ({ authenticatedPage: page }) => {
      // This test would use managerPage fixture in real implementation
      await page.goto('/dashboard');
      
      // Assert based on manager permissions
      // Implementation depends on your role-based UI
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message when API fails', async ({ authenticatedPage: page }) => {
      // Arrange - Mock API error
      await page.route(/\/statistics/, async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: { message: 'Failed to fetch statistics' }
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      // Act
      await page.goto('/dashboard');

      // Assert - Error message displayed
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/오류|error/i);
    });

    test('should show loading state while fetching data', async ({ 
      authenticatedPage: page 
    }) => {
      // Arrange - Slow down API response
      await page.route(/\/statistics/, async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      // Act
      await page.goto('/dashboard');

      // Assert - Loading indicator visible
      const loadingIndicator = page.locator('[data-testid="loading"]');
      await expect(loadingIndicator).toBeVisible();

      // Wait for data to load
      await waitForNetworkIdle(page);

      // Assert - Loading indicator hidden
      await expect(loadingIndicator).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async ({ 
      authenticatedPage: page 
    }) => {
      // Arrange - Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Act
      await page.goto('/dashboard');

      // Assert - Mobile layout applied
      // Check for hamburger menu, stacked cards, etc.
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
    });

    test('should display correctly on tablet devices', async ({ 
      authenticatedPage: page 
    }) => {
      // Arrange - Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Act
      await page.goto('/dashboard');

      // Assert - Tablet layout applied
      await expect(page.locator('[data-testid="kpi-card"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be navigable with keyboard', async ({ authenticatedPage: page }) => {
      // Act
      await page.goto('/dashboard');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Verify first focusable element is focused
      const firstButton = page.locator('button, a, input').first();
      await expect(firstButton).toBeFocused();

      // Continue tabbing
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to activate elements with Enter/Space
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA landmarks', async ({ authenticatedPage: page }) => {
      // Act
      await page.goto('/dashboard');

      // Assert - Main landmarks exist
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Assert - Headings hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
    });

    test('should have sufficient color contrast', async ({ authenticatedPage: page }) => {
      // Act
      await page.goto('/dashboard');

      // Note: Playwright doesn't have built-in contrast checking
      // You would use axe-core or similar tool for comprehensive a11y testing
      // This is a placeholder to demonstrate the concept
      
      // Assert - Text is visible and readable
      const text = page.locator('body');
      await expect(text).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ authenticatedPage: page }) => {
      // Arrange
      const startTime = Date.now();

      // Act
      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      // Assert - Page loaded within 3 seconds
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should not have memory leaks', async ({ authenticatedPage: page }) => {
      // This is a simplified example
      // Real memory leak testing requires more sophisticated tools
      
      // Act - Navigate back and forth
      await page.goto('/dashboard');
      await page.goto('/voc/table');
      await page.goto('/dashboard');
      await page.goto('/voc/table');
      await page.goto('/dashboard');

      // In a real scenario, you'd monitor memory usage here
      // Playwright doesn't have built-in memory profiling
      // You'd use Chrome DevTools Protocol for this
    });
  });
});

test.describe('Unauthenticated Access', () => {
  test('should redirect to login page', async ({ unauthenticatedPage: page }) => {
    // Act - Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Assert - Redirected to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
