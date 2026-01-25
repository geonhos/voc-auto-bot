package com.geonho.vocautobot.application.auth.usecase;

import com.geonho.vocautobot.application.auth.port.in.LogoutUseCase;
import com.geonho.vocautobot.application.auth.port.out.TokenPort;
import com.geonho.vocautobot.application.common.UseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
public class LogoutService implements LogoutUseCase {

    private final TokenPort tokenPort;

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (tokenPort.validateRefreshToken(refreshToken)) {
            String username = tokenPort.getUsernameFromRefreshToken(refreshToken);
            tokenPort.deleteRefreshToken(username);
        }
    }
}
