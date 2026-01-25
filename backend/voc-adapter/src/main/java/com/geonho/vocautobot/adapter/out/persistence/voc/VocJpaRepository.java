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

    boolean existsByTicketId(String ticketId);

    @Query("SELECT COUNT(v) FROM VocJpaEntity v WHERE CAST(v.createdAt AS date) = :date")
    long countByCreatedDate(@Param("date") LocalDate date);
}
