import { test, expect } from '@playwright/test';
import { CategoryPage } from '../pages/CategoryPage';
import { mockApi } from '../utils/test-helpers';

/**
 * @description E2E tests for Category Management (SC-09)
 * Tests cover CRUD operations, tree display, and drag-and-drop reordering
 */
test.describe('Category Management - SC-09', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);

    // Mock categories API
    await mockApi(
      page,
      /\/api\/categories\/tree/,
      {
        status: 200,
        body: [
          {
            id: 1,
            name: '제품 문의',
            code: 'PRODUCT',
            description: '제품 관련 문의',
            parentId: null,
            isActive: true,
            displayOrder: 1,
            children: [
              {
                id: 11,
                name: '기능 문의',
                code: 'PRODUCT_FEATURE',
                description: '제품 기능 문의',
                parentId: 1,
                isActive: true,
                displayOrder: 1,
                children: [],
              },
              {
                id: 12,
                name: '가격 문의',
                code: 'PRODUCT_PRICE',
                description: '가격 관련 문의',
                parentId: 1,
                isActive: true,
                displayOrder: 2,
                children: [],
              },
            ],
          },
          {
            id: 2,
            name: '기술 지원',
            code: 'SUPPORT',
            description: '기술 지원 요청',
            parentId: null,
            isActive: true,
            displayOrder: 2,
            children: [
              {
                id: 21,
                name: '설치 지원',
                code: 'SUPPORT_INSTALL',
                description: '설치 관련 지원',
                parentId: 2,
                isActive: true,
                displayOrder: 1,
                children: [],
              },
            ],
          },
          {
            id: 3,
            name: '비활성 카테고리',
            code: 'INACTIVE',
            description: '비활성화된 카테고리',
            parentId: null,
            isActive: false,
            displayOrder: 3,
            children: [],
          },
        ],
      },
      { method: 'GET' }
    );

    await categoryPage.goto();
  });

  test('should display category tree', async () => {
    // Verify category count (including children)
    const count = await categoryPage.getCategoryCount();
    expect(count).toBeGreaterThan(0);

    // Verify root categories are visible
    await categoryPage.verifyCategoryExists('제품 문의');
    await categoryPage.verifyCategoryExists('기술 지원');
  });

  test('should expand and collapse category nodes', async () => {
    // Expand category
    await categoryPage.expandCategory('제품 문의');

    // Verify children are visible
    await categoryPage.verifyCategoryExists('기능 문의');
    await categoryPage.verifyCategoryExists('가격 문의');

    // Collapse category
    await categoryPage.collapseCategory('제품 문의');

    // Children might still be in DOM but hidden
    // Verify collapse state by checking aria-expanded or class
    const categoryNode = categoryPage.categoryNode.filter({
      hasText: '제품 문의',
    });
    const expandButton = categoryNode.getByRole('button', {
      name: /expand|펼치기/i,
    });

    // Button should show it can be expanded again
    await expect(expandButton).toBeVisible();
  });

  test('should create new category', async ({ page }) => {
    // Mock create API
    await mockApi(
      page,
      /\/api\/categories/,
      {
        status: 201,
        body: {
          id: 100,
          name: '새로운 카테고리',
          code: 'NEW_CATEGORY',
          description: '테스트 카테고리',
          parentId: null,
          isActive: true,
          displayOrder: 4,
          children: [],
        },
      },
      { method: 'POST' }
    );

    // Mock updated tree after creation
    await mockApi(
      page,
      /\/api\/categories\/tree/,
      {
        status: 200,
        body: [
          {
            id: 100,
            name: '새로운 카테고리',
            code: 'NEW_CATEGORY',
            description: '테스트 카테고리',
            parentId: null,
            isActive: true,
            displayOrder: 4,
            children: [],
          },
        ],
      },
      { method: 'GET' }
    );

    // Create category
    await categoryPage.createCategory({
      name: '새로운 카테고리',
      code: 'NEW_CATEGORY',
      description: '테스트 카테고리',
      isActive: true,
    });

    // Verify category was created
    await categoryPage.verifyCategoryExists('새로운 카테고리');
  });

  test('should create subcategory', async ({ page }) => {
    await mockApi(
      page,
      /\/api\/categories/,
      {
        status: 201,
        body: {
          id: 101,
          name: '하위 카테고리',
          code: 'SUB_CATEGORY',
          description: '하위 카테고리',
          parentId: 1,
          isActive: true,
          displayOrder: 3,
          children: [],
        },
      },
      { method: 'POST' }
    );

    // Create subcategory
    await categoryPage.createCategory({
      name: '하위 카테고리',
      code: 'SUB_CATEGORY',
      description: '하위 카테고리',
      parent: '제품 문의',
      isActive: true,
    });

    // Expand parent to see child
    await categoryPage.expandCategory('제품 문의');

    // Verify subcategory was created
    await categoryPage.verifyCategoryExists('하위 카테고리');
  });

  test('should edit category', async ({ page }) => {
    // Mock update API
    await mockApi(
      page,
      /\/api\/categories\/1/,
      {
        status: 200,
        body: {
          id: 1,
          name: '제품 문의 (수정됨)',
          code: 'PRODUCT_UPDATED',
          description: '수정된 설명',
          parentId: null,
          isActive: true,
          displayOrder: 1,
          children: [],
        },
      },
      { method: 'PUT' }
    );

    // Edit category
    await categoryPage.editCategory('제품 문의', {
      name: '제품 문의 (수정됨)',
      code: 'PRODUCT_UPDATED',
      description: '수정된 설명',
    });

    // Verify category was updated
    await categoryPage.verifyCategoryExists('제품 문의 (수정됨)');
  });

  test('should delete category', async ({ page }) => {
    // Mock delete API
    await mockApi(
      page,
      /\/api\/categories\/3/,
      {
        status: 204,
        body: null,
      },
      { method: 'DELETE' }
    );

    // Delete category
    await categoryPage.deleteCategory('비활성 카테고리');

    // Verify category was deleted
    await categoryPage.verifyCategoryNotExists('비활성 카테고리');
  });

  test('should prevent deletion of category with children', async ({ page }) => {
    // Mock delete error
    await mockApi(
      page,
      /\/api\/categories\/1/,
      {
        status: 400,
        body: {
          error: {
            message: '하위 카테고리가 있는 카테고리는 삭제할 수 없습니다',
            code: 'CATEGORY_HAS_CHILDREN',
          },
        },
      },
      { method: 'DELETE' }
    );

    // Try to delete category with children
    await categoryPage.selectCategory('제품 문의');
    await categoryPage.deleteButton.click();
    await categoryPage.confirmDialog
      .getByRole('button', { name: /confirm|확인|삭제/i })
      .click();

    // Verify error message
    const errorAlert = categoryPage.page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/하위 카테고리|children/i);

    // Category should still exist
    await categoryPage.verifyCategoryExists('제품 문의');
  });

  test('should reorder categories via drag and drop', async ({ page }) => {
    // Mock reorder API
    await mockApi(
      page,
      /\/api\/categories\/reorder/,
      {
        status: 200,
        body: { success: true },
      },
      { method: 'POST' }
    );

    // Drag and drop to reorder
    await categoryPage.dragAndDropCategory('제품 문의', '기술 지원');

    // Verify success toast
    const toast = page.getByRole('status');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/success|성공|순서|변경/i);
  });

  test('should display inactive category badge', async () => {
    // Verify inactive badge
    await categoryPage.verifyCategoryInactive('비활성 카테고리');
  });

  test('should validate required fields when creating category', async () => {
    // Click create button
    await categoryPage.createButton.click();

    // Try to save without filling required fields
    await categoryPage.saveButton.click();

    // Verify validation errors
    await categoryPage.verifyValidationError('name', /required|필수/i);
    await categoryPage.verifyValidationError('code', /required|필수/i);
  });

  test('should validate code format', async ({ page }) => {
    await categoryPage.createButton.click();

    await categoryPage.nameInput.fill('테스트 카테고리');
    await categoryPage.codeInput.fill('invalid code with spaces');

    await categoryPage.saveButton.click();

    // Verify code format validation
    await categoryPage.verifyValidationError(
      'code',
      /invalid|format|형식|영문|숫자/i
    );
  });

  test('should prevent duplicate category code', async ({ page }) => {
    // Mock duplicate code error
    await mockApi(
      page,
      /\/api\/categories/,
      {
        status: 409,
        body: {
          error: {
            message: '이미 존재하는 코드입니다',
            code: 'DUPLICATE_CODE',
          },
        },
      },
      { method: 'POST' }
    );

    await categoryPage.createButton.click();

    await categoryPage.fillComposeForm({
      name: '중복 카테고리',
      code: 'PRODUCT', // Existing code
      description: '테스트',
    });

    await categoryPage.saveButton.click();

    // Verify error message
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/중복|duplicate/i);
  });

  test('should cancel category creation', async () => {
    await categoryPage.createButton.click();

    // Fill some data
    await categoryPage.nameInput.fill('취소될 카테고리');
    await categoryPage.codeInput.fill('CANCEL_TEST');

    // Cancel
    await categoryPage.cancelForm();

    // Verify form is closed and category was not created
    await categoryPage.verifyCategoryNotExists('취소될 카테고리');
  });

  test('should toggle category active status', async ({ page }) => {
    await mockApi(
      page,
      /\/api\/categories\/1/,
      {
        status: 200,
        body: {
          id: 1,
          name: '제품 문의',
          code: 'PRODUCT',
          description: '제품 관련 문의',
          parentId: null,
          isActive: false,
          displayOrder: 1,
          children: [],
        },
      },
      { method: 'PUT' }
    );

    // Edit category to deactivate
    await categoryPage.editCategory('제품 문의', {
      isActive: false,
    });

    // Verify inactive badge appears
    await categoryPage.verifyCategoryInactive('제품 문의');
  });

  test('should display child categories count', async () => {
    // Expand category
    await categoryPage.expandCategory('제품 문의');

    // Get child categories
    const children = await categoryPage.getChildCategories('제품 문의');

    // Verify count
    expect(children.length).toBeGreaterThan(0);
    expect(children).toContain('기능 문의');
    expect(children).toContain('가격 문의');
  });

  test('should navigate to subcategory details', async () => {
    // Expand parent
    await categoryPage.expandCategory('제품 문의');

    // Select child
    await categoryPage.selectCategory('기능 문의');

    // Verify selection (might highlight or show details)
    const selectedNode = categoryPage.categoryNode.filter({
      hasText: '기능 문의',
    });
    await expect(selectedNode).toHaveClass(/selected|active|highlighted/i);
  });

  test('should search categories', async ({ page }) => {
    // Mock search API
    await mockApi(
      page,
      /\/api\/categories\/search\?query=기능/,
      {
        status: 200,
        body: [
          {
            id: 11,
            name: '기능 문의',
            code: 'PRODUCT_FEATURE',
            description: '제품 기능 문의',
            parentId: 1,
            isActive: true,
          },
        ],
      },
      { method: 'GET' }
    );

    // Perform search
    const searchInput = page.getByPlaceholder(/search|검색/i);
    await searchInput.fill('기능');

    // Verify filtered results
    await categoryPage.verifyCategoryExists('기능 문의');
    await categoryPage.verifyCategoryNotExists('가격 문의');
  });
});
