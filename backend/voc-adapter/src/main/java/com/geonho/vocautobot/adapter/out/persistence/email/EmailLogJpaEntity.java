package com.geonho.vocautobot.adapter.out.persistence.email;

import com.geonho.vocautobot.adapter.out.persistence.common.BaseJpaEntity;
import com.geonho.vocautobot.domain.email.EmailStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_logs", indexes = {
        @Index(name = "idx_email_logs_template_id", columnList = "template_id"),
        @Index(name = "idx_email_logs_recipient_email", columnList = "recipient_email"),
        @Index(name = "idx_email_logs_status", columnList = "status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailLogJpaEntity extends BaseJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Column(name = "recipient_name", length = 100)
    private String recipientName;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EmailStatus status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public EmailLogJpaEntity(Long templateId, String recipientEmail, String recipientName,
                            String subject, String body, EmailStatus status,
                            LocalDateTime sentAt, String errorMessage) {
        this.templateId = templateId;
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.subject = subject;
        this.body = body;
        this.status = status != null ? status : EmailStatus.PENDING;
        this.sentAt = sentAt;
        this.errorMessage = errorMessage;
    }

    public void markAsSent() {
        this.status = EmailStatus.SENT;
        this.sentAt = LocalDateTime.now();
        this.errorMessage = null;
    }

    public void markAsFailed(String errorMessage) {
        this.status = EmailStatus.FAILED;
        this.errorMessage = errorMessage;
    }
}
