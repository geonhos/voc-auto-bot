package com.geonho.vocautobot.domain.email;

/**
 * 이메일 발송 상태를 나타내는 Enum
 */
public enum EmailStatus {
    /**
     * 발송 대기
     */
    PENDING,

    /**
     * 발송 성공
     */
    SENT,

    /**
     * 발송 실패
     */
    FAILED
}
