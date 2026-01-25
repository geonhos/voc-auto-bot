package com.geonho.vocautobot.application.email.port.in;

import com.geonho.vocautobot.application.email.port.in.dto.SendEmailCommand;
import com.geonho.vocautobot.domain.email.EmailLog;

/**
 * 이메일 발송 UseCase 인터페이스
 */
public interface SendEmailUseCase {

    /**
     * 이메일 발송
     *
     * @param command 이메일 발송 커맨드
     * @return 발송된 이메일 로그
     */
    EmailLog sendEmail(SendEmailCommand command);
}
