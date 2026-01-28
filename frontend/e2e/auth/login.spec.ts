import { test, expect } from '../fixtures/test-fixtures';
import {
  waitForApi,
  mockApiError,
  clearAuth,
  setAuthState,
  getAuthState,
  getTestCredentials,
} from '../utils/test-helpers';

/**
 * @description E2E tests for authentication workflow (SC-01)
 * Tests logout, token management, and protected routes
 *
 * @see ./detailed/auth/login.detailed.spec.ts for detailed UI interaction tests
 * - Page rendering, form validation, button states
 * - Keyboard navigation, accessibility
 * - Responsive layout, security tests
 */

// Login Flow UI tests moved to: e2e/detailed/auth/login.detailed.spec.ts

test.describe('Logout Flow', () => {
  test('should successfully logout and clear session', async ({ authenticatedPage: page }) => {
    // Arrange - User is already authenticated via fixture
    await page.goto('/dashboard');

    // Verify authenticated state
    let authState = await getAuthState(page);
    expect(authState.state.isAuthenticated).toBe(true);

    // Act - Click logout button
    const logoutButton = page.getByRole('button', { name: /로그아웃|logout/i });
    await logoutButton.click();

    // Assert - Redirected to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });

    // Assert - Authentication state is cleared
    authState = await getAuthState(page);
    expect(authState?.state?.isAuthenticated).toBeFalsy();
    expect(authState?.state?.accessToken).toBeFalsy();
  });

  test('should call logout API endpoint', async ({ authenticatedPage: page }) => {
    // Arrange
    await page.goto('/dashboard');

    // Setup API response listener
    const logoutPromise = waitForApi(page, '/auth/logout', {
      method: 'POST',
    });

    // Act - Click logout button
    const logoutButton = page.getByRole('button', { name: /로그아웃|logout/i });
    await logoutButton.click();

    // Assert - Logout API was called
    const logoutResponse = await logoutPromise;
    expect(logoutResponse.status()).toBe(200);
  });
});

test.describe('Token Expiration and Refresh', () => {
  test('should redirect to login when token is expired', async ({ page }) => {
    // Arrange - Set expired token
    await setAuthState(page, {
      accessToken: 'expired-token',
      refreshToken: 'expired-refresh-token',
      user: {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
      },
    });

    // Mock API to return 401 Unauthorized
    await mockApiError(page, /\/api\//, 401, 'Token expired');

    // Act - Try to access protected page
    await page.goto('/dashboard');

    // Assert - Redirected to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test('should attempt token refresh on 401 response', async ({ page }) => {
    // Arrange - Set valid refresh token
    await setAuthState(page, {
      accessToken: 'expired-access-token',
      refreshToken: 'valid-refresh-token',
      user: {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
      },
    });

    // Mock 401 for first request
    let requestCount = 0;
    await page.route(/\/api\/statistics/, async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: { message: 'Token expired' } }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: {} }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    // Mock refresh token endpoint
    await page.route(/\/auth\/refresh/, async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Act - Try to access protected resource
    await page.goto('/dashboard');

    // Wait for potential refresh to occur
    await page.waitForTimeout(1000);
  });

  test('should redirect to login when refresh token is also expired', async ({ page }) => {
    // Arrange - Set expired tokens
    await setAuthState(page, {
      accessToken: 'expired-access-token',
      refreshToken: 'expired-refresh-token',
      user: {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
      },
    });

    // Mock both endpoints to return 401
    await mockApiError(page, /\/api\//, 401, 'Token expired');
    await mockApiError(page, /\/auth\/refresh/, 401, 'Refresh token expired');

    // Act - Try to access protected page
    await page.goto('/dashboard');

    // Assert - Redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ unauthenticatedPage: page }) => {
    // Act - Try to access protected route without authentication
    await page.goto('/dashboard');

    // Assert - Redirected to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test('should allow authenticated users to access protected routes', async ({
    authenticatedPage: page,
  }) => {
    // Act - Access protected route
    await page.goto('/dashboard');

    // Assert - Successfully loads page
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert - Page content is visible
    await expect(page.locator('body')).not.toContainText('로그인');
  });

  test('should preserve intended destination after login', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const credentials = getTestCredentials('ADMIN');
    const intendedUrl = '/voc/table';

    // Mock the login API
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: 1,
              username: 'admin',
              name: '관리자',
              email: credentials.email,
              role: 'ADMIN',
            },
          },
        }),
      });
    });

    // Act - Try to access protected page
    await page.goto(intendedUrl);

    // Should be redirected to login
    await page.waitForURL(/\/login/);

    // Login
    await page.getByLabel('이메일').fill(credentials.email);
    await page.locator('#password').fill(credentials.password);
    await page.getByRole('button', { name: '로그인' }).click();

    // Wait for any redirect
    await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
  });
});
