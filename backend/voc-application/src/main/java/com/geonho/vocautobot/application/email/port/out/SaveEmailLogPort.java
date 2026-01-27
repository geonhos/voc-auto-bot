package com.geonho.vocautobot.application.email.port.out;

import com.geonho.vocautobot.domain.email.EmailLog;

/**
 * 이메일 로그 저장 Port 인터페이스
 */
public interface SaveEmailLogPort {

    /**
     * 이메일 로그 저장
     *
     * @param emailLog 이메일 로그
     * @return 저장된 이메일 로그
     */
    EmailLog saveEmailLog(EmailLog emailLog);
}
