package com.geonho.vocautobot.application.auth.usecase;

import com.geonho.vocautobot.application.auth.port.in.LogoutUseCase;
import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import com.geonho.vocautobot.application.common.UseCase;
import lombok.RequiredArgsConstructor;

@UseCase
@RequiredArgsConstructor
public class LogoutService implements LogoutUseCase {

    private final TokenPort tokenPort;

    @Override
    public void logout(String accessToken) {
        // TODO: 액세스 토큰에서 username 추출하여 리프레시 토큰 삭제
        // 현재는 클라이언트에서 토큰을 삭제하는 방식으로 처리
    }
}
