import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * @description Authentication setup for E2E tests
 * This file runs before all tests and creates an authenticated session
 * The session is saved to a file and reused across tests for better performance
 */

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Setup authenticated state for tests
 * This runs once before all tests and saves the authentication state
 */
setup('authenticate', async ({ page, context }) => {
  // Test credentials - these should match your test database
  const testCredentials = {
    username: process.env.TEST_USERNAME || 'admin',
    password: process.env.TEST_PASSWORD || 'admin123',
  };

  console.log('Setting up authentication...');

  // Navigate to login page
  await page.goto('/login');

  // Wait for the page to load
  await expect(page.locator('h2:has-text("로그인")')).toBeVisible();

  // Fill in login form
  await page.getByLabel('아이디').fill(testCredentials.username);
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
