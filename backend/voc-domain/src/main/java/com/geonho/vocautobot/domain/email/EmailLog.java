package com.geonho.vocautobot.domain.email;

import java.time.LocalDateTime;

/**
 * 이메일 발송 이력 도메인 엔티티
 */
public class EmailLog {

    private Long id;
    private Long templateId;
    private String recipientEmail;
    private String recipientName;
    private String subject;
    private String body;
    private EmailStatus status;
    private LocalDateTime sentAt;
    private String errorMessage;
    private LocalDateTime createdAt;

    public EmailLog(Long id, Long templateId, String recipientEmail, String recipientName,
                   String subject, String body, EmailStatus status, LocalDateTime sentAt,
                   String errorMessage, LocalDateTime createdAt) {
        validateRecipientEmail(recipientEmail);
        validateSubject(subject);
        validateBody(body);

        this.id = id;
        this.templateId = templateId;
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.subject = subject;
        this.body = body;
        this.status = status != null ? status : EmailStatus.PENDING;
        this.sentAt = sentAt;
        this.errorMessage = errorMessage;
        this.createdAt = createdAt;
    }

    public static EmailLog create(Long templateId, String recipientEmail, String recipientName,
                                  String subject, String body) {
        return new EmailLog(null, templateId, recipientEmail, recipientName, subject, body,
                          EmailStatus.PENDING, null, null, null);
    }

    /**
     * 이메일 발송 성공 처리
     */
    public void markAsSent() {
        this.status = EmailStatus.SENT;
        this.sentAt = LocalDateTime.now();
        this.errorMessage = null;
    }

    /**
     * 이메일 발송 실패 처리
     */
    public void markAsFailed(String errorMessage) {
        this.status = EmailStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    /**
     * 재발송 가능 여부 확인
     */
    public boolean canRetry() {
        return this.status == EmailStatus.FAILED || this.status == EmailStatus.PENDING;
    }

    /**
     * 발송 상태 확인
     */
    public boolean isSent() {
        return this.status == EmailStatus.SENT;
    }

    public boolean isFailed() {
        return this.status == EmailStatus.FAILED;
    }

    public boolean isPending() {
        return this.status == EmailStatus.PENDING;
    }

    private void validateRecipientEmail(String recipientEmail) {
        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("수신자 이메일은 필수입니다");
        }
        if (!recipientEmail.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다");
        }
    }

    private void validateSubject(String subject) {
        if (subject == null || subject.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일 제목은 필수입니다");
        }
        if (subject.length() > 200) {
            throw new IllegalArgumentException("이메일 제목은 최대 200자까지 입력 가능합니다");
        }
    }

    private void validateBody(String body) {
        if (body == null || body.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일 본문은 필수입니다");
        }
    }

    // Getters
    public Long getId() {
        return id;
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

    public String getSubject() {
        return subject;
    }

    public String getBody() {
        return body;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // For infrastructure layer
    public void setId(Long id) {
        this.id = id;
    }
}
