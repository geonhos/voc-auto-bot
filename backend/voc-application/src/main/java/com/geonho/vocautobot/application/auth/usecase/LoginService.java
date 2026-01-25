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
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoginService implements LoginUseCase {

    private final LoadUserPort loadUserPort;
    private final PasswordEncoderPort passwordEncoderPort;
    private final TokenPort tokenPort;

    @Override
    @Transactional
    public LoginResult login(LoginCommand command) {
        LoadUserPort.AuthUserInfo user = loadUserPort.loadUserByUsername(command.username())
                .orElseThrow(() -> new AuthenticationFailedException("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다"));

        validateUserStatus(user);
        validatePassword(command.password(), user.password());

        String accessToken = tokenPort.createAccessToken(user.id(), user.username(), user.role());
        String refreshToken = tokenPort.createRefreshToken(user.username());

        tokenPort.saveRefreshToken(user.username(), refreshToken);

        return new LoginResult(
                accessToken,
                refreshToken,
                new LoginResult.UserInfo(
                        user.id(),
                        user.username(),
                        user.name(),
                        user.email(),
                        user.role()
                )
        );
    }

    private void validateUserStatus(LoadUserPort.AuthUserInfo user) {
        if (!user.isActive()) {
            throw new AuthenticationFailedException("ACCOUNT_INACTIVE", "비활성 계정입니다");
        }
        if (user.isLocked()) {
            throw new AuthenticationFailedException("ACCOUNT_LOCKED", "계정이 잠겼습니다. 관리자에게 문의하세요");
        }
    }

    private void validatePassword(String rawPassword, String encodedPassword) {
        if (!passwordEncoderPort.matches(rawPassword, encodedPassword)) {
            throw new AuthenticationFailedException("INVALID_CREDENTIALS", "아이디 또는 비밀번호가 일치하지 않습니다");
        }
    }
}
