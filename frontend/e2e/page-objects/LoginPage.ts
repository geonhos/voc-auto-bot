import { type Page, type Locator, expect } from '@playwright/test';

/**
 * @description Page Object Model for Login page
 * Route: /login
 */
export class LoginPage {
  readonly page: Page;

  // Form inputs
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  // Buttons
  readonly togglePasswordButton: Locator;
  readonly submitButton: Locator;

  // Links
  readonly forgotPasswordLink: Locator;

  // Labels
  readonly emailLabel: Locator;
  readonly passwordLabel: Locator;
  readonly pageHeading: Locator;

  // Alert
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form inputs
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');

    // Buttons
    this.togglePasswordButton = page.getByRole('button', { name: /비밀번호 보기|비밀번호 숨기기/ });
    this.submitButton = page.getByRole('button', { name: '로그인' });

    // Links
    this.forgotPasswordLink = page.getByRole('link', { name: '비밀번호를 잊으셨나요?' });

    // Labels
    this.emailLabel = page.locator('label[for="email"]');
    this.passwordLabel = page.locator('label[for="password"]');
    this.pageHeading = page.locator('h2');

    // Alert (excluding Next.js route announcer)
    this.errorAlert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
  }

  /**
   * @description Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * @description Clear authentication state and go to login page
   */
  async gotoAndClearAuth() {
    // Navigate first to establish context, then clear storage
    await this.goto();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Reload after clearing storage
    await this.page.reload();
  }

  /**
   * @description Fill email input
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * @description Fill password input
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * @description Toggle password visibility
   */
  async togglePassword() {
    await this.togglePasswordButton.click();
  }

  /**
   * @description Submit login form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * @description Login with credentials
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * @description Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    return await this.errorAlert.textContent();
  }

  /**
   * @description Verify page is loaded
   */
  async verifyPageLoaded() {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.pageHeading).toHaveText('로그인');
  }

  /**
   * @description Verify email input is visible and has correct attributes
   */
  async verifyEmailInput() {
    await expect(this.emailLabel).toHaveText('이메일');
    await expect(this.emailInput).toBeVisible();
    await expect(this.emailInput).toHaveAttribute('type', 'email');
    await expect(this.emailInput).toHaveAttribute('placeholder', '이메일 입력');
    await expect(this.emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(this.emailInput).toHaveAttribute('maxlength', '100');
  }

  /**
   * @description Verify password input is visible and has correct attributes
   */
  async verifyPasswordInput() {
    await expect(this.passwordLabel).toHaveText('비밀번호');
    await expect(this.passwordInput).toBeVisible();
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
    await expect(this.passwordInput).toHaveAttribute('placeholder', '비밀번호 입력');
    await expect(this.passwordInput).toHaveAttribute('autocomplete', 'current-password');
    await expect(this.passwordInput).toHaveAttribute('maxlength', '100');
  }

  /**
   * @description Verify submit button is visible and enabled
   */
  async verifySubmitButton() {
    await expect(this.submitButton).toBeVisible();
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * @description Verify toggle password button is visible
   */
  async verifyTogglePasswordButton() {
    const toggleButton = this.page.getByRole('button', { name: '비밀번호 보기' });
    await expect(toggleButton).toBeVisible();
  }

  /**
   * @description Verify forgot password link
   */
  async verifyForgotPasswordLink() {
    await expect(this.forgotPasswordLink).toBeVisible();
    await expect(this.forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  }

  /**
   * @description Verify error alert is not visible
   */
  async verifyNoError() {
    await expect(this.errorAlert).not.toBeVisible();
  }

  /**
   * @description Verify error alert is visible with message
   */
  async verifyErrorVisible(message?: string | RegExp) {
    await expect(this.errorAlert).toBeVisible({ timeout: 5000 });
    if (message) {
      await expect(this.errorAlert).toContainText(message);
    }
  }

  /**
   * @description Verify email validation error
   */
  async verifyEmailValidationError(message: string | RegExp) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
    await expect(this.emailInput).toHaveAttribute('aria-invalid', 'true');
  }

  /**
   * @description Verify password validation error
   */
  async verifyPasswordValidationError(message: string | RegExp) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
    await expect(this.passwordInput).toHaveAttribute('aria-invalid', 'true');
  }

  /**
   * @description Verify password input type
   */
  async verifyPasswordType(type: 'password' | 'text') {
    await expect(this.passwordInput).toHaveAttribute('type', type);
  }

  /**
   * @description Verify loading state
   */
  async verifyLoadingState() {
    const loadingButton = this.page.getByRole('button', { name: /로그인 중/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();
    await expect(loadingButton.locator('svg.animate-spin')).toBeVisible();
  }

  /**
   * @description Verify loading text
   */
  async verifyLoadingText() {
    await expect(this.page.locator('text=로그인 중...')).toBeVisible();
  }

  /**
   * @description Wait for successful redirect
   */
  async waitForRedirect() {
    await this.page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
  }

  /**
   * @description Verify authentication token is stored
   */
  async verifyAuthTokenStored() {
    const authState = await this.page.evaluate(() => {
      const stored = localStorage.getItem('auth-storage');
      return stored ? JSON.parse(stored) : null;
    });

    expect(authState?.state?.isAuthenticated).toBe(true);
    expect(authState?.state?.accessToken).toBeTruthy();
  }

  /**
   * @description Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * @description Submit form by pressing Enter
   */
  async submitByEnter() {
    await this.passwordInput.press('Enter');
  }

  /**
   * @description Get email input value
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  /**
   * @description Get password input value
   */
  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  /**
   * @description Focus email input
   */
  async focusEmail() {
    await this.emailInput.focus();
  }

  /**
   * @description Focus password input
   */
  async focusPassword() {
    await this.passwordInput.focus();
  }

  /**
   * @description Verify email is focused
   */
  async verifyEmailFocused() {
    await expect(this.emailInput).toBeFocused();
  }

  /**
   * @description Verify password is focused
   */
  async verifyPasswordFocused() {
    await expect(this.passwordInput).toBeFocused();
  }

  /**
   * @description Verify accessibility attributes
   */
  async verifyAccessibility() {
    // Email field
    await expect(this.emailInput).toHaveAttribute('aria-label', '이메일');
    await expect(this.emailInput).toHaveAttribute('aria-required', 'true');

    // Password field
    await expect(this.passwordInput).toHaveAttribute('aria-label', '비밀번호');
    await expect(this.passwordInput).toHaveAttribute('aria-required', 'true');

    // Submit button
    await expect(this.submitButton).toHaveAttribute('aria-label', '로그인');
  }

  /**
   * @description Verify error alert has correct accessibility attributes
   */
  async verifyErrorAccessibility() {
    await expect(this.errorAlert).toBeVisible({ timeout: 5000 });
    await expect(this.errorAlert).toHaveAttribute('aria-live', 'assertive');
  }

  /**
   * @description Verify form validation errors show aria-invalid
   */
  async verifyValidationErrorsAccessibility() {
    await expect(this.emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(this.passwordInput).toHaveAttribute('aria-invalid', 'true');
  }
}
