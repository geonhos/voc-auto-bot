package com.geonho.vocautobot.application.auth.port.out;

import com.geonho.vocautobot.domain.user.User;

import java.util.Optional;

public interface LoadUserPort {

    Optional<AuthUserInfo> loadUserByUsername(String username);

    Optional<AuthUserInfo> loadUserById(Long id);

    /**
     * 사용자 도메인 객체를 ID로 조회합니다.
     * 로그인 실패/성공 기록 업데이트 시 사용됩니다.
     *
     * @param id 사용자 ID
     * @return 사용자 도메인 객체
     */
    Optional<User> loadUserDomainById(Long id);

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
