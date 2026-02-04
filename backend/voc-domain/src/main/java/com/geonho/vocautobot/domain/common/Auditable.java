package com.geonho.vocautobot.domain.common;

import java.time.LocalDateTime;

/**
 * Interface for auditable domain objects.
 * Provides audit information (creation and modification timestamps)
 * without any JPA dependencies.
 */
public interface Auditable {

    /**
     * Gets the timestamp when the entity was created.
     *
     * @return creation timestamp
     */
    LocalDateTime getCreatedAt();

    /**
     * Gets the timestamp when the entity was last modified.
     *
     * @return last modification timestamp
     */
    LocalDateTime getUpdatedAt();
}
