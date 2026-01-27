package com.geonho.vocautobot.application.email.event;

import com.geonho.vocautobot.domain.email.EmailStatus;

import java.time.LocalDateTime;

/**
 * 이메일 발송 완료 이벤트
 */
public class EmailSentEvent {

    private final Long emailLogId;
    private final Long templateId;
    private final String recipientEmail;
    private final String recipientName;
    private final EmailStatus status;
    private final LocalDateTime sentAt;
    private final String errorMessage;

    private EmailSentEvent(Long emailLogId, Long templateId, String recipientEmail,
                          String recipientName, EmailStatus status, LocalDateTime sentAt,
                          String errorMessage) {
        this.emailLogId = emailLogId;
        this.templateId = templateId;
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.status = status;
        this.sentAt = sentAt;
        this.errorMessage = errorMessage;
    }

    /**
     * 발송 성공 이벤트 생성
     */
    public static EmailSentEvent success(Long emailLogId, Long templateId, String recipientEmail,
                                        String recipientName, LocalDateTime sentAt) {
        return new EmailSentEvent(emailLogId, templateId, recipientEmail, recipientName,
                EmailStatus.SENT, sentAt, null);
    }

    /**
     * 발송 실패 이벤트 생성
     */
    public static EmailSentEvent failure(Long emailLogId, Long templateId, String recipientEmail,
                                        String recipientName, String errorMessage) {
        return new EmailSentEvent(emailLogId, templateId, recipientEmail, recipientName,
                EmailStatus.FAILED, null, errorMessage);
    }

    public boolean isSuccess() {
        return status == EmailStatus.SENT;
    }

    public boolean isFailed() {
        return status == EmailStatus.FAILED;
    }

    // Getters
    public Long getEmailLogId() {
        return emailLogId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public EmailStatus getStatus() {
        return status;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}
