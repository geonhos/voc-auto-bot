package com.geonho.vocautobot.application.auth.port.in;

import com.geonho.vocautobot.application.auth.port.in.dto.TokenRefreshCommand;
import com.geonho.vocautobot.application.auth.port.in.dto.TokenRefreshResult;

public interface RefreshTokenUseCase {
    TokenRefreshResult refresh(TokenRefreshCommand command);
}
