package com.geonho.vocautobot.application.auth.port.out;

import java.util.Optional;

public interface LoadUserPort {

    Optional<AuthUserInfo> loadUserByUsername(String username);

    Optional<AuthUserInfo> loadUserById(Long id);

    record AuthUserInfo(
            Long id,
            String username,
            String password,
            String name,
            String email,
            String role,
            boolean isActive,
            boolean isLocked
    ) {
    }
}
