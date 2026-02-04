package com.geonho.vocautobot.domain.voc;

import com.geonho.vocautobot.domain.common.Auditable;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Pure domain model for VOC Memo.
 * This class contains only business logic without any JPA/persistence dependencies.
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id")
public class VocMemoDomain implements Auditable {

    private final Long id;
    private final Long vocId;
    private final Long authorId;
    private String content;
    private boolean internal;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    /**
     * Factory method to create a new memo.
     */
    public static VocMemoDomain create(
            Long authorId,
            String content,
            boolean internal
    ) {
        validateRequired(authorId, "authorId");
        validateRequired(content, "content");

        return VocMemoDomain.builder()
                .authorId(authorId)
                .content(content)
                .internal(internal)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Updates the content of this memo.
     *
     * @param content the new content
     */
    public void updateContent(String content) {
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
    }

    /**
     * Marks this memo as internal (visible only to staff).
     */
    public void markAsInternal() {
        this.internal = true;
    }

    /**
     * Marks this memo as public (visible to customer).
     */
    public void markAsPublic() {
        this.internal = false;
    }

    /**
     * Checks if this memo is visible to the customer.
     *
     * @return true if not internal
     */
    public boolean isVisibleToCustomer() {
        return !internal;
    }

    private static void validateRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }

    private static void validateRequired(Long value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
}
