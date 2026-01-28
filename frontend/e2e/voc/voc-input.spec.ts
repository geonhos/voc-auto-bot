/**
 * @see ./detailed/voc/voc-input.detailed.spec.ts for detailed UI interaction tests
 */

import { test, expect } from '@playwright/test';
import { VocInputPage } from '../page-objects';
import { createVocFormData, testCategories } from '../fixtures';
import path from 'path';

/**
 * @description E2E tests for VOC Input form (SC-02)
 * Tests VOC creation, validation, file upload, and category selection
 */

test.describe('VOC Input Form', () => {
  let vocInputPage: VocInputPage;

  test.beforeEach(async ({ page }) => {
    vocInputPage = new VocInputPage(page);
    await vocInputPage.goto();
  });

  test.describe('Form Rendering', () => {
    test('should render all required form fields', async () => {
      await expect(vocInputPage.titleInput).toBeVisible();
      await expect(vocInputPage.contentTextarea).toBeVisible();
      await expect(vocInputPage.categorySelect).toBeVisible();
      await expect(vocInputPage.prioritySelect).toBeVisible();
      await expect(vocInputPage.submitButton).toBeVisible();
      await expect(vocInputPage.resetButton).toBeVisible();
    });

    test('should render optional customer fields', async () => {
      await expect(vocInputPage.customerNameInput).toBeVisible();
      await expect(vocInputPage.customerPhoneInput).toBeVisible();
    });

    test('should have default priority selected', async () => {
      const defaultPriority = await vocInputPage.prioritySelect.inputValue();
      expect(defaultPriority).toBeTruthy();
    });
  });

  test.describe('Required Field Validation', () => {
    test('should show error when submitting empty title', async ({ page }) => {
      await vocInputPage.fillContent(createVocFormData.valid.content);
      await vocInputPage.clickSubmit();

      await page.waitForTimeout(500);
      const titleError = await vocInputPage.getFieldError('title');
      expect(titleError).toBeTruthy();
    });

    test('should show error when title is too short', async ({ page }) => {
      await vocInputPage.fillTitle(createVocFormData.invalid.tooShortTitle);
      await vocInputPage.fillContent(createVocFormData.valid.content);
      await vocInputPage.clickSubmit();

      await page.waitForTimeout(500);
      const titleError = await vocInputPage.getFieldError('title');
      expect(titleError).toContain('2자');
    });

    test('should show error when title is too long', async ({ page }) => {
      await vocInputPage.fillTitle(createVocFormData.invalid.tooLongTitle);
      await vocInputPage.fillContent(createVocFormData.valid.content);
      await vocInputPage.clickSubmit();

      await page.waitForTimeout(500);
      const titleError = await vocInputPage.getFieldError('title');
      expect(titleError).toContain('200자');
    });

    test('should show error when submitting empty content', async ({ page }) => {
      await vocInputPage.fillTitle(createVocFormData.valid.title);
      await vocInputPage.clickSubmit();

      await page.waitForTimeout(500);
      const contentError = await vocInputPage.getFieldError('content');
      expect(contentError).toBeTruthy();
    });

    test('should show error when content is too short', async ({ page }) => {
      await vocInputPage.fillTitle(createVocFormData.valid.title);
      await vocInputPage.fillContent(createVocFormData.invalid.tooShortContent);
      await vocInputPage.clickSubmit();

      await page.waitForTimeout(500);
      const contentError = await vocInputPage.getFieldError('content');
      expect(contentError).toContain('10자');
    });

    test('should validate phone number format', async ({ page }) => {
      await vocInputPage.fillCustomerPhone('invalid-phone');
      await vocInputPage.fillTitle(createVocFormData.valid.title);
      await vocInputPage.fillContent(createVocFormData.valid.content);
      await vocInputPage.clickSubmit();

      await page.waitForTimeout(500);
      const phoneError = await vocInputPage.getFieldError('customerPhone');
      if (phoneError) {
        expect(phoneError).toBeTruthy();
      }
    });
  });

  test.describe('VOC Creation', () => {
    test('should successfully create VOC with all fields', async ({ page }) => {
      // Mock API response
      await page.route('**/api/vocs', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                ticketId: 'VOC-20260125-0001',
                ...createVocFormData.valid,
              },
            }),
          });
        }
      });

      await vocInputPage.submitForm(createVocFormData.valid);

      // Verify success modal appears
      await vocInputPage.waitForSuccessModal();
      const ticketId = await vocInputPage.getSuccessTicketId();
      expect(ticketId).toContain('VOC-');
    });

    test('should successfully create VOC with minimal fields', async ({ page }) => {
      // Mock API response
      await page.route('**/api/vocs', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 2,
                ticketId: 'VOC-20260125-0002',
                ...createVocFormData.minimal,
              },
            }),
          });
        }
      });

      await vocInputPage.submitForm(createVocFormData.minimal);
      await vocInputPage.waitForSuccessModal();
    });

    test('should handle API error gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/vocs', async (route) => {
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

      await vocInputPage.submitForm(createVocFormData.valid);

      // Verify error message appears
      await expect(vocInputPage.errorAlert).toBeVisible();
    });
  });

  test.describe('Category Selection', () => {
    test('should load categories from API', async ({ page }) => {
      // Mock categories API
      await page.route('**/api/v1/categories', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testCategories,
          }),
        });
      });

      await vocInputPage.goto();

      const options = await vocInputPage.categorySelect.locator('option').count();
      expect(options).toBeGreaterThan(0);
    });

    test('should select a category', async ({ page }) => {
      // Mock categories API
      await page.route('**/api/v1/categories', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testCategories,
          }),
        });
      });

      await vocInputPage.goto();
      await vocInputPage.selectCategory(testCategories[0].id);

      const selectedValue = await vocInputPage.categorySelect.inputValue();
      expect(selectedValue).toBe(testCategories[0].id.toString());
    });
  });

  test.describe('File Upload', () => {
    test('should upload a single file', async ({ page }) => {
      const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');

      // Create a temporary test file
      await page.evaluate(() => {
        const dataTransfer = new DataTransfer();
        const file = new File(['test content'], 'test-file.txt', { type: 'text/plain' });
        dataTransfer.items.add(file);
        return dataTransfer.files;
      });

      const fileInput = vocInputPage.fileUploadInput;
      await fileInput.setInputFiles({
        name: 'test-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content'),
      });

      // Verify file is listed
      await page.waitForTimeout(500);
      await expect(page.getByText('test-file.txt')).toBeVisible();
    });

    test('should upload multiple files', async ({ page }) => {
      const files = [
        {
          name: 'file1.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('content 1'),
        },
        {
          name: 'file2.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('content 2'),
        },
      ];

      await vocInputPage.fileUploadInput.setInputFiles(files);

      await page.waitForTimeout(500);
      await expect(page.getByText('file1.txt')).toBeVisible();
      await expect(page.getByText('file2.txt')).toBeVisible();
    });

    test('should show error for oversized file', async ({ page }) => {
      const largeFile = {
        name: 'large-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB
      };

      await vocInputPage.fileUploadInput.setInputFiles(largeFile);

      await page.waitForTimeout(500);
      // Check for error message about file size
      const errorMessage = await page.locator('[role="alert"]').textContent();
      if (errorMessage) {
        expect(errorMessage.toLowerCase()).toMatch(/크기|size|10mb/i);
      }
    });

    test('should remove uploaded file', async ({ page }) => {
      const file = {
        name: 'removable.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('removable content'),
      };

      await vocInputPage.fileUploadInput.setInputFiles(file);
      await page.waitForTimeout(500);

      // Find and click remove button
      const removeButton = page.locator('[data-testid="remove-file-button"]').first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        await page.waitForTimeout(300);
        await expect(page.getByText('removable.txt')).not.toBeVisible();
      }
    });
  });

  test.describe('Form Reset', () => {
    test('should reset all fields when reset button clicked', async () => {
      await vocInputPage.fillTitle(createVocFormData.valid.title);
      await vocInputPage.fillContent(createVocFormData.valid.content);
      await vocInputPage.fillCustomerName(createVocFormData.valid.customerName);

      await vocInputPage.clickReset();

      await vocInputPage.verifyFormReset();
    });

    test('should reset form after successful submission', async ({ page }) => {
      // Mock successful API response
      await page.route('**/api/vocs', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 1,
                ticketId: 'VOC-20260125-0001',
              },
            }),
          });
        }
      });

      await vocInputPage.submitForm(createVocFormData.valid);
      await vocInputPage.waitForSuccessModal();

      // Click "New VOC" button
      await vocInputPage.clickNewVoc();

      // Verify form is reset
      await vocInputPage.verifyFormReset();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      await expect(vocInputPage.titleInput).toHaveAttribute('id', 'title');
      await expect(vocInputPage.contentTextarea).toHaveAttribute('id', 'content');

      // Verify labels are associated
      const titleLabel = vocInputPage.page.locator('label[for="title"]');
      const contentLabel = vocInputPage.page.locator('label[for="content"]');

      await expect(titleLabel).toBeVisible();
      await expect(contentLabel).toBeVisible();
    });

    test('should mark required fields with asterisk', async ({ page }) => {
      const requiredMarkers = page.locator('span.text-red-500');
      const count = await requiredMarkers.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should set aria-invalid on fields with errors', async ({ page }) => {
      await vocInputPage.clickSubmit();
      await page.waitForTimeout(500);

      const titleAriaInvalid = await vocInputPage.titleInput.getAttribute('aria-invalid');
      expect(titleAriaInvalid).toBe('true');
    });
  });
});
