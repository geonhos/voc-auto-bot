package com.geonho.vocautobot.application.auth.usecase;

import com.geonho.vocautobot.application.audit.SecurityAuditPort;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginCommand;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginResult;
import com.geonho.vocautobot.application.auth.port.out.LoadUserPort;
import com.geonho.vocautobot.application.auth.port.out.LoadUserPort.AuthUserInfo;
import com.geonho.vocautobot.application.auth.port.out.PasswordEncoderPort;
import com.geonho.vocautobot.application.auth.port.out.SaveUserPort;
import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import com.geonho.vocautobot.application.common.exception.AuthenticationFailedException;
import com.geonho.vocautobot.domain.user.User;
import com.geonho.vocautobot.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("LoginService 테스트")
class LoginServiceTest {

    @Mock
    private LoadUserPort loadUserPort;

    @Mock
    private SaveUserPort saveUserPort;

    @Mock
    private PasswordEncoderPort passwordEncoderPort;

    @Mock
    private TokenPort tokenPort;

    @Mock
    private SecurityAuditPort securityAuditPort;

    @InjectMocks
    private LoginService loginService;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    private LoginCommand loginCommand;
    private AuthUserInfo authUserInfo;
    private User user;

    @BeforeEach
    void setUp() {
        loginCommand = new LoginCommand("test@example.com", "password123", "127.0.0.1");

        authUserInfo = new AuthUserInfo(
                1L,
                "testuser",
                "encodedPassword",
                "Test User",
                "test@example.com",
                "USER",
                true,
                false
        );

        user = User.builder()
                .id(1L)
                .username("testuser")
                .password("encodedPassword")
                .name("Test User")
                .email("test@example.com")
                .role(UserRole.OPERATOR)
                .isActive(true)
                .isLocked(false)
                .failedLoginAttempts(0)
                .lastLoginAt(null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("로그인 성공 테스트")
    class LoginSuccessTest {

        @Test
        @DisplayName("올바른 자격증명으로 로그인 성공")
        void login_shouldSucceed_withValidCredentials() {
            // given
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(loginCommand.password(), authUserInfo.password()))
                    .willReturn(true);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.of(user));
            given(saveUserPort.save(any(User.class)))
                    .willReturn(user);
            given(tokenPort.createAccessToken(authUserInfo.id(), authUserInfo.username(), authUserInfo.role()))
                    .willReturn("accessToken");
            given(tokenPort.createRefreshToken(authUserInfo.username()))
                    .willReturn("refreshToken");

            // when
            LoginResult result = loginService.login(loginCommand);

            // then
            assertThat(result).isNotNull();
            assertThat(result.accessToken()).isEqualTo("accessToken");
            assertThat(result.refreshToken()).isEqualTo("refreshToken");
            assertThat(result.userId()).isEqualTo(authUserInfo.id());
            assertThat(result.email()).isEqualTo(authUserInfo.email());
            assertThat(result.name()).isEqualTo(authUserInfo.name());
            assertThat(result.role()).isEqualTo(authUserInfo.role());

            verify(tokenPort).saveRefreshToken(authUserInfo.username(), "refreshToken");
        }

        @Test
        @DisplayName("로그인 성공 시 실패 카운트가 리셋됨")
        void login_shouldResetFailedAttempts_onSuccess() {
            // given
            User userWithFailedAttempts = User.builder()
                    .id(1L)
                    .username("testuser")
                    .password("encodedPassword")
                    .name("Test User")
                    .email("test@example.com")
                    .role(UserRole.OPERATOR)
                    .isActive(true)
                    .isLocked(false)
                    .failedLoginAttempts(3)
                    .lastLoginAt(null)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(loginCommand.password(), authUserInfo.password()))
                    .willReturn(true);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.of(userWithFailedAttempts));
            given(saveUserPort.save(any(User.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));
            given(tokenPort.createAccessToken(any(), any(), any()))
                    .willReturn("accessToken");
            given(tokenPort.createRefreshToken(any()))
                    .willReturn("refreshToken");

            // when
            loginService.login(loginCommand);

            // then
            verify(saveUserPort).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(0);
            assertThat(savedUser.getLastLoginAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("로그인 실패 테스트")
    class LoginFailureTest {

        @Test
        @DisplayName("존재하지 않는 사용자로 로그인 실패")
        void login_shouldFail_whenUserNotFound() {
            // given
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class)
                    .hasMessage("이메일 또는 비밀번호가 올바르지 않습니다");

            verify(saveUserPort, never()).save(any());
        }

        @Test
        @DisplayName("비활성화된 계정으로 로그인 실패")
        void login_shouldFail_whenAccountIsInactive() {
            // given
            AuthUserInfo inactiveUser = new AuthUserInfo(
                    1L, "testuser", "encodedPassword", "Test User",
                    "test@example.com", "USER", false, false
            );
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(inactiveUser));

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class)
                    .hasMessage("비활성화된 계정입니다");

            verify(saveUserPort, never()).save(any());
        }

