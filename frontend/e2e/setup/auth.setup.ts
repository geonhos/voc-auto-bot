import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * @description Authentication setup for E2E tests
 * This file runs before all tests and creates an authenticated session
 * The session is saved to a file and reused across tests for better performance
 */

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Mock user data for tests
 */
const mockUser = {
  id: 1,
  username: 'admin',
  name: '관리자',
  email: 'admin@example.com',
  role: 'ADMIN',
};

/**
 * Setup authenticated state for tests
 * This runs once before all tests and saves the authentication state
 */
setup('authenticate', async ({ page, context }) => {
  // Test credentials
  const testCredentials = {
    email: process.env.TEST_EMAIL || 'admin@example.com',
    password: process.env.TEST_PASSWORD || 'admin123',
  };

  console.log('Setting up authentication...');

  // Mock the login API to always succeed for test credentials
  await page.route('**/auth/login', async (route) => {
    const request = route.request();
    const body = JSON.parse(request.postData() || '{}');

    if (body.email === testCredentials.email && body.password === testCredentials.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock-access-token-for-e2e-tests',
            refreshToken: 'mock-refresh-token-for-e2e-tests',
            user: mockUser,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '이메일 또는 비밀번호가 올바르지 않습니다',
          },
        }),
      });
    }
  });

  // Navigate to login page
  await page.goto('/login');

  // Wait for the page to load
  await expect(page.locator('h2:has-text("로그인")')).toBeVisible();

  // Fill in login form
  await page.getByLabel('이메일').fill(testCredentials.email);
  await page.locator('#password').fill(testCredentials.password);

  // Click login button
  await page.getByRole('button', { name: '로그인' }).click();

  // Wait for navigation to dashboard or main page
  // This ensures login was successful
  await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });

  // Verify we're authenticated by checking for user-specific elements
  // Adjust this selector based on your app's layout
  await expect(page.locator('body')).not.toContainText('로그인');

  // Save signed-in state to file
  await context.storageState({ path: authFile });

  console.log('Authentication setup complete. State saved to:', authFile);
});

/**
 * Setup for testing token expiration scenarios
 * This creates an expired or invalid token state
 */
setup('setup-expired-token', async ({ page: _page, context }) => {
  console.log('Setting up expired token state...');

  // Set invalid/expired tokens in localStorage
  await context.addInitScript(() => {
    const expiredAuthState = {
      state: {
        accessToken: 'expired-or-invalid-token',
        refreshToken: 'expired-or-invalid-refresh-token',
        user: {
          id: 1,
          username: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        isAuthenticated: true,
      },
      version: 0,
    };

    localStorage.setItem('voc-auth-storage', JSON.stringify(expiredAuthState));
  });

  // Save this state for expired token tests
  await context.storageState({ 
    path: path.join(__dirname, '../.auth/expired-token.json') 
  });

  console.log('Expired token state setup complete');
});
