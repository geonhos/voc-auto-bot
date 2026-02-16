package com.geonho.vocautobot.adapter.out.persistence.voc;

import com.geonho.vocautobot.adapter.out.persistence.common.BaseJpaEntity;
import com.geonho.vocautobot.adapter.out.persistence.converter.AesEncryptConverter;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Entity
@Table(name = "vocs", indexes = {
    @Index(name = "idx_voc_ticket_id", columnList = "ticket_id", unique = true),
    @Index(name = "idx_voc_status", columnList = "status"),
    @Index(name = "idx_voc_category", columnList = "category_id"),
    @Index(name = "idx_voc_assignee", columnList = "assignee_id"),
    @Index(name = "idx_voc_created_at", columnList = "created_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VocJpaEntity extends BaseJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "ticket_id", nullable = false, unique = true, length = 20)
    private String ticketId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VocStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VocPriority priority;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Convert(converter = AesEncryptConverter.class)
    @Column(name = "customer_email", nullable = false, length = 512)
    private String customerEmail;

    @Convert(converter = AesEncryptConverter.class)
    @Column(name = "customer_name", length = 512)
    private String customerName;

    @Convert(converter = AesEncryptConverter.class)
    @Column(name = "customer_phone", length = 512)
    private String customerPhone;

    @Column(name = "customer_email_hash", length = 64)
    private String customerEmailHash;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "sentiment", length = 20)
    private String sentiment;

    @Column(name = "sentiment_confidence")
    private Double sentimentConfidence;

    @OneToMany(mappedBy = "voc", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VocAttachmentJpaEntity> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "voc", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VocMemoJpaEntity> memos = new ArrayList<>();

    public VocJpaEntity(String ticketId, String title, String content, VocStatus status,
                        VocPriority priority, Long categoryId, String customerEmail,
                        String customerName, String customerPhone, Long assigneeId) {
        this.ticketId = ticketId;
        this.title = title;
        this.content = content;
        this.status = status;
        this.priority = priority;
        this.categoryId = categoryId;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.assigneeId = assigneeId;
    }

    public void updateSentiment(String sentiment, Double sentimentConfidence) {
        this.sentiment = sentiment;
        this.sentimentConfidence = sentimentConfidence;
    }

    public void update(String title, String content, VocStatus status, VocPriority priority,
                      Long categoryId, Long assigneeId) {
        if (title != null) {
            this.title = title;
        }
        if (content != null) {
            this.content = content;
        }
        if (status != null) {
            this.status = status;
            updateStatusTimestamps(status);
        }
        if (priority != null) {
            this.priority = priority;
        }
        if (categoryId != null) {
            this.categoryId = categoryId;
        }
        this.assigneeId = assigneeId;
    }

    private void updateStatusTimestamps(VocStatus status) {
        if (status == VocStatus.RESOLVED && this.resolvedAt == null) {
            this.resolvedAt = LocalDateTime.now();
        } else if (status == VocStatus.CLOSED && this.closedAt == null) {
            this.closedAt = LocalDateTime.now();
        }
    }

    @PrePersist
    @PreUpdate
    private void computeEmailHash() {
        if (this.customerEmail != null) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(this.customerEmail.getBytes(StandardCharsets.UTF_8));
                this.customerEmailHash = HexFormat.of().formatHex(hash);
            } catch (NoSuchAlgorithmException e) {
                throw new RuntimeException("SHA-256 not available", e);
            }
        }
    }

    public void addAttachment(VocAttachmentJpaEntity attachment) {
        this.attachments.add(attachment);
        attachment.setVoc(this);
    }

    public void addMemo(VocMemoJpaEntity memo) {
        this.memos.add(memo);
        memo.setVoc(this);
    }
}
