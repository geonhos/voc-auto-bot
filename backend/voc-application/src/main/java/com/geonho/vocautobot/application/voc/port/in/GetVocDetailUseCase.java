package com.geonho.vocautobot.application.voc.port.in;

import com.geonho.vocautobot.domain.voc.VocDomain;

import java.util.Optional;

/**
 * Use case for retrieving VOC detail
 */
public interface GetVocDetailUseCase {

    VocDomain getVocById(Long id);

    VocDomain getVocByTicketId(String ticketId);

    /**
     * Retrieves VOC by ticket ID and customer email.
     * This method is used for public inquiry where both ticketId and email must match.
     * Returns Optional to prevent information disclosure about VOC existence.
     *
     * @param ticketId the ticket ID
     * @param email the customer email
     * @return Optional containing the VOC if both ticketId and email match, empty otherwise
     */
    Optional<VocDomain> getVocByTicketIdAndEmail(String ticketId, String email);
}
