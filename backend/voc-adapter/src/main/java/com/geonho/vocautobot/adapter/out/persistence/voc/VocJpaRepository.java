package com.geonho.vocautobot.adapter.out.persistence.voc;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface VocJpaRepository extends JpaRepository<VocJpaEntity, Long>,
        JpaSpecificationExecutor<VocJpaEntity> {

    Optional<VocJpaEntity> findByTicketId(String ticketId);

    /**
     * Finds VOC by ticket ID and customer email (case-insensitive).
     * Single query that validates both conditions together to prevent information disclosure.
     *
     * @param ticketId the ticket ID
     * @param email the customer email (case-insensitive comparison)
     * @return Optional containing the VOC if both conditions match
     */
    @Query("SELECT v FROM VocJpaEntity v WHERE v.ticketId = :ticketId AND LOWER(v.customerEmail) = LOWER(:email)")
    Optional<VocJpaEntity> findByTicketIdAndCustomerEmailIgnoreCase(
            @Param("ticketId") String ticketId,
            @Param("email") String email
    );

    boolean existsByTicketId(String ticketId);

    @Query("SELECT COUNT(v) FROM VocJpaEntity v WHERE CAST(v.createdAt AS date) = :date")
    long countByCreatedDate(@Param("date") LocalDate date);
}
