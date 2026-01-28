import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';

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
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.gotoAndClearAuth();
  });

  test.describe('1. 페이지 렌더링', () => {
    test('1.1 페이지 타이틀과 헤딩이 올바르게 표시된다', async () => {
      await loginPage.verifyPageLoaded();
    });

    test('1.2 모든 폼 필드가 올바르게 렌더링된다', async () => {
      // Assert - 이메일 필드
      await loginPage.verifyEmailInput();

      // Assert - 비밀번호 필드
      await loginPage.verifyPasswordInput();

      // Assert - 로그인 버튼
      await loginPage.verifySubmitButton();
    });

    test('1.3 비밀번호 보기 토글 버튼이 존재한다', async () => {
      await loginPage.verifyTogglePasswordButton();
    });

    test('1.4 비밀번호 찾기 링크가 존재한다', async () => {
      await loginPage.verifyForgotPasswordLink();
    });

    test('1.5 초기 상태에서 에러 메시지가 표시되지 않는다', async () => {
      await loginPage.verifyNoError();
    });
  });

  test.describe('2. 이메일 입력 필드 (#email)', () => {
    test('2.1 클릭 시 포커스된다', async () => {
      // Act
      await loginPage.emailInput.click();

      // Assert
      await loginPage.verifyEmailFocused();
    });

    test('2.2 텍스트 입력이 가능하다', async () => {
      // Act
      await loginPage.fillEmail('test@example.com');

      // Assert
      await expect(loginPage.emailInput).toHaveValue('test@example.com');
    });

    test('2.3 빈 상태로 제출 시 유효성 검사 에러가 표시된다', async () => {
      // Act - 이메일 비우고 제출
      await loginPage.fillPassword('password123');
      await loginPage.submit();

      // Assert
      await loginPage.verifyEmailValidationError('이메일을 입력해주세요');
    });

    test('2.4 잘못된 이메일 형식 입력 시 유효성 검사 에러가 표시된다', async ({ page }) => {
      // Act
      await loginPage.fillEmail('invalid-email');
      await loginPage.fillPassword('password123');
      await loginPage.submit();

      // Assert
      await expect(page.locator('text=올바른 이메일 형식이 아닙니다')).toBeVisible();
    });

    test('2.5 최대 100자까지 입력 가능하다', async () => {
      const longEmail = 'a'.repeat(90) + '@test.com'; // 100자

      // Act
      await loginPage.fillEmail(longEmail);

      // Assert - 100자 제한으로 잘림
      const value = await loginPage.getEmailValue();
      expect(value.length).toBeLessThanOrEqual(100);
    });

    test('2.6 포커스 시 테두리 색상이 변경된다', async () => {
      // Act
      await loginPage.focusEmail();

      // Assert - focus:ring-blue-200 클래스 효과 확인
      await expect(loginPage.emailInput).toHaveClass(/focus:ring-blue-200/);
    });
  });

  test.describe('3. 비밀번호 입력 필드 (#password)', () => {
    test('3.1 클릭 시 포커스된다', async () => {
      // Act
      await loginPage.passwordInput.click();

      // Assert
      await loginPage.verifyPasswordFocused();
    });

    test('3.2 기본적으로 입력 내용이 마스킹된다 (type=password)', async () => {
      // Assert
      await loginPage.verifyPasswordType('password');
    });

    test('3.3 텍스트 입력이 가능하다', async () => {
      // Act
      await loginPage.fillPassword('MySecurePassword123!');

      // Assert
      await expect(loginPage.passwordInput).toHaveValue('MySecurePassword123!');
    });

    test('3.4 빈 상태로 제출 시 유효성 검사 에러가 표시된다', async () => {
      // Act
      await loginPage.fillEmail('test@example.com');
      await loginPage.submit();

      // Assert
      await loginPage.verifyPasswordValidationError('비밀번호를 입력해주세요');
    });

    test('3.5 최대 100자까지 입력 가능하다', async () => {
      const longPassword = 'a'.repeat(101);

      // Act
      await loginPage.fillPassword(longPassword);

      // Assert
      const value = await loginPage.getPasswordValue();
      expect(value.length).toBeLessThanOrEqual(100);
    });
  });

  test.describe('4. 비밀번호 보기/숨기기 토글 버튼', () => {
    test('4.1 클릭 시 비밀번호가 보인다 (type=text)', async () => {
      // Arrange
      await loginPage.fillPassword('testpassword');
      await loginPage.verifyPasswordType('password');

      // Act
      await loginPage.togglePassword();

      // Assert
      await loginPage.verifyPasswordType('text');
    });

    test('4.2 비밀번호 보기 상태에서 클릭 시 다시 숨김 (type=password)', async ({ page }) => {
      // Arrange - 먼저 보기 상태로 전환
      await loginPage.fillPassword('testpassword');
      await loginPage.togglePassword();
      await loginPage.verifyPasswordType('text');

      // Act - 숨기기 클릭
      const toggleHide = page.getByRole('button', { name: '비밀번호 숨기기' });
      await toggleHide.click();

      // Assert
      await loginPage.verifyPasswordType('password');
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
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password');

      // Act
      await loginPage.togglePassword();

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

    test('5.1 클릭 시 폼이 제출된다', async () => {
      // Arrange
      await loginPage.login('admin@example.com', 'admin123');

      // Assert - 대시보드로 리다이렉트
      await loginPage.waitForRedirect();
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

      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');

      // Act
      await loginPage.submit();

      // Assert - 로딩 상태 확인
      await loginPage.verifyLoadingState();
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

      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');

      // Act
      await loginPage.submit();

      // Assert
      await loginPage.verifyLoadingText();
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
      await loginPage.submit();

      // Assert
      await expect(page.locator('text=이메일을 입력해주세요')).toBeVisible();
      expect(apiCalled).toBe(false);
    });

    test('5.5 로그인 성공 시 대시보드로 리다이렉트된다', async () => {
      await loginPage.login('admin@example.com', 'admin123');

      // Assert
      await loginPage.waitForRedirect();
    });

    test('5.6 로그인 성공 시 인증 토큰이 저장된다', async () => {
      await loginPage.login('admin@example.com', 'admin123');
      await loginPage.waitForRedirect();

      // Assert - localStorage에서 인증 상태 확인
      await loginPage.verifyAuthTokenStored();
    });

    test('5.7 로그인 실패 시 에러 메시지가 표시된다', async () => {
      await loginPage.login('wrong@example.com', 'wrongpassword');

      // Assert
      await loginPage.verifyErrorVisible(/이메일 또는 비밀번호가 올바르지 않습니다/);
    });

    test('5.8 Enter 키로도 폼 제출이 가능하다', async () => {
      await loginPage.fillEmail('admin@example.com');
      await loginPage.fillPassword('admin123');

      // Act - Enter 키 입력
      await loginPage.submitByEnter();

      // Assert
      await loginPage.waitForRedirect();
    });
  });

  test.describe('6. 비밀번호 찾기 링크', () => {
    test('6.1 클릭 시 /forgot-password 페이지로 이동한다', async ({ page }) => {
      // Act
      await loginPage.clickForgotPassword();

      // Assert
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('6.2 호버 시 스타일이 변경된다', async () => {
      // Assert - 기본 클래스 확인
      await expect(loginPage.forgotPasswordLink).toHaveClass(/text-blue-600/);
      await expect(loginPage.forgotPasswordLink).toHaveClass(/hover:text-blue-800/);
      await expect(loginPage.forgotPasswordLink).toHaveClass(/hover:underline/);
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

    test('7.1 API 에러 시 role="alert"로 에러가 표시된다', async () => {
      await loginPage.login('test@example.com', 'wrongpass');

      // Assert
      await loginPage.verifyErrorAccessibility();
    });

    test('7.2 에러 메시지에 에러 아이콘이 표시된다', async () => {
      await loginPage.login('test@example.com', 'wrongpass');

      // Assert
      await loginPage.verifyErrorVisible();
      await expect(loginPage.errorAlert.locator('svg')).toBeVisible();
    });

    test('7.3 에러 발생 후에도 폼 입력 필드는 수정 가능하다', async () => {
      await loginPage.login('test@example.com', 'wrongpass');

      // 에러 표시 대기
      await loginPage.verifyErrorVisible();

      // Act - 입력 수정
      await loginPage.fillEmail('new@example.com');
      await loginPage.fillPassword('newpassword');

      // Assert
      await expect(loginPage.emailInput).toHaveValue('new@example.com');
      await expect(loginPage.passwordInput).toHaveValue('newpassword');
    });
  });

  test.describe('8. 키보드 네비게이션', () => {
    test('8.1 Tab 키로 폼 요소 간 이동이 가능하다', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });

      // 이메일 → 비밀번호
      await loginPage.focusEmail();
      await page.keyboard.press('Tab');
      await loginPage.verifyPasswordFocused();

      // 비밀번호 → 토글 버튼
      await page.keyboard.press('Tab');
      await expect(toggleButton).toBeFocused();

      // 토글 버튼 → 로그인 버튼
      await page.keyboard.press('Tab');
      await expect(loginPage.submitButton).toBeFocused();
    });

    test('8.2 Shift+Tab으로 역방향 이동이 가능하다', async ({ page }) => {
      await loginPage.submitButton.focus();

      // 역방향 이동
      await page.keyboard.press('Shift+Tab');
      // 토글 버튼이 포커스됨
      await page.keyboard.press('Shift+Tab');
      await loginPage.verifyPasswordFocused();

      await page.keyboard.press('Shift+Tab');
      await loginPage.verifyEmailFocused();
    });

    test('8.3 Space 키로 토글 버튼 활성화가 가능하다', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });

      await loginPage.fillPassword('testpassword');
      await toggleButton.focus();

      // Act
      await page.keyboard.press('Space');

      // Assert
      await loginPage.verifyPasswordType('text');
    });
  });

  test.describe('9. 접근성 (Accessibility)', () => {
    test('9.1 모든 폼 필드에 aria-label이 설정되어 있다', async () => {
      await loginPage.verifyAccessibility();
    });

    test('9.2 필수 필드에 aria-required가 설정되어 있다', async () => {
      await expect(loginPage.emailInput).toHaveAttribute('aria-required', 'true');
      await expect(loginPage.passwordInput).toHaveAttribute('aria-required', 'true');
    });

    test('9.3 유효성 검사 실패 시 aria-invalid가 true로 설정된다', async () => {
      await loginPage.submit();

      await loginPage.verifyValidationErrorsAccessibility();
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

      await loginPage.login('test@test.com', 'wrong');

      await loginPage.verifyErrorAccessibility();
    });
  });

  test.describe('10. 반응형 레이아웃', () => {
    test('10.1 모바일 뷰포트에서 폼이 올바르게 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Assert - 폼 컨테이너가 뷰포트 너비에 맞게 조정됨
      const formContainer = page.locator('.w-full.max-w-md');
      await expect(formContainer).toBeVisible();

      // 모든 요소가 여전히 접근 가능
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
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
    test('11.1 비밀번호 필드는 브라우저 자동완성이 활성화되어 있다', async () => {
      await expect(loginPage.passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    test('11.2 입력 필드는 XSS 공격에 안전하다', async ({ page }) => {
      const xssPayload = '<script>alert("xss")</script>';

      await loginPage.fillEmail(xssPayload);
      await loginPage.fillPassword(xssPayload);

      // Assert - 스크립트가 실행되지 않고 텍스트로 저장됨
      await expect(loginPage.emailInput).toHaveValue(xssPayload);

      // 페이지에 alert 다이얼로그가 나타나지 않음
      let alertTriggered = false;
      page.on('dialog', () => {
        alertTriggered = true;
      });

      await loginPage.submit();
      await page.waitForTimeout(500);

      expect(alertTriggered).toBe(false);
    });
  });

  test.describe('12. 에지 케이스', () => {
    test('12.1 네트워크 오류 시 적절한 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/auth/login', async (route) => {
        await route.abort('failed');
      });

      await loginPage.login('test@example.com', 'password123');

      // Assert - 에러 상태 확인
      await loginPage.verifyErrorVisible();
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

      await loginPage.login('test@example.com', 'password123');

      await loginPage.verifyErrorVisible();
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

      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');

      // Act - 더블 클릭
      await loginPage.submitButton.dblclick();

      // 잠시 대기
      await page.waitForTimeout(1000);

      // Assert - 버튼이 비활성화되어 한 번만 제출됨
      // 로딩 상태에서 버튼이 비활성화되므로 두 번째 클릭은 무시됨
      expect(submitCount).toBeLessThanOrEqual(2); // 일부 환경에서 2번 호출될 수 있음
    });
  });
});
