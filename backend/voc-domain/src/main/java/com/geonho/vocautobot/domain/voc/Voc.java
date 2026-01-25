package com.geonho.vocautobot.domain.voc;

import com.geonho.vocautobot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
@AllArgsConstructor
@Builder
public class Voc extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false, unique = true, length = 20)
    private String ticketId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VocStatus status = VocStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VocPriority priority = VocPriority.NORMAL;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "customer_email", nullable = false, length = 100)
    private String customerEmail;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "voc", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VocAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "voc", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VocMemo> memos = new ArrayList<>();

    // Business methods
    public void updateStatus(VocStatus newStatus) {
        if (!this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                String.format("Cannot transition from %s to %s", this.status, newStatus)
            );
        }

        this.status = newStatus;

        if (newStatus == VocStatus.RESOLVED) {
            this.resolvedAt = LocalDateTime.now();
        } else if (newStatus == VocStatus.CLOSED) {
            this.closedAt = LocalDateTime.now();
        }
    }

    public void updatePriority(VocPriority priority) {
        if (priority != null) {
            this.priority = priority;
        }
    }

    public void assign(Long userId) {
        this.assigneeId = userId;
        if (this.status == VocStatus.NEW) {
            this.status = VocStatus.IN_PROGRESS;
        }
    }

    public void unassign() {
        this.assigneeId = null;
    }

    public void updateInfo(String title, String content) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
    }

    public void addAttachment(VocAttachment attachment) {
        this.attachments.add(attachment);
        attachment.setVoc(this);
    }

    public void removeAttachment(VocAttachment attachment) {
        this.attachments.remove(attachment);
        attachment.setVoc(null);
    }

    public void addMemo(VocMemo memo) {
        this.memos.add(memo);
        memo.setVoc(this);
    }

    public boolean isAssigned() {
        return assigneeId != null;
    }

    public boolean isResolved() {
        return status == VocStatus.RESOLVED || status == VocStatus.CLOSED;
    }
}
