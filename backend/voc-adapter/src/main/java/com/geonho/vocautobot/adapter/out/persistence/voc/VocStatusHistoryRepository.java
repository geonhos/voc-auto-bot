package com.geonho.vocautobot.adapter.out.persistence.voc;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocStatusHistoryRepository extends JpaRepository<VocStatusHistoryJpaEntity, Long> {
    List<VocStatusHistoryJpaEntity> findByVocIdOrderByCreatedAtAsc(Long vocId);
}
