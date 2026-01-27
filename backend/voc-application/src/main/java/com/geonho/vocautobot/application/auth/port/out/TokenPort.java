package com.geonho.vocautobot.application.auth.port.out;

import java.util.Optional;

public interface TokenPort {

    String createAccessToken(Long userId, String username, String role);

    String createRefreshToken(String username);

    void saveRefreshToken(String username, String refreshToken);

    Optional<String> getRefreshToken(String username);

    void deleteRefreshToken(String username);

    boolean validateRefreshToken(String refreshToken);

    String getUsernameFromRefreshToken(String refreshToken);
}
