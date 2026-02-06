package com.geonho.vocautobot.application.voc.port.in.dto;

import com.geonho.vocautobot.domain.voc.VocStatus;

import java.time.LocalDateTime;

/**
 * Result DTO for similar VOC queries.
 * Contains VOC metadata enriched with similarity score from AI service.
 *
 * @param id          the VOC ID
 * @param ticketId    the VOC ticket ID
 * @param title       the VOC title
 * @param status      the VOC status
 * @param similarity  the similarity score (0.0 to 1.0)
 * @param createdAt   the VOC creation time
 */
public record SimilarVocResult(
        Long id,
        String ticketId,
        String title,
        VocStatus status,
        double similarity,
        LocalDateTime createdAt
) {
}
