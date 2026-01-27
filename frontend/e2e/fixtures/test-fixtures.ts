import { test as base, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * @description Custom test fixtures for E2E tests
 * Provides authenticated and unauthenticated page contexts
 * with common utilities and helper methods
 */

// Define custom fixture types
export interface TestFixtures {
  authenticatedPage: Page;
  unauthenticatedPage: Page;
  adminPage: Page;
  managerPage: Page;
  operatorPage: Page;
}

/**
 * Extended test with custom fixtures
 * Use this instead of the default test from @playwright/test
 */
export const test = base.extend<TestFixtures>({
  /**
   * Authenticated page fixture
   * Automatically loads the authenticated session from auth.setup.ts
   */
  authenticatedPage: async ({ page, context: _context }, use) => {
    // The authenticated state is already loaded via storageState in playwright.config.ts
    await use(page);
  },

  /**
   * Unauthenticated page fixture
   * Use this for testing login, registration, and public pages
   */
  unauthenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      // No storage state - fresh, unauthenticated session
    });
    const page = await context.newPage();
    
    await use(page);
    
    await page.close();
    await context.close();
  },

  /**
   * Admin user page fixture
   * Loads authentication state for ADMIN role
   */
  adminPage: async ({ browser }, use) => {
    const authFile = path.join(__dirname, '../.auth/user.json');
    
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();

    // Verify we have admin role
    await page.goto('/');
    const authState = await page.evaluate(() => {
      const stored = localStorage.getItem('voc-auth-storage');
      return stored ? JSON.parse(stored) : null;
    });

    if (authState?.state?.user?.role !== 'ADMIN') {
      console.warn('Warning: adminPage fixture loaded but user is not ADMIN');
    }

    await use(page);
    
    await page.close();
    await context.close();
  },

  /**
   * Manager user page fixture
   * For testing manager-specific features
   */
  managerPage: async ({ browser }, use) => {
    // Note: You may need to create separate setup files for different roles
    const authFile = path.join(__dirname, '../.auth/manager.json');
    
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();

    await use(page);
    
    await page.close();
    await context.close();
  },

  /**
   * Operator user page fixture
   * For testing operator-specific features
   */
  operatorPage: async ({ browser }, use) => {
    const authFile = path.join(__dirname, '../.auth/operator.json');
    
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();

    await use(page);
    
    await page.close();
    await context.close();
  },
});

/**
 * Re-export expect for convenience
 */
export { expect };

/**
 * Custom matchers and assertions
 */
export const customExpect = {
  /**
   * Assert that user is redirected to login page
   */
  async toBeOnLoginPage(page: Page) {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2:has-text("로그인")')).toBeVisible();
  },

  /**
   * Assert that user is authenticated
   */
  async toBeAuthenticated(page: Page) {
    const authState = await page.evaluate(() => {
      const stored = localStorage.getItem('voc-auth-storage');
      return stored ? JSON.parse(stored) : null;
    });

    expect(authState?.state?.isAuthenticated).toBe(true);
    expect(authState?.state?.accessToken).toBeTruthy();
  },

  /**
   * Assert that user is not authenticated
   */
  async toBeUnauthenticated(page: Page) {
    const authState = await page.evaluate(() => {
      const stored = localStorage.getItem('voc-auth-storage');
      return stored ? JSON.parse(stored) : null;
    });

    expect(
      authState?.state?.isAuthenticated === false || 
      !authState?.state?.accessToken
    ).toBe(true);
  },

  /**
   * Assert that user has specific role
   */
  async toHaveRole(page: Page, expectedRole: 'ADMIN' | 'MANAGER' | 'OPERATOR') {
    const authState = await page.evaluate(() => {
      const stored = localStorage.getItem('voc-auth-storage');
      return stored ? JSON.parse(stored) : null;
    });

    expect(authState?.state?.user?.role).toBe(expectedRole);
  },

  /**
   * Assert that API call was made
   */
  async toHaveCalledAPI(page: Page, endpoint: string | RegExp) {
    const apiCalled = await page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof endpoint === 'string') {
          return url.includes(endpoint);
        }
        return endpoint.test(url);
      },
      { timeout: 5000 }
    ).catch(() => null);

    expect(apiCalled).toBeTruthy();
  },
};
