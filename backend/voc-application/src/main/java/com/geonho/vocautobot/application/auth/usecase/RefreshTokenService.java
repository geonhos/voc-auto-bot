package com.geonho.vocautobot.application.auth.usecase;

import com.geonho.vocautobot.application.auth.port.in.RefreshTokenUseCase;
import com.geonho.vocautobot.application.auth.port.in.dto.TokenRefreshCommand;
import com.geonho.vocautobot.application.auth.port.in.dto.TokenRefreshResult;
import com.geonho.vocautobot.application.auth.port.out.LoadUserPort;
import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.AuthenticationFailedException;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
public class RefreshTokenService implements RefreshTokenUseCase {

    private final TokenPort tokenPort;
    private final LoadUserPort loadUserPort;

    @Override
    @Transactional
    public TokenRefreshResult refresh(TokenRefreshCommand command) {
        if (!tokenPort.validateRefreshToken(command.refreshToken())) {
            throw new AuthenticationFailedException("INVALID_TOKEN", "유효하지 않은 토큰입니다");
        }

        String username = tokenPort.getUsernameFromRefreshToken(command.refreshToken());

        // Verify stored refresh token matches
        String storedToken = tokenPort.getRefreshToken(username)
                .orElseThrow(() -> new AuthenticationFailedException("TOKEN_EXPIRED", "토큰이 만료되었습니다"));

        if (!storedToken.equals(command.refreshToken())) {
            throw new AuthenticationFailedException("INVALID_TOKEN", "유효하지 않은 토큰입니다");
        }

        // Load user info to create new access token
        LoadUserPort.AuthUserInfo user = loadUserPort.loadUserByUsername(username)
                .orElseThrow(() -> new AuthenticationFailedException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (!user.isActive()) {
            throw new AuthenticationFailedException("ACCOUNT_INACTIVE", "비활성 계정입니다");
        }

        // Create new tokens
        String newAccessToken = tokenPort.createAccessToken(user.id(), user.username(), user.role());
        String newRefreshToken = tokenPort.createRefreshToken(user.username());

        // Save new refresh token (invalidates old one)
        tokenPort.saveRefreshToken(username, newRefreshToken);

        return new TokenRefreshResult(newAccessToken, newRefreshToken);
    }
}
