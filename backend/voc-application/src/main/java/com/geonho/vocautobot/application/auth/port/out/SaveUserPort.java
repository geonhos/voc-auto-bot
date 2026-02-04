package com.geonho.vocautobot.application.auth.port.out;

import com.geonho.vocautobot.domain.user.User;

/**
 * 인증 모듈에서 사용자 정보를 저장하기 위한 출력 포트.
 * 로그인 실패/성공 시 사용자 상태 업데이트에 사용됩니다.
 */
public interface SaveUserPort {

    /**
     * 사용자 정보를 저장합니다.
     *
     * @param user 저장할 사용자 도메인 객체
     * @return 저장된 사용자 도메인 객체
     */
    User save(User user);
}
