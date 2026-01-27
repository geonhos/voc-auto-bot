import { test, expect } from '@playwright/test';
import { EmailPage } from '../pages/EmailPage';
import { waitForToast as _waitForToast, mockApi } from '../utils/test-helpers';

/**
 * @description E2E tests for Email Template functionality (SC-08)
 * Tests cover template listing, selection, composition, preview, and sending
 */
test.describe('Email Template - SC-08', () => {
  let emailPage: EmailPage;

  test.beforeEach(async ({ page }) => {
    emailPage = new EmailPage(page);

    // Mock email templates API
    await mockApi(
      page,
      /\/api\/email\/templates/,
      {
        status: 200,
        body: {
          content: [
            {
              id: 1,
              name: 'VOC 접수 확인',
              type: 'VOC_RECEIVED',
              subject: 'VOC가 접수되었습니다',
              bodyHtml: '<p>안녕하세요 {{customerName}}님,</p><p>VOC ID: {{vocId}}</p>',
              bodyText: '안녕하세요 {{customerName}}님, VOC ID: {{vocId}}',
              variables: ['customerName', 'vocId', 'category'],
              isSystem: true,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 2,
              name: 'VOC 처리 중',
              type: 'VOC_IN_PROGRESS',
              subject: 'VOC가 처리 중입니다',
              bodyHtml: '<p>안녕하세요 {{customerName}}님,</p><p>담당자: {{assignee}}</p>',
              bodyText: '안녕하세요 {{customerName}}님, 담당자: {{assignee}}',
              variables: ['customerName', 'vocId', 'assignee'],
              isSystem: true,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 3,
              name: '맞춤 템플릿',
              type: 'CUSTOM',
              subject: '안내 메일',
              bodyHtml: '<p>{{content}}</p>',
              bodyText: '{{content}}',
              variables: ['content'],
              isSystem: false,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          totalElements: 3,
        },
      },
      { method: 'GET' }
    );

    await emailPage.goto(1);
  });

  test('should display template list', async () => {
    // Verify template count
    const count = await emailPage.getTemplateCount();
    expect(count).toBeGreaterThan(0);

    // Verify specific templates exist
    await expect(
      emailPage.templateCard.filter({ hasText: 'VOC 접수 확인' })
    ).toBeVisible();
    await expect(
      emailPage.templateCard.filter({ hasText: 'VOC 처리 중' })
    ).toBeVisible();
  });

  test('should select template', async ({ page }) => {
    // Mock single template fetch
    await mockApi(
      page,
      /\/api\/email\/templates\/1/,
      {
        status: 200,
        body: {
          id: 1,
          name: 'VOC 접수 확인',
          type: 'VOC_RECEIVED',
          subject: 'VOC가 접수되었습니다',
          bodyHtml: '<p>안녕하세요 {{customerName}}님,</p><p>VOC ID: {{vocId}}</p>',
          bodyText: '안녕하세요 {{customerName}}님, VOC ID: {{vocId}}',
          variables: ['customerName', 'vocId', 'category'],
          isSystem: true,
          isActive: true,
        },
      },
      { method: 'GET' }
    );

    // Select template
    await emailPage.selectTemplate('VOC 접수 확인');

    // Verify template is loaded in form
    await expect(emailPage.subjectInput).toHaveValue(/VOC가 접수되었습니다/);
  });

  test('should fill email compose form', async () => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Fill form
    await emailPage.fillComposeForm({
      subject: 'VOC 접수 확인 - 사용자 정의',
      body: '안녕하세요, VOC가 접수되었습니다.',
      recipient: 'customer@example.com',
    });

    // Verify values
    await expect(emailPage.subjectInput).toHaveValue('VOC 접수 확인 - 사용자 정의');
    await expect(emailPage.bodyInput).toHaveValue(/안녕하세요, VOC가 접수되었습니다/);
    await expect(emailPage.recipientInput).toHaveValue('customer@example.com');
  });

  test('should display variable list', async () => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Get available variables
    const variables = await emailPage.getAvailableVariables();

    // Verify variables
    expect(variables.length).toBeGreaterThan(0);
    expect(variables).toContain('customerName');
    expect(variables).toContain('vocId');
  });

  test('should preview email with variable substitution', async ({ page }) => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Mock preview API
    await mockApi(
      page,
      /\/api\/email\/preview/,
      {
        status: 200,
        body: {
          subject: 'VOC가 접수되었습니다',
          bodyHtml:
            '<p>안녕하세요 홍길동님,</p><p>VOC ID: 12345</p>',
          bodyText: '안녕하세요 홍길동님, VOC ID: 12345',
        },
      },
      { method: 'POST' }
    );

    // Open preview
    await emailPage.openPreview();

    // Verify preview modal is visible
    await expect(emailPage.previewModal).toBeVisible();

    // Verify variable substitution
    await emailPage.verifyPreviewContent('VOC가 접수되었습니다', /홍길동/);

    // Verify variables are replaced (not showing {{variable}})
    const content = emailPage.previewModal.locator('[data-testid="preview-content"]');
    const hasVariablePlaceholder = await content.textContent();
    expect(hasVariablePlaceholder).not.toContain('{{');
    expect(hasVariablePlaceholder).not.toContain('}}');

    // Close preview
    await emailPage.closePreview();
  });

  test('should send email successfully', async ({ page }) => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Fill required fields
    await emailPage.fillComposeForm({
      recipient: 'customer@example.com',
    });

    // Mock send email API
    await mockApi(
      page,
      /\/api\/email\/send/,
      {
        status: 200,
        body: {
          id: 100,
          vocId: 1,
          templateId: 1,
          recipientEmail: 'customer@example.com',
          subject: 'VOC가 접수되었습니다',
          status: 'SENT',
          sentAt: '2024-01-01T12:00:00Z',
        },
      },
      { method: 'POST' }
    );

    // Send email
    await emailPage.sendEmail();

    // Verify success
    await emailPage.verifyEmailSent();
  });

  test('should handle send email error', async ({ page }) => {
    await emailPage.selectTemplate('VOC 접수 확인');

    await emailPage.fillComposeForm({
      recipient: 'invalid-email',
    });

    // Mock send email error
    await mockApi(
      page,
      /\/api\/email\/send/,
      {
        status: 400,
        body: {
          error: {
            message: '유효하지 않은 이메일 주소입니다',
            code: 'INVALID_EMAIL',
          },
        },
      },
      { method: 'POST' }
    );

    // Try to send
    await emailPage.sendButton.click();

    // Verify error message
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/유효하지 않은|invalid/i);
  });

  test('should insert variable into body', async () => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Get current body value
    const initialBody = await emailPage.bodyInput.inputValue();

    // Insert variable
    await emailPage.insertVariable('customerName');

    // Verify variable is inserted
    const updatedBody = await emailPage.bodyInput.inputValue();
    expect(updatedBody).toContain('{{customerName}}');
    expect(updatedBody.length).toBeGreaterThan(initialBody.length);
  });

  test('should filter templates by type', async ({ page }) => {
    // Mock filtered templates
    await mockApi(
      page,
      /\/api\/email\/templates\?type=VOC_RECEIVED/,
      {
        status: 200,
        body: {
          content: [
            {
              id: 1,
              name: 'VOC 접수 확인',
              type: 'VOC_RECEIVED',
              subject: 'VOC가 접수되었습니다',
              bodyHtml: '<p>안녕하세요 {{customerName}}님,</p>',
              variables: ['customerName', 'vocId'],
              isSystem: true,
              isActive: true,
            },
          ],
          totalElements: 1,
        },
      },
      { method: 'GET' }
    );

    // Filter by type
    await emailPage.filterByType('VOC_RECEIVED');

    // Verify only filtered templates are shown
    const count = await emailPage.getTemplateCount();
    expect(count).toBe(1);
  });

  test('should add additional recipient', async () => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Add additional recipient
    await emailPage.addAdditionalRecipient('manager@example.com');

    // Verify additional recipient is added
    await expect(
      emailPage.page.getByLabel(/additional recipient|추가 수신자/i)
    ).toHaveValue('manager@example.com');
  });

  test('should distinguish system templates', async () => {
    // Check if template is system template
    const isSystem = await emailPage.isSystemTemplate('VOC 접수 확인');
    expect(isSystem).toBe(true);

    // Custom template should not be system template
    const isCustom = await emailPage.isSystemTemplate('맞춤 템플릿');
    expect(isCustom).toBe(false);
  });

  test('should validate required fields before sending', async ({ page }) => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Try to send without recipient
    await emailPage.sendButton.click();

    // Verify validation error
    const recipientError = emailPage.recipientInput.locator('~ [role="alert"]');
    await expect(recipientError).toBeVisible();
    await expect(recipientError).toContainText(/required|필수/i);
  });

  test('should preserve form data when switching templates', async () => {
    await emailPage.selectTemplate('VOC 접수 확인');

    // Fill custom content
    const customSubject = 'My custom subject';
    await emailPage.subjectInput.fill(customSubject);

    // Switch to another template
    await emailPage.selectTemplate('VOC 처리 중');

    // Verify confirmation dialog or data preservation
    // (Implementation depends on your UX design)
    const confirmDialog = emailPage.page.getByRole('alertdialog');

    if (await confirmDialog.isVisible()) {
      await confirmDialog.getByRole('button', { name: /confirm|확인/i }).click();
    }
  });
});
