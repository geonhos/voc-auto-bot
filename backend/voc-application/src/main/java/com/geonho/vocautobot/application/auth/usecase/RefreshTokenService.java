package com.geonho.vocautobot.application.auth.usecase;

import com.geonho.vocautobot.application.auth.port.in.RefreshTokenUseCase;
import com.geonho.vocautobot.application.auth.port.in.dto.TokenResult;
import com.geonho.vocautobot.application.auth.port.out.LoadUserPort;
import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.AuthenticationFailedException;
import lombok.RequiredArgsConstructor;

@UseCase
@RequiredArgsConstructor
public class RefreshTokenService implements RefreshTokenUseCase {

    private final TokenPort tokenPort;
    private final LoadUserPort loadUserPort;

    @Override
    public TokenResult refresh(String refreshToken) {
        // 리프레시 토큰 검증
        if (!tokenPort.validateRefreshToken(refreshToken)) {
            throw new AuthenticationFailedException("유효하지 않은 리프레시 토큰입니다");
        }

        // 토큰에서 사용자명 추출
        String username = tokenPort.getUsernameFromRefreshToken(refreshToken);

        // 저장된 리프레시 토큰과 비교
        String storedToken = tokenPort.getRefreshToken(username)
                .orElseThrow(() -> new AuthenticationFailedException("리프레시 토큰이 만료되었습니다"));

        if (!storedToken.equals(refreshToken)) {
            throw new AuthenticationFailedException("유효하지 않은 리프레시 토큰입니다");
        }

        // 사용자 정보 조회
        LoadUserPort.AuthUserInfo user = loadUserPort.loadUserByUsername(username)
                .orElseThrow(() -> new AuthenticationFailedException("사용자를 찾을 수 없습니다"));

        // 새 토큰 발급
        String newAccessToken = tokenPort.createAccessToken(user.id(), user.username(), user.role());
        String newRefreshToken = tokenPort.createRefreshToken(username);

        // 새 리프레시 토큰 저장
        tokenPort.saveRefreshToken(username, newRefreshToken);

        return new TokenResult(newAccessToken, newRefreshToken);
    }
}
