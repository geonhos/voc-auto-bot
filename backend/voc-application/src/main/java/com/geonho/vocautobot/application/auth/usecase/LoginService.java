package com.geonho.vocautobot.application.auth.usecase;

import com.geonho.vocautobot.application.audit.SecurityAuditPort;
import com.geonho.vocautobot.application.auth.port.in.LoginUseCase;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginCommand;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginResult;
import com.geonho.vocautobot.application.auth.port.out.LoadUserPort;
import com.geonho.vocautobot.application.auth.port.out.PasswordEncoderPort;
import com.geonho.vocautobot.application.auth.port.out.SaveUserPort;
import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.AuthenticationFailedException;
import com.geonho.vocautobot.domain.user.User;
import lombok.RequiredArgsConstructor;

@UseCase
@RequiredArgsConstructor
public class LoginService implements LoginUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;
    private final PasswordEncoderPort passwordEncoderPort;
    private final TokenPort tokenPort;
    private final SecurityAuditPort securityAuditPort;

    @Override
    public LoginResult login(LoginCommand command) {
        String clientIp = command.clientIp() != null ? command.clientIp() : "unknown";

        // 사용자 조회
        LoadUserPort.AuthUserInfo userInfo = loadUserPort.loadUserByUsername(command.email())
                .orElseThrow(() -> {
                    securityAuditPort.logLoginFailure(command.email(), clientIp, "User not found");
                    return new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다");
                });

        // 계정 상태 확인
        if (!userInfo.isActive()) {
            securityAuditPort.logLoginFailure(command.email(), clientIp, "Account inactive");
            throw new AuthenticationFailedException("비활성화된 계정입니다");
        }
        if (userInfo.isLocked()) {
            securityAuditPort.logLoginFailure(command.email(), clientIp, "Account locked");
            throw new AuthenticationFailedException("잠긴 계정입니다. 관리자에게 문의하세요.");
        }

        // 비밀번호 검증
        if (!passwordEncoderPort.matches(command.password(), userInfo.password())) {
            // 로그인 실패 기록
            int failureCount = recordLoginFailure(userInfo.id());
            securityAuditPort.logLoginFailure(command.email(), clientIp, "Invalid password", failureCount);

            // Check if account was just locked
            loadUserPort.loadUserDomainById(userInfo.id())
                    .filter(User::isLocked)
                    .ifPresent(user -> securityAuditPort.logAccountLocked(
                            command.email(), userInfo.id(), clientIp
                    ));

            throw new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        // 로그인 성공 기록
        recordLoginSuccess(userInfo.id());

        // 보안 감사 로깅
        securityAuditPort.logLoginSuccess(userInfo.email(), userInfo.id(), clientIp);

        // 토큰 생성
        String accessToken = tokenPort.createAccessToken(userInfo.id(), userInfo.username(), userInfo.role());
        String refreshToken = tokenPort.createRefreshToken(userInfo.username());

        // 리프레시 토큰 저장
        tokenPort.saveRefreshToken(userInfo.username(), refreshToken);

        return new LoginResult(
                accessToken,
                refreshToken,
                userInfo.id(),
                userInfo.email(),
                userInfo.name(),
                userInfo.role()
        );
    }

    /**
     * 로그인 실패를 기록합니다.
     * 5회 실패 시 계정이 자동으로 잠깁니다.
     *
     * @param userId 사용자 ID
     * @return the current failure count
     */
    private int recordLoginFailure(Long userId) {
        return loadUserPort.loadUserDomainById(userId)
                .map(user -> {
                    user.recordLoginFailure();
                    saveUserPort.save(user);
                    return user.getFailedLoginAttempts();
                })
                .orElse(0);
    }

    /**
     * 로그인 성공을 기록합니다.
     * 실패 카운트가 리셋되고 마지막 로그인 시간이 업데이트됩니다.
     *
     * @param userId 사용자 ID
     */
    private void recordLoginSuccess(Long userId) {
        loadUserPort.loadUserDomainById(userId)
                .ifPresent(user -> {
                    user.recordLoginSuccess();
                    saveUserPort.save(user);
                });
    }
}
