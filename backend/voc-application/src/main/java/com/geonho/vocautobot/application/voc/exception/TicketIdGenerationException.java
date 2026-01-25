package com.geonho.vocautobot.application.voc.exception;

import com.geonho.vocautobot.application.common.exception.BusinessException;

/**
 * Exception thrown when ticket ID generation fails after max retries
 */
public class TicketIdGenerationException extends BusinessException {

    public TicketIdGenerationException(int maxRetries) {
        super("티켓 ID 생성에 실패했습니다. 최대 재시도 횟수(" + maxRetries + ")를 초과했습니다.");
    }
}
