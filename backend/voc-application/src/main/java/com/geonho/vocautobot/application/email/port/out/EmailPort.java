package com.geonho.vocautobot.application.email.port.out;

/**
 * 이메일 발송 Port 인터페이스
 * 실제 이메일 발송을 위한 외부 시스템 연동 인터페이스
 */
public interface EmailPort {

    /**
     * 이메일 발송
     *
     * @param recipientEmail 수신자 이메일
     * @param recipientName 수신자 이름
     * @param subject 이메일 제목
     * @param body 이메일 본문
     * @throws EmailSendException 이메일 발송 실패 시
     */
    void sendEmail(String recipientEmail, String recipientName, String subject, String body)
            throws EmailSendException;

    /**
     * 이메일 발송 예외
     */
    class EmailSendException extends Exception {
        public EmailSendException(String message) {
            super(message);
        }

        public EmailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
