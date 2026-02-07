package com.geonho.vocautobot.domain.voc;

import com.geonho.vocautobot.domain.common.Auditable;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Pure domain model for VOC (Voice of Customer).
 * This class contains only business logic without any JPA/persistence dependencies.
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class VocDomain implements Auditable {

    private final Long id;
    private final String ticketId;
    private String title;
    private String content;
    private VocStatus status;
    private VocPriority priority;
    private Long categoryId;
    private final String customerEmail;
    private final String customerName;
    private final String customerPhone;
    private Long assigneeId;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    @Builder.Default
    private List<VocAttachmentDomain> attachments = new ArrayList<>();

    @Builder.Default
    private List<VocMemoDomain> memos = new ArrayList<>();

    /**
     * Factory method to create a new VOC.
     */
    public static VocDomain create(
            String ticketId,
            String title,
            String content,
            Long categoryId,
            String customerEmail,
            String customerName,
            String customerPhone,
            VocPriority priority
    ) {
        validateRequired(ticketId, "ticketId");
        validateRequired(title, "title");
        validateRequired(content, "content");
        validateRequired(customerEmail, "customerEmail");

        return VocDomain.builder()
                .ticketId(ticketId)
                .title(title)
                .content(content)
                .status(VocStatus.NEW)
                .priority(priority != null ? priority : VocPriority.NORMAL)
                .categoryId(categoryId)
                .customerEmail(customerEmail)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .attachments(new ArrayList<>())
                .memos(new ArrayList<>())
                .build();
    }

    /**
     * Updates the VOC status with validation.
     *
     * @param newStatus the new status to transition to
     * @throws IllegalStateException if the transition is not allowed
     */
    public void updateStatus(VocStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("New status cannot be null");
        }

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

    /**
     * Updates the priority.
     *
     * @param priority the new priority
     */
    public void updatePriority(VocPriority priority) {
        if (priority != null) {
            this.priority = priority;
        }
    }

    /**
     * Updates the category.
     *
     * @param categoryId the new category ID
     */
    public void updateCategory(Long categoryId) {
        if (categoryId != null) {
            this.categoryId = categoryId;
        }
    }

    /**
     * Assigns this VOC to a user.
     * If the VOC is NEW, it transitions to IN_PROGRESS.
     *
     * @param userId the user ID to assign
     */
    public void assign(Long userId) {
        this.assigneeId = userId;
        if (this.status == VocStatus.NEW) {
            this.status = VocStatus.IN_PROGRESS;
        }
    }

    /**
     * Unassigns this VOC.
     */
    public void unassign() {
        this.assigneeId = null;
    }

    /**
     * Updates the basic information (title and content).
     *
     * @param title   the new title
     * @param content the new content
     */
    public void updateInfo(String title, String content) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
    }

    /**
     * Adds an attachment to this VOC.
     *
     * @param attachment the attachment to add
     */
    public void addAttachment(VocAttachmentDomain attachment) {
        if (attachment != null) {
            this.attachments.add(attachment);
        }
    }

    /**
     * Removes an attachment from this VOC.
     *
     * @param attachment the attachment to remove
     */
    public void removeAttachment(VocAttachmentDomain attachment) {
        if (attachment != null) {
            this.attachments.remove(attachment);
        }
    }

    /**
     * Adds a memo to this VOC.
     *
     * @param memo the memo to add
     */
    public void addMemo(VocMemoDomain memo) {
        if (memo != null) {
            this.memos.add(memo);
        }
    }

    /**
     * Gets an unmodifiable view of attachments.
     *
     * @return unmodifiable list of attachments
     */
    public List<VocAttachmentDomain> getAttachments() {
        return attachments != null ? Collections.unmodifiableList(attachments) : Collections.emptyList();
    }

    /**
     * Gets an unmodifiable view of memos.
     *
     * @return unmodifiable list of memos
     */
    public List<VocMemoDomain> getMemos() {
        return memos != null ? Collections.unmodifiableList(memos) : Collections.emptyList();
    }

    /**
     * Checks if this VOC is assigned to someone.
     *
     * @return true if assigned
     */
    public boolean isAssigned() {
        return assigneeId != null;
    }

    /**
     * Checks if this VOC is resolved or closed.
     *
     * @return true if resolved or closed
     */
    public boolean isResolved() {
        return status == VocStatus.RESOLVED || status == VocStatus.CLOSED;
    }

    /**
     * Checks if this VOC is new (not yet persisted).
     *
     * @return true if id is null
     */
    public boolean isNew() {
        return id == null;
    }

    /**
     * Returns the text used for embedding vector generation.
     * Single source of truth for embedding text construction.
     */
    public String getEmbeddingSourceText() {
        return title + "\n" + content;
    }

    private static void validateRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }

    /**
     * Creates a copy with internal mutable lists for builder pattern support.
     * This is used internally by the persistence layer for reconstruction.
     */
    public static VocDomainBuilder builderForReconstruction() {
        return VocDomain.builder();
    }

    /**
     * Sets the mutable attachments list (for persistence layer reconstruction).
     */
    public void setAttachmentsForReconstruction(List<VocAttachmentDomain> attachments) {
        this.attachments = attachments != null ? new ArrayList<>(attachments) : new ArrayList<>();
    }

    /**
     * Sets the mutable memos list (for persistence layer reconstruction).
     */
    public void setMemosForReconstruction(List<VocMemoDomain> memos) {
        this.memos = memos != null ? new ArrayList<>(memos) : new ArrayList<>();
    }
}
