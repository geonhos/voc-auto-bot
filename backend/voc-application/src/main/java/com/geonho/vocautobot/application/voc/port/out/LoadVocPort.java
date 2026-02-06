package com.geonho.vocautobot.application.voc.port.out;

import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Output port for loading VOC domain models from persistence.
 * This port returns pure domain models without any JPA dependencies.
 */
public interface LoadVocPort {

    Optional<VocDomain> loadVocById(Long id);

    Optional<VocDomain> loadVocByTicketId(String ticketId);

    /**
     * Loads VOC by ticket ID and customer email.
     * This method performs a single query that validates both ticketId and email together.
     * Used for public inquiry to prevent information disclosure.
     *
     * @param ticketId the ticket ID
     * @param email the customer email (case-insensitive)
     * @return Optional containing the VOC if both ticketId and email match, empty otherwise
     */
    Optional<VocDomain> loadVocByTicketIdAndEmail(String ticketId, String email);

    Page<VocDomain> loadVocList(
            VocStatus status,
            VocPriority priority,
            Long categoryId,
            Long assigneeId,
            String customerEmail,
            String search,
            Pageable pageable
    );

    List<VocDomain> loadVocsByIds(List<Long> ids);

    boolean existsByTicketId(String ticketId);
}