        @Test
        @DisplayName("잠긴 계정으로 로그인 실패")
        void login_shouldFail_whenAccountIsLocked() {
            // given
            AuthUserInfo lockedUser = new AuthUserInfo(
                    1L, "testuser", "encodedPassword", "Test User",
                    "test@example.com", "USER", true, true
            );
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(lockedUser));

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class)
                    .hasMessage("잠긴 계정입니다. 관리자에게 문의하세요.");

            verify(saveUserPort, never()).save(any());
        }

        @Test
        @DisplayName("잘못된 비밀번호로 로그인 실패 시 실패 카운트 증가")
        void login_shouldIncrementFailedAttempts_whenPasswordIsWrong() {
            // given
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(loginCommand.password(), authUserInfo.password()))
                    .willReturn(false);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.of(user));
            given(saveUserPort.save(any(User.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class)
                    .hasMessage("이메일 또는 비밀번호가 올바르지 않습니다");

            verify(saveUserPort).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(1);
        }

        @Test
        @DisplayName("5회 로그인 실패 시 계정 잠금")
        void login_shouldLockAccount_afterFiveFailedAttempts() {
            // given
            User userWithFourFailedAttempts = User.builder()
                    .id(1L)
                    .username("testuser")
                    .password("encodedPassword")
                    .name("Test User")
                    .email("test@example.com")
                    .role(UserRole.OPERATOR)
                    .isActive(true)
                    .isLocked(false)
                    .failedLoginAttempts(4)
                    .lastLoginAt(null)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(loginCommand.password(), authUserInfo.password()))
                    .willReturn(false);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.of(userWithFourFailedAttempts));
            given(saveUserPort.save(any(User.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(saveUserPort).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(5);
            assertThat(savedUser.isLocked()).isTrue();
        }
    }

    @Nested
    @DisplayName("보안 감사 로깅 테스트")
    class SecurityAuditTest {

        @Test
        @DisplayName("로그인 성공 시 보안 감사 로그 기록")
        void login_shouldLogSecurityAudit_onSuccess() {
            // given
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(loginCommand.password(), authUserInfo.password()))
                    .willReturn(true);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.of(user));
            given(saveUserPort.save(any(User.class)))
                    .willReturn(user);
            given(tokenPort.createAccessToken(any(), any(), any()))
                    .willReturn("accessToken");
            given(tokenPort.createRefreshToken(any()))
                    .willReturn("refreshToken");

            // when
            loginService.login(loginCommand);

            // then
            verify(securityAuditPort).logLoginSuccess(
                    authUserInfo.email(),
                    authUserInfo.id(),
                    "127.0.0.1"
            );
        }

        @Test
        @DisplayName("존재하지 않는 사용자로 로그인 시 보안 감사 로그 기록")
        void login_shouldLogSecurityAudit_whenUserNotFound() {
            // given
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(securityAuditPort).logLoginFailure(
                    loginCommand.email(),
                    "127.0.0.1",
                    "User not found"
            );
        }

        @Test
        @DisplayName("비밀번호 오류 시 실패 횟수와 함께 보안 감사 로그 기록")
        void login_shouldLogSecurityAudit_withFailureCount() {
            // given
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(loginCommand.password(), authUserInfo.password()))
                    .willReturn(false);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.of(user));
            given(saveUserPort.save(any(User.class)))
                    .willAnswer(invocation -> invocation.getArgument(0));

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(securityAuditPort).logLoginFailure(
                    loginCommand.email(),
                    "127.0.0.1",
                    "Invalid password",
                    1
            );
        }

        @Test
        @DisplayName("비활성화 계정 로그인 시 보안 감사 로그 기록")
        void login_shouldLogSecurityAudit_whenAccountInactive() {
            // given
            AuthUserInfo inactiveUser = new AuthUserInfo(
                    1L, "testuser", "encodedPassword", "Test User",
                    "test@example.com", "USER", false, false
            );
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(inactiveUser));

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(securityAuditPort).logLoginFailure(
                    loginCommand.email(),
                    "127.0.0.1",
                    "Account inactive"
            );
        }

        @Test
        @DisplayName("잠긴 계정 로그인 시 보안 감사 로그 기록")
        void login_shouldLogSecurityAudit_whenAccountLocked() {
            // given
            AuthUserInfo lockedUser = new AuthUserInfo(
                    1L, "testuser", "encodedPassword", "Test User",
                    "test@example.com", "USER", true, true
            );
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(lockedUser));

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class);

            verify(securityAuditPort).logLoginFailure(
                    loginCommand.email(),
                    "127.0.0.1",
                    "Account locked"
            );
        }
    }

    @Nested
    @DisplayName("Edge Case 테스트")
    class EdgeCaseTest {

        @Test
        @DisplayName("클라이언트 IP가 null인 경우 unknown으로 처리")
        void login_shouldHandleNullClientIp() {
            // given
            LoginCommand commandWithNullIp = new LoginCommand("test@example.com", "password123", null);

            given(loadUserPort.loadUserByUsername(commandWithNullIp.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(commandWithNullIp.password(), authUserInfo.password()))
                    .willReturn(true);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.of(user));
            given(saveUserPort.save(any(User.class)))
                    .willReturn(user);
            given(tokenPort.createAccessToken(any(), any(), any()))
                    .willReturn("accessToken");
            given(tokenPort.createRefreshToken(any()))
                    .willReturn("refreshToken");

            // when
            LoginResult result = loginService.login(commandWithNullIp);

            // then
            assertThat(result).isNotNull();
            verify(securityAuditPort).logLoginSuccess(
                    authUserInfo.email(),
                    authUserInfo.id(),
                    "unknown"
            );
        }

        @Test
        @DisplayName("User 도메인을 찾지 못했을 때 실패 횟수 0 반환")
        void login_shouldReturnZeroFailureCount_whenUserDomainNotFound() {
            // given
            given(loadUserPort.loadUserByUsername(loginCommand.email()))
                    .willReturn(Optional.of(authUserInfo));
            given(passwordEncoderPort.matches(loginCommand.password(), authUserInfo.password()))
                    .willReturn(false);
            given(loadUserPort.loadUserDomainById(authUserInfo.id()))
                    .willReturn(Optional.empty()); // User domain not found

            // when & then
            assertThatThrownBy(() -> loginService.login(loginCommand))
                    .isInstanceOf(AuthenticationFailedException.class);

            // Verify that 0 is logged as failure count when user domain not found
            verify(securityAuditPort).logLoginFailure(
                    loginCommand.email(),
                    "127.0.0.1",
                    "Invalid password",
                    0
            );
        }
    }
}
