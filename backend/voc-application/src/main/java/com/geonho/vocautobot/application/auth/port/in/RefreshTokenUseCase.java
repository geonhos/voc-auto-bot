package com.geonho.vocautobot.application.auth.port.in;

import com.geonho.vocautobot.application.auth.port.in.dto.TokenResult;

public interface RefreshTokenUseCase {

    TokenResult refresh(String refreshToken);
}
