package com.geonho.vocautobot.application.auth.port.in;

public interface LogoutUseCase {
    void logout(String refreshToken);
}
