package com.geonho.vocautobot.application.auth.usecase;

import com.geonho.vocautobot.application.auth.port.in.LoginUseCase;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginCommand;
import com.geonho.vocautobot.application.auth.port.in.dto.LoginResult;
import com.geonho.vocautobot.application.auth.port.out.LoadUserPort;
import com.geonho.vocautobot.application.auth.port.out.PasswordEncoderPort;
import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.AuthenticationFailedException;
import lombok.RequiredArgsConstructor;

@UseCase
@RequiredArgsConstructor
public class LoginService implements LoginUseCase {

    private final LoadUserPort loadUserPort;
    private final PasswordEncoderPort passwordEncoderPort;
    private final TokenPort tokenPort;

    @Override
    public LoginResult login(LoginCommand command) {
        // 사용자 조회
        LoadUserPort.AuthUserInfo user = loadUserPort.loadUserByUsername(command.email())
                .orElseThrow(() -> new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다"));

        // 계정 상태 확인
        if (!user.isActive()) {
            throw new AuthenticationFailedException("비활성화된 계정입니다");
        }
        if (user.isLocked()) {
            throw new AuthenticationFailedException("잠긴 계정입니다");
        }

        // 비밀번호 검증
        if (!passwordEncoderPort.matches(command.password(), user.password())) {
            throw new AuthenticationFailedException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        // 토큰 생성
        String accessToken = tokenPort.createAccessToken(user.id(), user.username(), user.role());
        String refreshToken = tokenPort.createRefreshToken(user.username());

        // 리프레시 토큰 저장
        tokenPort.saveRefreshToken(user.username(), refreshToken);

        return new LoginResult(
                accessToken,
                refreshToken,
                user.id(),
                user.email(),
                user.name(),
                user.role()
        );
    }
}
