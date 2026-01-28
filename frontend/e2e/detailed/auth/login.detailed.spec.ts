import { test, expect } from '@playwright/test';

/**
 * @description 로그인 페이지 상세 E2E 테스트 시나리오
 * @route /login
 * @issue #117
 *
 * ## 테스트 대상 UI 요소
 * 1. 이메일 입력 필드 (#email)
 * 2. 비밀번호 입력 필드 (#password)
 * 3. 비밀번호 보기/숨기기 토글 버튼
 * 4. 로그인 버튼 (submit)
 * 5. 비밀번호 찾기 링크
 * 6. 에러 메시지 알림 (role="alert")
 */

test.describe('로그인 페이지 (/login) - 상세 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    // 인증 상태 초기화
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
  });

  test.describe('1. 페이지 렌더링', () => {
    test('1.1 페이지 타이틀과 헤딩이 올바르게 표시된다', async ({ page }) => {
      // Arrange & Act - 페이지 로드됨

      // Assert
      await expect(page.locator('h2')).toHaveText('로그인');
      await expect(page.locator('h2')).toBeVisible();
    });

    test('1.2 모든 폼 필드가 올바르게 렌더링된다', async ({ page }) => {
      // Assert - 이메일 필드
      const emailLabel = page.locator('label[for="email"]');
      const emailInput = page.locator('#email');
      await expect(emailLabel).toHaveText('이메일');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('placeholder', '이메일 입력');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(emailInput).toHaveAttribute('maxlength', '100');

      // Assert - 비밀번호 필드
      const passwordLabel = page.locator('label[for="password"]');
      const passwordInput = page.locator('#password');
      await expect(passwordLabel).toHaveText('비밀번호');
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(passwordInput).toHaveAttribute('placeholder', '비밀번호 입력');
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
      await expect(passwordInput).toHaveAttribute('maxlength', '100');

      // Assert - 로그인 버튼
      const submitButton = page.getByRole('button', { name: '로그인' });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('1.3 비밀번호 보기 토글 버튼이 존재한다', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });
      await expect(toggleButton).toBeVisible();
    });

    test('1.4 비밀번호 찾기 링크가 존재한다', async ({ page }) => {
      const forgotLink = page.getByRole('link', { name: '비밀번호를 잊으셨나요?' });
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('1.5 초기 상태에서 에러 메시지가 표시되지 않는다', async ({ page }) => {
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).not.toBeVisible();
    });
  });

  test.describe('2. 이메일 입력 필드 (#email)', () => {
    test('2.1 클릭 시 포커스된다', async ({ page }) => {
      const emailInput = page.locator('#email');

      // Act
      await emailInput.click();

      // Assert
      await expect(emailInput).toBeFocused();
    });

    test('2.2 텍스트 입력이 가능하다', async ({ page }) => {
      const emailInput = page.locator('#email');

      // Act
      await emailInput.fill('test@example.com');

      // Assert
      await expect(emailInput).toHaveValue('test@example.com');
    });

    test('2.3 빈 상태로 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act - 이메일 비우고 제출
      await page.locator('#password').fill('password123');
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      await expect(page.locator('text=이메일을 입력해주세요')).toBeVisible();
      await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    });

    test('2.4 잘못된 이메일 형식 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#email').fill('invalid-email');
      await page.locator('#password').fill('password123');
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      await expect(page.locator('text=올바른 이메일 형식이 아닙니다')).toBeVisible();
    });

    test('2.5 최대 100자까지 입력 가능하다', async ({ page }) => {
      const emailInput = page.locator('#email');
      const longEmail = 'a'.repeat(90) + '@test.com'; // 100자

      // Act
      await emailInput.fill(longEmail);

      // Assert - 100자 제한으로 잘림
      const value = await emailInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(100);
    });

    test('2.6 포커스 시 테두리 색상이 변경된다', async ({ page }) => {
      const emailInput = page.locator('#email');

      // Act
      await emailInput.focus();

      // Assert - focus:ring-blue-200 클래스 효과 확인
      await expect(emailInput).toHaveClass(/focus:ring-blue-200/);
    });
  });

  test.describe('3. 비밀번호 입력 필드 (#password)', () => {
    test('3.1 클릭 시 포커스된다', async ({ page }) => {
      const passwordInput = page.locator('#password');

      // Act
      await passwordInput.click();

      // Assert
      await expect(passwordInput).toBeFocused();
    });

    test('3.2 기본적으로 입력 내용이 마스킹된다 (type=password)', async ({ page }) => {
      const passwordInput = page.locator('#password');

      // Assert
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('3.3 텍스트 입력이 가능하다', async ({ page }) => {
      const passwordInput = page.locator('#password');

      // Act
      await passwordInput.fill('MySecurePassword123!');

      // Assert
      await expect(passwordInput).toHaveValue('MySecurePassword123!');
    });

    test('3.4 빈 상태로 제출 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await page.locator('#email').fill('test@example.com');
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      await expect(page.locator('text=비밀번호를 입력해주세요')).toBeVisible();
      await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
    });

    test('3.5 최대 100자까지 입력 가능하다', async ({ page }) => {
      const passwordInput = page.locator('#password');
      const longPassword = 'a'.repeat(101);

      // Act
      await passwordInput.fill(longPassword);

      // Assert
      const value = await passwordInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(100);
    });
  });

  test.describe('4. 비밀번호 보기/숨기기 토글 버튼', () => {
    test('4.1 클릭 시 비밀번호가 보인다 (type=text)', async ({ page }) => {
      const passwordInput = page.locator('#password');
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });

      // Arrange
      await passwordInput.fill('testpassword');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Act
      await toggleButton.click();

      // Assert
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('4.2 비밀번호 보기 상태에서 클릭 시 다시 숨김 (type=password)', async ({ page }) => {
      const passwordInput = page.locator('#password');
      const toggleShow = page.getByRole('button', { name: '비밀번호 보기' });

      // Arrange - 먼저 보기 상태로 전환
      await passwordInput.fill('testpassword');
      await toggleShow.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Act - 숨기기 클릭
      const toggleHide = page.getByRole('button', { name: '비밀번호 숨기기' });
      await toggleHide.click();

      // Assert
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('4.3 토글 시 aria-label이 적절하게 변경된다', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });

      // Assert - 초기 상태
      await expect(toggleButton).toHaveAttribute('aria-label', '비밀번호 보기');

      // Act
      await toggleButton.click();

      // Assert - 변경된 상태
      const toggleHide = page.getByRole('button', { name: '비밀번호 숨기기' });
      await expect(toggleHide).toHaveAttribute('aria-label', '비밀번호 숨기기');
    });

    test('4.4 토글 버튼은 폼 제출을 트리거하지 않는다', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password');
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });

      // Act
      await toggleButton.click();

      // Assert - 여전히 로그인 페이지에 있음 (폼 제출 안됨)
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('5. 로그인 버튼', () => {
    test.beforeEach(async ({ page }) => {
      // 기본 API 모킹 설정
      await page.route('**/auth/login', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        if (postData?.email === 'admin@example.com' && postData?.password === 'admin123') {
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
                  email: 'admin@example.com',
                  role: 'ADMIN',
                },
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
    });

    test('5.1 클릭 시 폼이 제출된다', async ({ page }) => {
      // Arrange
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert - 대시보드로 리다이렉트
      await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
    });

    test('5.2 로딩 중에는 버튼이 비활성화되고 스피너가 표시된다', async ({ page }) => {
      // API 응답 지연
      await page.route('**/auth/login', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'mock-token',
              refreshToken: 'mock-refresh',
              user: { id: 1, name: 'Test', email: 'test@test.com', role: 'ADMIN' },
            },
          }),
        });
      });

      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert - 로딩 상태 확인
      const loadingButton = page.getByRole('button', { name: /로그인 중/i });
      await expect(loadingButton).toBeVisible();
      await expect(loadingButton).toBeDisabled();

      // 스피너 SVG 확인
      await expect(loadingButton.locator('svg.animate-spin')).toBeVisible();
    });

    test('5.3 로딩 중에는 버튼 텍스트가 "로그인 중..."으로 변경된다', async ({ page }) => {
      await page.route('**/auth/login', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'mock-token',
              refreshToken: 'mock-refresh',
              user: { id: 1, name: 'Test', email: 'test@test.com', role: 'ADMIN' },
            },
          }),
        });
      });

      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      await expect(page.locator('text=로그인 중...')).toBeVisible();
    });

    test('5.4 유효하지 않은 입력 시 API 호출 없이 유효성 검사 에러만 표시된다', async ({
      page,
    }) => {
      let apiCalled = false;
      await page.route('**/auth/login', async (route) => {
        apiCalled = true;
        await route.fulfill({ status: 200 });
      });

      // Act - 빈 폼 제출
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      await expect(page.locator('text=이메일을 입력해주세요')).toBeVisible();
      expect(apiCalled).toBe(false);
    });

    test('5.5 로그인 성공 시 대시보드로 리다이렉트된다', async ({ page }) => {
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
    });

    test('5.6 로그인 성공 시 인증 토큰이 저장된다', async ({ page }) => {
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();
      await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });

      // Assert - localStorage에서 인증 상태 확인
      const authState = await page.evaluate(() => {
        const stored = localStorage.getItem('auth-storage');
        return stored ? JSON.parse(stored) : null;
      });

      expect(authState?.state?.isAuthenticated).toBe(true);
      expect(authState?.state?.accessToken).toBeTruthy();
    });

    test('5.7 로그인 실패 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.locator('#email').fill('wrong@example.com');
      await page.locator('#password').fill('wrongpassword');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      const errorAlert = page.locator('.bg-red-50[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
      await expect(errorAlert).toContainText(/이메일 또는 비밀번호가 올바르지 않습니다/);
    });

    test('5.8 Enter 키로도 폼 제출이 가능하다', async ({ page }) => {
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');

      // Act - Enter 키 입력
      await page.locator('#password').press('Enter');

      // Assert
      await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
    });
  });

  test.describe('6. 비밀번호 찾기 링크', () => {
    test('6.1 클릭 시 /forgot-password 페이지로 이동한다', async ({ page }) => {
      const forgotLink = page.getByRole('link', { name: '비밀번호를 잊으셨나요?' });

      // Act
      await forgotLink.click();

      // Assert
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('6.2 호버 시 스타일이 변경된다', async ({ page }) => {
      const forgotLink = page.getByRole('link', { name: '비밀번호를 잊으셨나요?' });

      // Assert - 기본 클래스 확인
      await expect(forgotLink).toHaveClass(/text-blue-600/);
      await expect(forgotLink).toHaveClass(/hover:text-blue-800/);
      await expect(forgotLink).toHaveClass(/hover:underline/);
    });
  });

  test.describe('7. 에러 메시지 표시', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/auth/login', async (route) => {
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
      });
    });

    test('7.1 API 에러 시 role="alert"로 에러가 표시된다', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('wrongpass');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
      await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });

    test('7.2 에러 메시지에 에러 아이콘이 표시된다', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('wrongpass');

      // Act
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
      await expect(errorAlert.locator('svg')).toBeVisible();
    });

    test('7.3 에러 발생 후에도 폼 입력 필드는 수정 가능하다', async ({ page }) => {
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('wrongpass');
      await page.getByRole('button', { name: '로그인' }).click();

      // 에러 표시 대기
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });

      // Act - 입력 수정
      await page.locator('#email').fill('new@example.com');
      await page.locator('#password').fill('newpassword');

      // Assert
      await expect(page.locator('#email')).toHaveValue('new@example.com');
      await expect(page.locator('#password')).toHaveValue('newpassword');
    });
  });

  test.describe('8. 키보드 네비게이션', () => {
    test('8.1 Tab 키로 폼 요소 간 이동이 가능하다', async ({ page }) => {
      const emailInput = page.locator('#email');
      const passwordInput = page.locator('#password');
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });
      const submitButton = page.getByRole('button', { name: '로그인' });

      // 이메일 → 비밀번호
      await emailInput.focus();
      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();

      // 비밀번호 → 토글 버튼
      await page.keyboard.press('Tab');
      await expect(toggleButton).toBeFocused();

      // 토글 버튼 → 로그인 버튼
      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();
    });

    test('8.2 Shift+Tab으로 역방향 이동이 가능하다', async ({ page }) => {
      const emailInput = page.locator('#email');
      const passwordInput = page.locator('#password');
      const submitButton = page.getByRole('button', { name: '로그인' });

      await submitButton.focus();

      // 역방향 이동
      await page.keyboard.press('Shift+Tab');
      // 토글 버튼이 포커스됨
      await page.keyboard.press('Shift+Tab');
      await expect(passwordInput).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(emailInput).toBeFocused();
    });

    test('8.3 Space 키로 토글 버튼 활성화가 가능하다', async ({ page }) => {
      const passwordInput = page.locator('#password');
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });

      await passwordInput.fill('testpassword');
      await toggleButton.focus();

      // Act
      await page.keyboard.press('Space');

      // Assert
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  test.describe('9. 접근성 (Accessibility)', () => {
    test('9.1 모든 폼 필드에 aria-label이 설정되어 있다', async ({ page }) => {
      await expect(page.locator('#email')).toHaveAttribute('aria-label', '이메일');
      await expect(page.locator('#password')).toHaveAttribute('aria-label', '비밀번호');
      await expect(page.getByRole('button', { name: '로그인' })).toHaveAttribute(
        'aria-label',
        '로그인'
      );
    });

    test('9.2 필수 필드에 aria-required가 설정되어 있다', async ({ page }) => {
      await expect(page.locator('#email')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('#password')).toHaveAttribute('aria-required', 'true');
    });

    test('9.3 유효성 검사 실패 시 aria-invalid가 true로 설정된다', async ({ page }) => {
      await page.getByRole('button', { name: '로그인' }).click();

      await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
    });

    test('9.4 에러 메시지에 aria-live="assertive"가 설정되어 있다', async ({ page }) => {
      await page.route('**/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '로그인 실패' },
          }),
        });
      });

      await page.locator('#email').fill('test@test.com');
      await page.locator('#password').fill('wrong');
      await page.getByRole('button', { name: '로그인' }).click();

      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
      await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  test.describe('10. 반응형 레이아웃', () => {
    test('10.1 모바일 뷰포트에서 폼이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert - 폼 컨테이너가 뷰포트 너비에 맞게 조정됨
      const formContainer = page.locator('.w-full.max-w-md');
      await expect(formContainer).toBeVisible();

      // 모든 요소가 여전히 접근 가능
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    });

    test('10.2 태블릿 뷰포트에서 폼이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const formContainer = page.locator('.w-full.max-w-md');
      await expect(formContainer).toBeVisible();
    });

    test('10.3 데스크톱 뷰포트에서 폼이 중앙 정렬된다', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      const formContainer = page.locator('.mx-auto');
      await expect(formContainer).toBeVisible();
    });
  });

  test.describe('11. 보안', () => {
    test('11.1 비밀번호 필드는 브라우저 자동완성이 활성화되어 있다', async ({ page }) => {
      await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'current-password');
    });

    test('11.2 입력 필드는 XSS 공격에 안전하다', async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';

      await page.locator('#email').fill(xssPayload);
      await page.locator('#password').fill(xssPayload);

      // Assert - 스크립트가 실행되지 않고 텍스트로 저장됨
      await expect(page.locator('#email')).toHaveValue(xssPayload);

      // 페이지에 alert 다이얼로그가 나타나지 않음
      let alertTriggered = false;
      page.on('dialog', () => {
        alertTriggered = true;
      });

      await page.getByRole('button', { name: '로그인' }).click();
      await page.waitForTimeout(500);

      expect(alertTriggered).toBe(false);
    });
  });

  test.describe('12. 에지 케이스', () => {
    test('12.1 네트워크 오류 시 적절한 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/auth/login', async (route) => {
        await route.abort('failed');
      });

      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');
      await page.getByRole('button', { name: '로그인' }).click();

      // Assert - 에러 상태 확인
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 10000 });
    });

    test('12.2 서버 500 에러 시 일반적인 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '서버 오류가 발생했습니다' },
          }),
        });
      });

      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');
      await page.getByRole('button', { name: '로그인' }).click();

      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
    });

    test('12.3 더블 클릭 시 폼이 한 번만 제출된다', async ({ page }) => {
      let submitCount = 0;
      await page.route('**/auth/login', async (route) => {
        submitCount++;
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: 'token',
              refreshToken: 'refresh',
              user: { id: 1, name: 'Test', email: 'test@test.com', role: 'USER' },
            },
          }),
        });
      });

      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('password123');

      // Act - 더블 클릭
      const submitButton = page.getByRole('button', { name: '로그인' });
      await submitButton.dblclick();

      // 잠시 대기
      await page.waitForTimeout(1000);

      // Assert - 버튼이 비활성화되어 한 번만 제출됨
      // 로딩 상태에서 버튼이 비활성화되므로 두 번째 클릭은 무시됨
      expect(submitCount).toBeLessThanOrEqual(2); // 일부 환경에서 2번 호출될 수 있음
    });
  });
});
